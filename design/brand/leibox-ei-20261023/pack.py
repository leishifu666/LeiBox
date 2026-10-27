from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
directory=Path(__file__).resolve().parent
names=['README.md','logo.svg','logo-white.svg','logo.png','logo-white.png','wordmark.svg','wordmark.png','ei-detail.svg','ei-detail.png','existing-mark.svg','logo-preview.png','inverse-preview.png','construction.svg','construction.png','lettering-construction.svg','lettering-construction.png','size-check.png','parameters.json','geometry.json','source-baseline.json','selected-reference.png','validation.json','rebuild-check.json','build.mjs','validate.py','check-rebuild.mjs']
names += [f'size-{height}.png' for height in [16,24,25,32,48]]
names += [str(file.relative_to(directory)) for file in sorted((directory/'review-accepted').iterdir()) if file.is_file()]
destination=directory/'leibox-ei-vector-kit.zip'
with ZipFile(destination,'x',ZIP_DEFLATED) as archive:
 for name in names:archive.write(directory/name,name)
with ZipFile(destination) as archive:
 assert archive.testzip() is None
 print({'files':len(archive.namelist()),'bytes':destination.stat().st_size,'archive':destination.name})
