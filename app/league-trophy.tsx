import { useId } from "react";

/** Troféu de ouro trabalhado em relevo; fundo transparente e nenhuma borda extraída de captura. */
export function RealisticTrophy({size=25}:{size?:number}){
 const root=useId().replace(/:/g,"");
 return <svg role="img" aria-label="Troféu dourado da Liga" className="realistic-trophy" width={size} height={size} viewBox="0 0 52 58" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id={root+"-metal"} x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#fff6bd"/><stop offset=".15" stopColor="#eabe54"/><stop offset=".39" stopColor="#8b4d0d"/>
   <stop offset=".57" stopColor="#f8d97b"/><stop offset=".78" stopColor="#bd7e20"/><stop offset="1" stopColor="#fff2b3"/>
  </linearGradient>
  <linearGradient id={root+"-bowl"} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor="#854311"/><stop offset=".24" stopColor="#d5a54b"/><stop offset=".5" stopColor="#fff3ac"/><stop offset=".7" stopColor="#b96b0d"/><stop offset="1" stopColor="#6b350c"/>
  </linearGradient>
  <linearGradient id={root+"-stand"} x1="0" x2="0" y1="0" y2="1">
   <stop offset="0" stopColor="#ffe595"/><stop offset=".5" stopColor="#9d5916"/><stop offset="1" stopColor="#43200a"/>
  </linearGradient>
  <filter id={root+"-shadow"} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0.7" dy="1.8" stdDeviation="1.2" floodColor="#361b05" floodOpacity=".65"/></filter>
 </defs>
 <g filter={`url(#${root}-shadow)`} stroke="#75400f" strokeWidth="1.1" strokeLinejoin="round">
  <path d="M12 11C-1 8 2 25 11 30l6-1-1-5c-7 2-10-10-3-10Z" fill={`url(#${root}-metal)`}/>
  <path d="M40 11C53 8 50 25 41 30l-6-1 1-5c7 2 10-10 3-10Z" fill={`url(#${root}-metal)`}/>
  <path d="M11 7h30l-1 20c-.6 6-6 12-11 14v7h7v4H16v-4h7v-7c-6-3-11-9-11-16Z" fill={`url(#${root}-bowl)`}/>
  <path d="M11 7q15-3 30 0l-1 5H12Z" fill={`url(#${root}-metal)`}/>
  <path d="M21 37h10l-2 12h-6Z" fill={`url(#${root}-stand)`}/>
  <path d="M14 48h24l3 5H11Z" fill={`url(#${root}-metal)`}/>
  <path d="M10 53h32v3H10Z" fill="#6b390e"/>
  <path d="M17 13h18l-2 14q-3 9-7 10c-5-3-8-10-9-24Z" fill="none" stroke="#fff0ae" strokeWidth="1.6" opacity=".8"/>
 </g>
 <path d="m26 17 2.1 5.3 5.7.3-4.3 3.8 1.4 5.5-4.9-3.2-4.9 3.2 1.4-5.5-4.3-3.8 5.7-.3Z" fill="#ffecab" stroke="#985a16" strokeWidth=".6"/>
 <path d="M15 10h23" stroke="#fff7c4" strokeWidth="1.8" opacity=".9"/>
 </svg>;
}
