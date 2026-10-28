// Content-only adaptation shared by every foundation import. Never edit scripts,
// interaction attributes, timers, answer reveals, archived exports or artwork.
module.exports=html=>{
 let roles=0;
 const result=html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
  if(section.includes('>Facilitator<')&&section.includes('>Recorder<')){
   roles++;
   section=section.replace('>Facilitator<','>Slideshow lead<').replace('>Recorder<','>Whiteboard scribe<')
    .replace(/(Writes the group's answers and notes\.|Keeps group notes; each person submits their own answers\.)/g,'Holds the dry erase marker and works problems at the whiteboard.')
    .replace('>Timekeeper<','>Timekeeper · support<').replace('>Checker<','>Checker · support<');
   section=section.replace(/(<\/section>)$/,'<div style="font-size:26px;line-height:1.25;margin-top:18px;">2 students: lead + timekeeper, scribe + checker. 3 students: third person takes both support duties. Roles rotate at each discussion. Everyone submits their own work.</div>$1');
  }
  return section.replaceAll("Recorder writes the group's answer",'Scribe shows the reasoning at the whiteboard; everyone writes their own answer').replaceAll("Your Recorder lists them all on your group's page.",'Your scribe lists the ideas at the whiteboard; everyone records their own response.');
 });
 if(roles!==1)throw Error('Expected one foundation group-role slide; found '+roles);
 return result;
};
