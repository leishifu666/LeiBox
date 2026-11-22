import unittest,importlib.util,tempfile,pathlib,json,tarfile,io,hashlib,sys,types,os
from unittest.mock import patch
try:import pwd
except ImportError:
 pwd=types.ModuleType('pwd');pwd.getpwnam=lambda name:types.SimpleNamespace(pw_uid=0,pw_gid=0);sys.modules['pwd']=pwd
spec=importlib.util.spec_from_file_location('receiver',pathlib.Path(__file__).with_name('receiver.py'));receiver=importlib.util.module_from_spec(spec);spec.loader.exec_module(receiver)
sha=lambda data:hashlib.sha256(data).hexdigest()
class PublicationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.temp.name).resolve();receiver.ROOT=self.root;receiver.STATE=self.root/'.releases/current-manifest.json'
  (self.root/'out').mkdir();(self.root/'out/index.html').write_bytes(b'previous');(self.root/'.env.local').write_bytes(b'TEST_ONLY_PRIVATE_VALUE')
  self.permissions=patch.object(receiver.os,'chown',create=True);self.permissions.start()
  self.account=patch.object(receiver.pwd,'getpwnam',return_value=types.SimpleNamespace(pw_uid=0,pw_gid=0));self.account.start()
 def tearDown(self):self.account.stop();self.permissions.stop();self.temp.cleanup()
 def archive(self,path='out/index.html',tamper=False,extra=False,two=False,retired=None):
  files=[{'path':path,'sha256':sha(b'next'),'before':sha(b'previous'),'included':True,'size':4}]
  if two:files.append({'path':'out/new.html','sha256':sha(b'next'),'before':None,'included':True,'size':4})
  manifest={'commit':'a'*40,'release':'abcdef12-1234','files':files};buf=io.BytesIO()
  if retired is not None:manifest['retired']=retired
  with tarfile.open(fileobj=buf,mode='w:gz') as tar:
   bodies={'release-manifest.json':json.dumps(manifest).encode(),path:b'BAD!' if tamper else b'next'}
   if two:bodies['out/new.html']=b'next'
   if extra:bodies['out/unlisted.html']=b'no'
   for name,body in bodies.items():
    item=tarfile.TarInfo(name);item.size=len(body);tar.addfile(item,io.BytesIO(body))
  buf.seek(0);return buf
 def intact(self):
  self.assertEqual((self.root/'out/index.html').read_bytes(),b'previous');self.assertEqual((self.root/'.env.local').read_bytes(),b'TEST_ONLY_PRIVATE_VALUE')
 def previous_component(self):
  name='out/docs/animations/retired.html';old=self.root/name
  old.parent.mkdir(parents=True);old.write_bytes(b'old component')
  receiver.STATE.parent.mkdir(parents=True)
  item={'path':name,'sha256':sha(b'old component')}
  receiver.STATE.write_text(json.dumps({'files':[item]}))
  return old,item
 def test_publish_backups_and_preserves_environment(self):
  result=receiver.deploy(self.archive());self.assertEqual(result['updatedFiles'],1);self.assertTrue(result['environmentPreserved']);self.assertEqual((self.root/'out/index.html').read_bytes(),b'next');self.assertEqual((self.root/'backups/abcdef12-1234/out/index.html').read_bytes(),b'previous');self.assertTrue(receiver.STATE.exists())
 def test_publish_keeps_the_actual_previous_snapshot_for_cleanup_and_rollback(self):
  receiver.STATE.parent.mkdir(parents=True)
  before={'files':[{'path':'out/index.html','sha256':sha(b'previous'),'size':8}]}
  receiver.STATE.write_text(json.dumps(before))
  receiver.deploy(self.archive())
  self.assertEqual(json.loads((self.root/'backups/abcdef12-1234/previous-manifest.json').read_text()),before)
 def test_path_escape_is_rejected_before_writes(self):
  with self.assertRaises(ValueError):receiver.deploy(self.archive('out/../.env.local'))
  self.intact()
 def test_digest_mismatch_is_rejected_before_writes(self):
  with self.assertRaises(ValueError):receiver.deploy(self.archive(tamper=True))
  self.intact()
 def test_unlisted_files_are_rejected(self):
  with self.assertRaises(ValueError):receiver.deploy(self.archive(extra=True))
  self.intact()
 def test_partial_failure_restores_previous_files(self):
  actual=receiver.os.replace
  def replace(source,target):
   if pathlib.Path(target).name=='new.html':raise OSError('Injected disk failure')
   return actual(source,target)
  with patch.object(receiver.os,'replace',side_effect=replace):
   with self.assertRaises(OSError):receiver.deploy(self.archive(two=True))
  self.intact();self.assertFalse((self.root/'out/new.html').exists());self.assertFalse((self.root/'out/new.html.deploy-new').exists());self.assertFalse(receiver.STATE.exists())
 def test_failed_manifest_commit_does_not_leave_a_successful_backup_marker(self):
  actual=receiver.os.replace
  def replace(source,target):
   if pathlib.Path(target)==receiver.STATE:raise OSError('Injected state write failure')
   return actual(source,target)
  with patch.object(receiver.os,'replace',side_effect=replace):
   with self.assertRaises(OSError):receiver.deploy(self.archive())
  self.intact()
  self.assertFalse((self.root/'backups/abcdef12-1234/manifest.json').exists())
 def test_retired_component_stops_serving_and_keeps_its_previous_bytes(self):
  old,item=self.previous_component()
  result=receiver.deploy(self.archive(retired=[item]))
  self.assertEqual(result['retiredFiles'],1)
  self.assertFalse(old.exists())
  self.assertEqual((self.root/'backups/abcdef12-1234'/item['path']).read_bytes(),b'old component')
 def test_retirement_rejects_a_path_or_digest_outside_the_previous_component(self):
  old,item=self.previous_component()
  unexpected={'path':'out/index.html','sha256':sha(b'previous')}
  with self.assertRaisesRegex(ValueError,'Retirement plan'):
   receiver.deploy(self.archive(retired=[item,unexpected]))
  old.write_bytes(b'manual edit')
  with self.assertRaisesRegex(ValueError,'Retired file was edited'):
   receiver.deploy(self.archive(retired=[item]))
  self.intact()
  self.assertEqual(old.read_bytes(),b'manual edit')
 def test_failed_publish_restores_the_retired_page(self):
  old,item=self.previous_component()
  actual=receiver.os.replace
  def replace(source,target):
   if pathlib.Path(target)==receiver.STATE:raise OSError('Injected state write failure')
   return actual(source,target)
  with patch.object(receiver.os,'replace',side_effect=replace):
   with self.assertRaises(OSError):receiver.deploy(self.archive(retired=[item]))
  self.intact()
  self.assertEqual(old.read_bytes(),b'old component')
 def test_first_release_on_an_existing_origin_reads_only_listed_live_components(self):
  catalog=self.root/'out/ai/catalog.json';catalog.parent.mkdir()
  catalog.write_text(json.dumps({'items':[{'docsPath':'/docs/animations/retired'}]}))
  detail=self.root/'out/docs/animations';detail.mkdir(parents=True)
  (detail/'retired.html').write_bytes(b'old component')
  (detail/'unlisted.html').write_bytes(b'other page')
  manifest=receiver.manifest_response()
  self.assertEqual(manifest['retirementProtocol'],1)
  self.assertEqual(manifest['liveCatalogSha256'],sha(catalog.read_bytes()))
  self.assertEqual({item['path'] for item in manifest['files']},{'out/ai/catalog.json','out/docs/animations/retired.html'})
if __name__=='__main__':unittest.main()
