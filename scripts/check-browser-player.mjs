import {loadSiteData} from '../src/lib/site-data.js';
import {browserPlayerFor} from '../src/lib/browser-player.js';
import {existsSync, readFileSync} from 'node:fs';
const root=new URL('../public/emulators/',import.meta.url);
for(const file of ['index.html','catalog.json','worker.js','player.js','embed.js','template.html','player.css','audio.js','mouse.js','session-controls.js','storage.js','save-file.js','preferences.js','player-extras.js']) {
  if(!existsSync(new URL(file,root)))throw new Error('Browser player missing. Run npm ci, then npm run bundles.');
}
const build=JSON.parse(readFileSync(new URL('build.json',root),'utf8'));
for(const family of build.families) {
  const name=`emu198x_${family.replaceAll('-','_')}_web`;
  for(const ext of ['js','wasm']) {
    const file=`modules/${family}/${name}${ext==='wasm'?'_bg':''}.${ext}`;
    if(!existsSync(new URL(file,root)))throw new Error(`Player module missing: ${file}. Is the pinned @emu198x/player complete?`);
  }
}

if(process.argv.includes('--built')) {
  const catalog=JSON.parse(readFileSync(new URL('catalog.json',root),'utf8'));
  let matched = 0;
  const {fleet} = loadSiteData();
  for(const machine of fleet) {
    const player = browserPlayerFor(machine.machineId, catalog);
    const page = readFileSync(new URL(`../dist/systems/${machine.machineId}/index.html`, import.meta.url), 'utf8');
    if(player) {
      matched++;
      if(!page.includes(`<emu198x-player system="${player.entry.id}"`))throw new Error(`Inline player missing from ${machine.machineId}`);
      if(player.variant && !page.includes(`variant="${player.variant}"`))throw new Error(`Wrong board player on ${machine.machineId}`);
    } else if(page.includes('<emu198x-player '))throw new Error(`Unmatched board gets a player: ${machine.machineId}`);
    if(page.includes('src="/emulators/index.html?'))throw new Error(`Old iframe player remains on ${machine.machineId}`);
  }
  if(!matched)throw new Error('No registry machine matched the pinned browser player');
  for(const family of build.families) {
    const name=`emu198x_${family.replaceAll('-','_')}_web_bg.wasm`;
    if(!existsSync(new URL(`../dist/emulators/modules/${family}/${name}`,import.meta.url)))throw new Error(`Built site missing ${family} WASM`);
  }
  console.log(`${matched} concrete board embeds across ${fleet.length} registry pages and all browser modules verified.`);
}

for(const family of build.fleetFamilies || []) {
  for(const file of ['emu198x_fleet_web.js','emu198x_fleet_web_bg.wasm']) {
    if(!existsSync(new URL(`modules/${family}/${file}`,root)))throw new Error(`Missing fleet module: ${family}/${file}`);
    if(process.argv.includes('--built') && !existsSync(new URL(`../dist/emulators/modules/${family}/${file}`,import.meta.url)))throw new Error(`Built site missing ${family}/${file}`);
  }
}

const catalogue=JSON.parse(readFileSync(new URL('catalog.json',root),'utf8'));
for(const entry of catalogue)if(entry.demo) {
 if(!existsSync(new URL(entry.demo.url,root)))throw new Error(`Missing demo: ${entry.id}`);
 if(process.argv.includes('--built') && !existsSync(new URL(`../dist/emulators/${entry.demo.url}`,import.meta.url)))throw new Error(`Built site missing demo: ${entry.id}`);
}
