// Offline rebuild of content authored in the Codex session. Never loads app API keys.
// Edit the unit*.cjs sources and their independent DOK maps before rebuilding.
for(let unit=1;unit<=8;unit++)require(`./unit${unit}.cjs`);
require('./compile.cjs');
