import pathlib,json,hashlib,tarfile,sys
source=pathlib.Path(sys.argv[1]).resolve();folder=pathlib.Path(sys.argv[2]).resolve();commit=sys.argv[3];release=sys.argv[4]
baseline={item['path']:item['sha256'] for item in json.loads((folder/'baseline.json').read_text(encoding='utf-8'))['files']}
files=[]
for p in sorted((source/'out').rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(source).as_posix()
 if rel.startswith('out/previews/') or any(rel.startswith('out/'+name) for name in ['404-preview','logo-transition-preview','submit-state-preview']):continue
 assert not p.is_symlink() and p.suffix not in ['.pem','.key'] and '.env' not in p.name
 data=p.read_bytes();assert b'-----BEGIN PRIVATE KEY-----' not in data
 checksum=hashlib.sha256(data).hexdigest()
 files.append({'path':rel,'sha256':checksum,'before':baseline.get(rel),'size':len(data),'included':baseline.get(rel)!=checksum})
manifest={'release':release,'commit':commit,'files':files}
(folder/'release-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
with tarfile.open(folder/'release.tar.gz','w:gz',compresslevel=6) as tar:
 tar.add(folder/'release-manifest.json',arcname='release-manifest.json')
 for item in files:
  if item['included']:tar.add(source/item['path'],arcname=item['path'],recursive=False)
print(json.dumps({'files':len(files),'changedFiles':sum(item['included'] for item in files),'bytes':(folder/'release.tar.gz').stat().st_size}))
