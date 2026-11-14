import fs from 'node:fs';
// The existing self-contained projector keeps its original React bundle and binder data.
// Mount the maintained Section E component without rebuilding unrelated note/print assets.
const file='public/foundations/unit-1/projector.html';
let html=fs.readFileSync(file,'utf8');
if(!html.includes('src="./transfer-projector.js"')) {
  html=html.replace('<script src="./opening-projector.js"></script>', '<script src="./opening-projector.js"></script>\n<link rel="stylesheet" href="./transfer-projector.css"><script src="./transfer-visuals.js"></script><script src="./transfer-projector.js"></script>');
  const factory='var OpeningBoard=window.createFoundationOpening(z,dB),WorksheetBoard=window.createFoundationWorksheetBoard(z);';
  if(!html.includes(factory))throw Error('Projector factory changed; review the integration.');
  html=html.replace(factory,factory+'var TransferBoard=window.createFoundationTransfer(z);');
  const start=html.indexOf('n===4&&e===9&&t==="honors"&&');
  const end=html.indexOf('(0,m.jsxs)("div",{className:"flight"',start);
  if(start<0||end<start)throw Error('Section E boundary changed; review the integration.');
  html=html.slice(0,start)+'(0,m.jsx)("div",{hidden:n!==4,children:(0,m.jsx)(TransferBoard,{day:e,track:t,binder:a,assignment:A,honorsCopy:ct})}),'+html.slice(end);
}
if(!html.includes('window.createFoundationTransfer(z)')||!html.includes('honorsCopy:ct'))throw Error('Transfer mount missing.');
fs.writeFileSync(file,html);
console.log('Foundation Section E component integrated; binder content preserved.');
