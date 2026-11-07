// Arrows begin at the chosen object; labels are authored in all three languages.
module.exports=function diagram(id,c) {
 const svg=(body)=>'<svg role="img" aria-label="'+c['t'+id]+'" viewBox="0 0 360 230">'+body+'</svg>';
 const label=(x,y,key)=>'<text x="'+x+'" y="'+y+'" fill="#262942" font-size="16" text-anchor="middle">'+c[key]+'</text>';
 const dot='<circle cx="155" cy="112" r="7" fill="#282b46"/>';
 const arrow=(x,y,color)=>`<g stroke="${color}" stroke-width="4" fill="${color}" transform="translate(155 112) rotate(${Math.atan2(y-112,x-155)*180/Math.PI})"><path d="M0 0H${Math.hypot(x-155,y-112)-7}"/><path d="M${Math.hypot(x-155,y-112)} 0l-10 -5v10z"/></g>`;
 const book='<path d="M75 127h155v12H75z" fill="#b6a690"/><rect x="122" y="98" width="66" height="26" rx="3" fill="#d8d6ef"/>';
 const ramp='<path d="M48 86l220 80H48z" fill="#c8c4db"/><path d="M135 89l42 15-8 23-42-15z" fill="#8680af"/>';
 if([16,17,27].includes(id))return svg(book+arrow(155,39,'#42816b')+arrow(155,185,'#a74835')+dot+label(231,45,'push')+label(232,194,'gravity'));
 if([7,19].includes(id))return svg(ramp+arrow(180,44,'#42816b')+arrow(155,192,'#a74835')+(id===19?arrow(81,85,'#5551a6')+label(60,66,'drag'):'')+dot+label(234,42,'push')+label(235,198,'gravity'));
 if([21,22,23].includes(id)){const contact=id===22;return svg('<circle cx="40" cy="112" r="24" fill="#edbc52"/><ellipse cx="155" cy="112" rx="17" ry="13" fill="#706f83"/>'+arrow(76,112,'#a74835')+label(109,151,'sun')+(contact?arrow(242,112,'#5551a6')+label(247,81,'touch'):''));}
 return '';
}
