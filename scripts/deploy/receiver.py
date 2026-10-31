"""Forced-command SSH receiver: publishes only the site's static out directory."""
import hashlib,json,os,pathlib,pwd,shutil,sys,tarfile,tempfile,time
ROOT=pathlib.Path('/opt/Project/leibox').resolve()
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

def deploy(stream):
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
   import re
   if not re.fullmatch(r'[a-f0-9]{40}',revision) or not re.fullmatch(r'[a-f0-9-]{7,64}',release):raise ValueError('Invalid release identity')
   files=manifest['files']
   if not 1<=len(files)<=30000 or len({item['path'] for item in files})!=len(files):raise ValueError('Invalid file list')
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
  account=pwd.getpwnam('www');changed=[]
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
   if not all(digest(path_for(item['path']))==item['sha256'] for item in files):raise ValueError('Post-deployment verification failed')
   if (digest(env) if env.exists() else None)!=env_hash:raise ValueError('Environment changed')
   (backup/'manifest.json').write_text(json.dumps(manifest))
   pending=STATE.with_suffix('.new');pending.write_text(json.dumps(manifest));os.replace(pending,STATE)
  except BaseException:
   for target,saved,existed in reversed(changed):
    if existed:shutil.copy2(saved,target)
    else:target.unlink(missing_ok=True)
   raise
  return {'release':release,'commit':revision,'verifiedFiles':len(files),'updatedFiles':len(changed),'archiveSha256':digest(archive),'backup':str(backup),'environmentPreserved':True}

if __name__=='__main__':
 assert str(ROOT)=='/opt/Project/leibox'
 command=os.environ.get('SSH_ORIGINAL_COMMAND','')
 try:
  if command=='manifest':print(STATE.read_text() if STATE.exists() else json.dumps({'files':[]}))
  elif command=='deploy':print(json.dumps(deploy(sys.stdin.buffer)))
  else:raise ValueError('Only manifest and deploy commands are allowed')
 except Exception as error:print(str(error),file=sys.stderr);sys.exit(1)
