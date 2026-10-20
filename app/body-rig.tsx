import type {CSSProperties} from "react";
import {RIG_PARTS,hasClearEdges} from "@/lib/combat-body-rig";

/** Imagem original continua montada e pronta para fallback. */
export function BodyRig({src}:{src:string}){
 return <span className="guild2d-body-rig" aria-hidden="true"
  style={{"--rig-image":`url("${src}")`} as CSSProperties}>
  {RIG_PARTS.map(part=><span key={part} className={"guild2d-rig-part guild2d-rig-"+part}/>)}
 </span>;
}
/** Impede a "colagem" de imagens com fundo opaco em seis regiões. */
export function rigImageSafe(img:HTMLImageElement){
 if(!img.complete||img.naturalWidth<16||img.naturalHeight<16)return false;
 try{
  const canvas=document.createElement("canvas");canvas.width=12;canvas.height=12;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)return false;
  ctx.clearRect(0,0,12,12);ctx.drawImage(img,0,0,12,12);
  return hasClearEdges(ctx.getImageData(0,0,12,12).data,12,12);
 }catch{return false;}
}
