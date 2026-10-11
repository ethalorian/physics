// Scientific diagrams encode the numerical cases used in the lesson.
export function enhance(lessons){
const find=(day,title)=>lessons.find(l=>l.day===day).slides.find(s=>s.title===title);
const graph=(data,labels,extra={})=>`<div class="chart" data-chart='${JSON.stringify({kind:'line',data,labels,...extra})}'></div>`;
const vec=(vectors,labels=['x component','y component'])=>`<div class="vectorplot" data-vectors='${JSON.stringify({vectors,labels})}'></div>`;
const f=(values,labels)=>`<div class="forceplot" data-forces="${values}" data-labels="${labels}"></div>`;
find(2,'Worked route: out and back').body+=graph([[0,0],[1,4],[2,1]],['Route checkpoint','Position (m)']);
find(3,'A walk with a pause').answer+=graph([[0,1],[2,5],[4,5],[6,1]],['Time (s)','Position (m)']);
find(4,'A velocity vector has two components').body=find(4,'A velocity vector has two components').body.replace('<p>For a vector in a horizontal plane, choose perpendicular x and y axes.</p>','');
find(4,'A velocity vector has two components').body+=vec([{x:4,y:0,label:'East: 4 m/s',color:'green'},{x:4,y:3,label:'Velocity: 5 m/s'},{x:0,y:3,label:'North: 3 m/s',color:'red'}],['East velocity (m/s)','North velocity (m/s)']);
find(6,'Distance around a corner').answer+=vec([{x:4,y:0,label:'First: 4 m east',color:'green'},{sx:4,sy:0,x:0,y:3,label:'Then: 3 m north',color:'red',labelDy:22},{x:4,y:3,label:'Resultant: 5 m'}],['East displacement (m)','North displacement (m)']);
find(6,'Worked addition with signs').body+=vec([{x:6,y:2,label:'A',color:'green'},{sx:6,sy:2,x:-4,y:3,label:'B',color:'red'},{x:2,y:5,label:'R = (2,5) m'}],['East displacement (m)','North displacement (m)']);
find(7,'Braking in the negative direction').answer+=graph([[0,-12],[2,-4]],['Time (s)','Velocity (m/s)']);
find(8,'Worked braking distance').answer+=graph([[0,20],[5,0]],['Time (s)','Velocity (m/s)']);
find(9,'A moving object with balanced forces').answer+=f('8,8,0,0','Rope right,Friction left,Up,Down');
find(10,'Book on a table').answer+=f('0,0,10,10','Right,Left,N table,Fg Earth').replace('data-forces="0,0,10,10"','data-forces="0,0,1,1" data-qualitative="true"');
find(13,'Worked force inventory').body+=f('30,10,49,49','Pull,Friction,N floor,Fg Earth');
find(14,'Equal forces, unequal accelerations').answer+=vec([{sx:-2,sy:0,x:-1,y:0,label:'On A: 12 N left',color:'green'},{sx:2,sy:0,x:1,y:0,label:'On B: 12 N right'}],['Two separate objects; equal force scale','']);
find(15,'Guided diagram: hanging lamp').answer+=f('0,0,19.6,19.6','Right,Left,T rope,Fg Earth');
find(15,'Guided diagram: a falling ball').answer+=f('0,0,1,2','Right,Left,Drag air,Fg Earth').replace('data-forces="0,0,1,2"','data-forces="0,0,1,2" data-qualitative="true"');
find(16,'Axes along and perpendicular to a ramp').body+=vec([{x:19.6,y:0,label:'mg sin30° = 19.6 N',color:'green'},{x:0,y:-33.948,label:'−mg cos30° = −33.9 N',color:'red'},{x:19.6,y:-33.948,label:'Weight = 39.2 N'}],['Down-ramp component (N)','Outward component (N)']);
find(17,'Before and after slipping').answer+=f('12,12,49,49','Push,Static friction,N floor,Fg Earth');
find(18,'A symmetric two-rope setup').body+=vec([{x:-84.87,y:49,label:'Left rope: 98 N',color:'green'},{x:84.87,y:49,label:'Right rope: 98 N'},{x:0,y:-98,label:'Weight: 98 N',color:'red'}],['Horizontal force (N)','Vertical force (N)']);
find(20,'Worked case: endpoint and separation').answer+=vec([{sx:-100,sy:0,x:80,y:60,label:'Displacement (80,60) km',color:'green'},{x:-20,y:60,label:'Final position (−20,60) km'}],['x (km)','y (km)']);
// Give the more complex diagrams their own explanation space.
for(const [day,title,newTitle] of [[6,'Worked addition with signs','Vector addition on common axes'],[13,'Worked force inventory','Four forces on one box'],[16,'Axes along and perpendicular to a ramp','Weight in ramp coordinates'],[18,'A symmetric two-rope setup','The two tension vectors']]){
 const lesson=lessons.find(l=>l.day===day),i=lesson.slides.findIndex(s=>s.title===title),item=lesson.slides[i];
 const start=Math.max(item.body.lastIndexOf('<div class="vectorplot"'),item.body.lastIndexOf('<div class="forceplot"'));
 const visual=item.body.slice(start);item.body=item.body.slice(0,start);
 const note=day===16?'The axes here are ramp coordinates. +x is down the ramp and +y is outward. The diagonal weight arrow represents the same downward physical weight in these rotated axes. The 4 kg example has components +19.6 N and −33.9 N.':item.note;
 const caption=day===6?'Slide B tip-to-tail without rotating it. The resultant ends at (+2,+5) m.':day===13?'Vertical forces balance. Horizontally, 30 N right exceeds 10 N left, giving 20 N right.':day===16?'For a 4 kg block on a 30° ramp: weight has a +19.6 N down-ramp component and a −33.9 N outward component.':'Each 98 N tension contributes 49 N upward. The horizontal components cancel, and the total upward force balances 98 N of weight.';
 lesson.slides.splice(i+1,0,{title:newTitle,body:visual+'<p>'+caption+'</p>',note,tag:'Diagram and reasoning'});
}

}
