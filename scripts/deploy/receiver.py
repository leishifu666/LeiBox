"""Forced-command SSH receiver: publishes only the site's static out directory."""
import hashlib,json,os,pathlib,pwd,re,shutil,sys,tarfile,tempfile
from retirement import DETAIL,component_paths,plan_retirements
ROOT=pathlib.Path(os.environ.get('LEIBOX_DEPLOY_ROOT','/opt/Project/leibox')).resolve()
STATE=ROOT/'.releases/current-manifest.json'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def path_for(name):
 p=pathlib.PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or len(p.parts)<2 or p.parts[0]!='out' or '\\' in name:raise ValueError('Invalid publication path')
 target=ROOT/str(p)
 if not target.resolve().is_relative_to(ROOT/'out'):raise ValueError('Publication path escapes out')
 if any(part.startswith('.') for part in p.parts):
  if not (len(p.parts)>2 and p.parts[1]=='.well-known'):raise ValueError('Unexpected hidden publication path')
 if target.suffix in ['.pem','.key'] or target.name.startswith('.env'):raise ValueError('Private file in publication')
 return target

def previous_files():
 if STATE.exists():return json.loads(STATE.read_text())['files']
 catalog=path_for('out/ai/catalog.json')
 if not catalog.is_file():return []
 names={'out/ai/catalog.json'}
 for entry in json.loads(catalog.read_text(encoding='utf-8'))['items']:
  route=entry.get('docsPath','')
  match=DETAIL.fullmatch('out'+route+'.html')
  if not match:continue
  files,trees=component_paths(match[1])
  names.update(files)
  for prefix,pattern in trees:
   names.update(p.relative_to(ROOT).as_posix() for p in path_for(prefix).rglob(pattern))
 return [{'path':name,'sha256':digest(target)} for name in sorted(names)
         if (target:=path_for(name)).is_file() and not target.is_symlink()]

def manifest_response():
 catalog=path_for('out/ai/catalog.json')
 manifest=json.loads(STATE.read_text()) if STATE.exists() else {'files':previous_files()}
 return {**manifest,'retirementProtocol':1,
         'liveCatalogSha256':digest(catalog) if catalog.is_file() else None}

def deploy(stream):
 releases=ROOT/'.releases';releases.mkdir(exist_ok=True)
 with (releases/'publish.lock').open('a+b') as lock:
  if os.name=='posix':
   import fcntl
   fcntl.flock(lock.fileno(),fcntl.LOCK_EX)
  try:return publish(stream)
  finally:
   if os.name=='posix':fcntl.flock(lock.fileno(),fcntl.LOCK_UN)

def publish(stream):
 releases=ROOT/'.releases';releases.mkdir(exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='incoming-',dir=releases) as temporary:
  tmp=pathlib.Path(temporary);archive=tmp/'release.tar.gz'
  total=0
  with archive.open('wb') as output:
   while True:
    chunk=stream.read(1024*1024)
    if not chunk:break
    total+=len(chunk)
    if total>512*1024*1024:raise ValueError('Archive exceeds 512 MB')
    output.write(chunk)
  with tarfile.open(archive,'r:gz') as tar:
   members=tar.getmembers();names=[member.name for member in members]
   if len(names)!=len(set(names)):raise ValueError('Duplicate archive members')
   manifest_member=tar.getmember('release-manifest.json')
   if not manifest_member.isfile() or manifest_member.size>8*1024*1024:raise ValueError('Invalid manifest')
   manifest=json.load(tar.extractfile(manifest_member))
   revision=manifest['commit'];release=manifest['release']
   if not re.fullmatch(r'[a-f0-9]{40}',revision) or not re.fullmatch(r'[a-f0-9-]{7,64}',release):raise ValueError('Invalid release identity')
   files=manifest['files']
   if not 1<=len(files)<=30000 or len({item['path'] for item in files})!=len(files):raise ValueError('Invalid file list')
   retired=manifest.get('retired',[])
   if retired!=plan_retirements(previous_files(),files):raise ValueError('Retirement plan differs from the previous release')
   for item in retired:
    target=path_for(item['path'])
    if target.resolve()!=target or target.is_symlink() or (target.exists() and (not target.is_file() or digest(target)!=item['sha256'])):
     raise ValueError('Retired file was edited: '+item['path'])
   expected={'release-manifest.json'}|{item['path'] for item in files if item['included']}
   if set(names)!=expected or any(not m.isfile() for m in members):raise ValueError('Unexpected archive contents')
   env=ROOT/'.env.local';env_hash=digest(env) if env.exists() else None
   expanded=0
   for item in files:
    target=path_for(item['path'])
    if not re.fullmatch(r'[a-f0-9]{64}',item['sha256']):raise ValueError('Invalid file digest')
    if not item['included']:
     if not target.is_file() or digest(target)!=item['sha256']:raise ValueError('Unchanged remote file differs: '+item['path'])
     continue
    if target.exists() and item.get('before') is not None and digest(target) not in [item['before'],item['sha256']]:raise ValueError('Remote file was edited: '+item['path'])
    member=tar.getmember(item['path'])
    if member.size!=item['size'] or member.size>64*1024*1024:raise ValueError('Invalid file size')
    expanded+=member.size
    if expanded>2*1024*1024*1024:raise ValueError('Expanded archive exceeds 2 GB')
    staged=tmp/item['path'];staged.parent.mkdir(parents=True,exist_ok=True)
    with tar.extractfile(member) as source,staged.open('wb') as output:shutil.copyfileobj(source,output)
    if digest(staged)!=item['sha256']:raise ValueError('File digest mismatch')
  backup=ROOT/'backups'/release
  if backup.exists():raise ValueError('Release identity already used')
  backup.mkdir(parents=True)
  previous=STATE.read_bytes() if STATE.exists() else None
  account=pwd.getpwnam('www');changed=[];retired_count=0
  try:
   for item in sorted(files,key=lambda f:(not f['path'].startswith('out/_next/'),f['path'].endswith('.html'),f['path'])):
    target=path_for(item['path'])
    if target.is_file() and digest(target)==item['sha256']:continue
    saved=backup/item['path'];existed=target.exists()
    if existed:saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,saved)
    target.parent.mkdir(parents=True,exist_ok=True)
    pending=target.with_name(target.name+'.deploy-new')
    try:
     shutil.copyfile(tmp/item['path'],pending)
     os.chmod(pending,0o644);os.chown(pending,account.pw_uid,account.pw_gid);os.replace(pending,target)
    finally:pending.unlink(missing_ok=True)
    changed.append((target,saved,existed))
   for item in retired:
    target=path_for(item['path'])
    if not target.exists():continue
    saved=backup/item['path'];saved.parent.mkdir(parents=True,exist_ok=True)
    os.replace(target,saved)
    changed.append((target,saved,True));retired_count+=1
   if not all(digest(path_for(item['path']))==item['sha256'] for item in files):raise ValueError('Post-deployment verification failed')
   if any(path_for(item['path']).exists() for item in retired):raise ValueError('Retired files still exist')
   if (digest(env) if env.exists() else None)!=env_hash:raise ValueError('Environment changed')
   (backup/'manifest.json').write_text(json.dumps(manifest))
   if previous is not None:(backup/'previous-manifest.json').write_bytes(previous)
   pending=STATE.with_suffix('.new');pending.write_text(json.dumps(manifest));os.replace(pending,STATE)
  except BaseException:
   for target,saved,existed in reversed(changed):
    if existed:shutil.copy2(saved,target)
    else:target.unlink(missing_ok=True)
   (backup/'manifest.json').unlink(missing_ok=True)
   (backup/'previous-manifest.json').unlink(missing_ok=True)
   raise
  return {'release':release,'commit':revision,'verifiedFiles':len(files),'updatedFiles':len(changed)-retired_count,'retiredFiles':retired_count,'archiveSha256':digest(archive),'backup':str(backup),'environmentPreserved':True}

if __name__=='__main__':
 command=os.environ.get('SSH_ORIGINAL_COMMAND','')
 try:
  if command not in ('manifest','deploy'):raise ValueError('Only manifest and deploy commands are allowed')
  if not (ROOT/'out').is_dir():raise ValueError('The configured LeiBox export directory is missing')
  if os.environ.get('LEIBOX_DEPLOY_RUN_AS_WEB_USER')=='1' and os.geteuid()==0:
   account=pwd.getpwnam('www')
   os.initgroups(account.pw_name,account.pw_gid)
   os.setgid(account.pw_gid)
   os.setuid(account.pw_uid)
  if command=='manifest':print(json.dumps(manifest_response()))
  else:print(json.dumps(deploy(sys.stdin.buffer)))
 except Exception as error:print(str(error),file=sys.stderr);sys.exit(1)
