import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'dist', 'assets');
const files = await readdir(assets);
const js = await readFile(path.join(assets, files.find(file => file.endsWith('.js'))), 'utf8');
const css = await readFile(path.join(assets, files.find(file => file.endsWith('.css'))), 'utf8');
const favicon = await readFile(path.join(root, 'public', 'favicon.svg'), 'utf8');
const embedded = {};
for (const folder of ['logos', 'products', 'photos']) {
  const directory = path.join(root, 'public', 'assets', folder);
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.webp')) continue;
    embedded[`assets/${folder}/${file}`] = `data:image/webp;base64,${(await readFile(path.join(directory, file))).toString('base64')}`;
  }
}
const output = path.join(root, '..', 'chokxen-demo.html');
await writeFile(output, `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#10141c"><title>Chokxen Sport</title><link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"><style>${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>window.__CHOKXEN_OFFLINE__=true;window.__CHOKXEN_ASSETS__=${JSON.stringify(embedded)};</script><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`, 'utf8');
console.log(`Demo local exportada: ${output}`);
