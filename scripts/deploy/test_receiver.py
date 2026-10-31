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
 def archive(self,path='out/index.html',tamper=False,extra=False,two=False):
  files=[{'path':path,'sha256':sha(b'next'),'before':sha(b'previous'),'included':True,'size':4}]
  if two:files.append({'path':'out/new.html','sha256':sha(b'next'),'before':None,'included':True,'size':4})
  manifest={'commit':'a'*40,'release':'abcdef12-1234','files':files};buf=io.BytesIO()
  with tarfile.open(fileobj=buf,mode='w:gz') as tar:
   bodies={'release-manifest.json':json.dumps(manifest).encode(),path:b'BAD!' if tamper else b'next'}
   if two:bodies['out/new.html']=b'next'
   if extra:bodies['out/unlisted.html']=b'no'
   for name,body in bodies.items():
    item=tarfile.TarInfo(name);item.size=len(body);tar.addfile(item,io.BytesIO(body))
  buf.seek(0);return buf
 def intact(self):
  self.assertEqual((self.root/'out/index.html').read_bytes(),b'previous');self.assertEqual((self.root/'.env.local').read_bytes(),b'TEST_ONLY_PRIVATE_VALUE')
 def test_publish_backups_and_preserves_environment(self):
  result=receiver.deploy(self.archive());self.assertEqual(result['updatedFiles'],1);self.assertTrue(result['environmentPreserved']);self.assertEqual((self.root/'out/index.html').read_bytes(),b'next');self.assertEqual((self.root/'backups/abcdef12-1234/out/index.html').read_bytes(),b'previous');self.assertTrue(receiver.STATE.exists())
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
if __name__=='__main__':unittest.main()
