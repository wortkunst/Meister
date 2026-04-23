import * as fs from 'fs';
import * as path from 'path';

const versions = [
  { dir: 'v1_0', color: 'red' },
  { dir: 'v1_1', color: 'blue' },
  { dir: 'v2_0', color: 'green' }
];

const srcDir = path.join(process.cwd(), 'src');

const filesToCopy = ['types.ts', 'utils.ts', 'reducer.ts'];

versions.forEach(v => {
  const vDir = path.join(srcDir, v.dir);
  if (!fs.existsSync(vDir)) {
    fs.mkdirSync(vDir, { recursive: true });
  }

  filesToCopy.forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(vDir, file));
  });

  // Handle Game.tsx
  let appContent = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf-8');
  
  // Replace App signature
  appContent = appContent.replace(
    'export default function App() {',
    'export default function Game({ currentVersion, onSwitchVersion }: { currentVersion: string, onSwitchVersion: (v: string) => void }) {'
  );

  // Add dropdown helper
  const dropdownCode = `
  const renderVersionDropdown = () => (
    <div className="absolute top-4 right-4 z-50">
      <select 
        value={currentVersion} 
        onChange={(e) => onSwitchVersion(e.target.value)}
        className="bg-slate-800 text-slate-300 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-slate-400"
      >
        <option value="v1_0">V 1.0 OG</option>
        <option value="v1_1">V 1.1 Ende März</option>
        <option value="v2_0">V 2.0 Five Alive</option>
      </select>
    </div>
  );
`;
  appContent = appContent.replace(
    "  if (state.phase === 'setup') {",
    dropdownCode + "\n  if (state.phase === 'setup') {"
  );

  // Inject dropdown into setup phase
  appContent = appContent.replace(
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">',
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative">\n        {renderVersionDropdown()}'
  );

  // Inject dropdown into play phase
  appContent = appContent.replace(
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8 relative">',
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8 relative">\n        {renderVersionDropdown()}'
  );

  // Inject dropdown into game over phase
  appContent = appContent.replace(
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">',
    '<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative">\n        {renderVersionDropdown()}'
  );

  // Replace colors if not red
  if (v.color !== 'red') {
    appContent = appContent.replace(/bg-red-950/g, `bg-${v.color}-950`);
    appContent = appContent.replace(/border-red-500/g, `border-${v.color}-500`);
    appContent = appContent.replace(/text-red-100/g, `text-${v.color}-100`);
    appContent = appContent.replace(/text-red-500/g, `text-${v.color}-500`);
    appContent = appContent.replace(/bg-red-600/g, `bg-${v.color}-600`);
    appContent = appContent.replace(/hover:bg-red-700/g, `hover:bg-${v.color}-700`);
    appContent = appContent.replace(/bg-red-900/g, `bg-${v.color}-900`);
    appContent = appContent.replace(/hover:bg-red-800/g, `hover:bg-${v.color}-800`);
    appContent = appContent.replace(/border-red-700/g, `border-${v.color}-700`);
  }

  fs.writeFileSync(path.join(vDir, 'Game.tsx'), appContent);
});

// Now rewrite src/App.tsx
const newAppContent = `import React, { useState } from 'react';
import GameV1_0 from './v1_0/Game';
import GameV1_1 from './v1_1/Game';
import GameV2_0 from './v2_0/Game';

export default function App() {
  const [version, setVersion] = useState('v1_0');

  return (
    <>
      {version === 'v1_0' && <GameV1_0 onSwitchVersion={setVersion} currentVersion={version} />}
      {version === 'v1_1' && <GameV1_1 onSwitchVersion={setVersion} currentVersion={version} />}
      {version === 'v2_0' && <GameV2_0 onSwitchVersion={setVersion} currentVersion={version} />}
    </>
  );
}
`;

fs.writeFileSync(path.join(srcDir, 'App.tsx'), newAppContent);

// Delete old files to clean up
fs.unlinkSync(path.join(srcDir, 'types.ts'));
fs.unlinkSync(path.join(srcDir, 'utils.ts'));
fs.unlinkSync(path.join(srcDir, 'reducer.ts'));

console.log('Versions setup complete!');
