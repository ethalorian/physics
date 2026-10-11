const path = require('node:path');
const root = path.resolve(__dirname, '../..');
require('esbuild').buildSync({ absWorkingDir: root, entryPoints: ['src/games/mic-check/avatar.tsx'], bundle: true, minify: true, format: 'iife', platform: 'browser', target: ['es2020'], outfile: 'public/games/mic-check/avatar.js', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'eof', tsconfig: 'tsconfig.json' });
console.log('Built Mic Check avatar bundle from the shared renderer.');
