/** Cinemática exclusiva do cliente: não toca em dano, turno, PV ou salvamento.
 * Distâncias relativas ao palco para Android e desktop; hit-stop perceptível.
 */
export type MotionSchool="blade"|"steel"|"arrow"|"shadow"|"arcane"|"holy"|"song"|"nature"|"claw";
type Point={x:number;y:number};
type MotionConfig={
 school:MotionSchool;kind:string;from:Point;to:Point;width:number;height:number;
 duration:number;critical:boolean;
};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const frame=(offset:number,x:number,y:number,rotation:number,scale:number):Keyframe=>({
 offset,transform:`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rotation}deg) scale(${scale})`
});
export function choreographyPlan({school,kind,from,to,width,height,duration,critical}:MotionConfig){
 const w=Math.max(1,width),h=Math.max(1,height);
 const flightX=(to.x-from.x)*w/100,flightY=(to.y-from.y)*h/100;
 const ranged=["arrow","arcane","holy","song","nature"].includes(school);
 const isHeal=kind==="heal";
 const direction=Math.sign(flightX)||1;
 const reach=clamp(Math.abs(flightX)-clamp(w*.105,25,58),0,w*.64);
 const dx=ranged?-direction*clamp(w*.018,5,16):direction*Math.min(Math.abs(flightX)*.88,reach);
 const dy=ranged?-clamp(h*.016,4,12):clamp(flightY*.72,-h*.15,h*.15);
 const pre=clamp(Math.abs(dx)*.10,4,14);
 const tilt=school==="shadow"?-14:school==="steel"?-12:school==="claw"?-11:-8;
 const snap=critical?1.105:1.055;
 const actorFrames:Keyframe[]=[
  frame(0,0,0,0,1),
  frame(.10,-direction*pre,3,-direction*tilt*.45,.98),
  frame(.22,-direction*pre,-5,direction*tilt,1.025),
  frame(.45,dx*.72,dy*.64,-direction*tilt*.55,1.035),
  frame(.54,dx,dy,-direction*tilt,snap),
  frame(.61,dx,dy,-direction*tilt,snap), // pausa de impacto (hit-stop)
  frame(.77,dx*.38,dy*.30,direction*tilt*.25,1.01),
  frame(.92,-direction*2,-2,0,1),
  frame(1,0,0,0,1)
 ];
 const recoil=direction*(critical?clamp(w*.044,12,29):clamp(w*.022,7,17));
 const targetFrames:Keyframe[]=[
  frame(0,0,0,0,1),
  frame(.12,recoil*.84,-3,direction*4,.96),
  frame(.38,recoil,2,direction*5,.97),
  frame(.56,-recoil*.23,0,-direction*2,1),
  frame(1,0,0,0,1)
 ];
 const healFrames:Keyframe[]=[
  {offset:0,transform:"translateY(0px) scale(1)",filter:"brightness(1)"},
  {offset:.38,transform:"translateY(-5px) scale(1.06)",filter:"brightness(1.42)"},
  {offset:1,transform:"translateY(0px) scale(1)",filter:"brightness(1)"}
 ];
 return {actorFrames,targetFrames,healFrames,ranged,isHeal,dx,dy,
  impactDelay:Math.round(duration*.54),recoveryDuration:clamp(duration*.4,230,390)};
}
