// Reproducible original synthetic vocal samples; macOS built-in Eddy voice.
// The runtime fits each complete chunk inside its rhythmic slot without clipping words.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const root = path.resolve(__dirname, '../..'), tracks = require(path.join(root, 'public/games/mic-check/tracks.js'));
const out = path.join(root, 'public/games/mic-check/vocals'); fs.mkdirSync(out, {recursive:true});
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mic-vocals-'));
function trim(wav) {
  let offset=12, fmt, pcm;
  while(offset+8<=wav.length) {const tag=wav.toString('ascii',offset,offset+4),len=wav.readUInt32LE(offset+4);if(tag==='fmt ')fmt=wav.subarray(offset+8,offset+8+len);if(tag==='data')pcm=wav.subarray(offset+8,offset+8+len);offset+=8+len+(len%2);}
  if(!fmt || !pcm || fmt.readUInt16LE(0)!==1 || fmt.readUInt16LE(14)!==16)throw Error('Expected PCM16 WAV');
  let first=0,last=pcm.length/2-1;while(first<last && Math.abs(pcm.readInt16LE(first*2))<100)first++;while(last>first && Math.abs(pcm.readInt16LE(last*2))<100)last--;
  first=Math.max(0,first-110);last=Math.min(pcm.length/2-1,last+880);const data=Buffer.from(pcm.subarray(first*2,(last+1)*2));
  let peak=0;for(let i=0;i<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));const gain=peak?Math.min(3,28000/peak):1;
  for(let i=0;i<data.length;i+=2)data.writeInt16LE(Math.round(data.readInt16LE(i)*gain),i);
  const result=Buffer.alloc(44+data.length);result.write('RIFF');result.writeUInt32LE(result.length-8,4);result.write('WAVEfmt ',8);result.writeUInt32LE(16,16);fmt.copy(result,20,0,16);result.write('data',36);result.writeUInt32LE(data.length,40);data.copy(result,44);return result;
}
let count=0;const manifest=[];
let previous=[];try{previous=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))).samples;}catch{}
const cached=new Map(previous.map(x=>[x.file,x.text]));
for(const track of tracks) for(const [v,verse] of track.verses.entries()) for(const [c,chunk] of verse.chunks.entries()) {
  const file=track.id+'-'+v+'-'+c+'.wav', target=path.join(out,file);
  if(cached.get(file)===chunk && fs.existsSync(target) && fs.statSync(target).size>4000){manifest.push({file,text:chunk});continue;}
  const spoken=chunk.replace(/\bK E\b/g,'K. E.').replace(/\bF equals m a\b/g,'F. equals M. A.').replace(/\bQ equals m c delta T\b/g,'Q. equals M. C. delta T.').replace(/\bV equals I R\b/g,'V. equals I. R.').replace(/\bv equals f lambda\b/g,'V. equals F. lambda').replace(/\bm g\b/g,'M. G.').replace(/\bTotal p\b/gi,'Total P.');
  cp.execFileSync('/usr/bin/say',['-v','Eddy (English (US))','-r','205','-o',path.join(temp,'take.aiff'),spoken]);
  cp.execFileSync('/usr/bin/afconvert',['-f','WAVE','-d','LEI16@22050','-c','1',path.join(temp,'take.aiff'),path.join(temp,'take.wav')]);
  const audio=trim(fs.readFileSync(path.join(temp,'take.wav')));if(audio.length<4000)throw Error('Empty speech output for '+file+'; ensure the system speech service is available outside the sandbox.');fs.writeFileSync(target,audio);manifest.push({file,text:chunk});count++;
  if(count%24===0)console.log(track.id+': 24 vocals rendered');
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({voice:'Eddy (English (US))',rate:205,sampleRate:22050,samples:manifest},null,2)+'\n');console.log(count+' samples rendered; '+manifest.length+' original samples ready.');
