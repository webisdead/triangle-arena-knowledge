import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / '_site'
if out.exists():
    shutil.rmtree(out)
shutil.copytree(root / 'site', out)
shutil.copytree(root / 'data', out / 'data')
(out / '.nojekyll').touch()
print('Static GitHub Pages artifact built')
