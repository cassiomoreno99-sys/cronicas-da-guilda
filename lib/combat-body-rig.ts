/**
 * BLOCO 07 - especificação de rig experimental para sprites existentes.
 * Recorta partes de uma imagem de corpo inteiro, sem fingir que retratos
 * ou criaturas quadrúpedes possuem articulação humana.
 * NENHUMA alteração de campanha, dano, save ou regras.
 */
export const RIG_PARTS=["leg-back","leg-front","torso","arm-back","arm-front","head"] as const;
export type RigPart=typeof RIG_PARTS[number];
export type RigPose="idle"|"melee"|"cast"|"hit"|"fall";

const HUMANOID_ENEMIES=/^(?:bandido|saqueador|emboscador|cultista|esqueleto|espectro|cavaleiro|pirata|cors[aá]rio|salteador|guerreiro|guardi[aã]o antigo|guardi[aã]o de obsidiana|m[uú]mia|afogado|rebelde|ca[cç]ador|bruxa|legion[aá]rio|mago imperial|carrasco|arauto|dem[oô]nio menor|serafim|rei sem nome)(?:\b|$)/i;

export function rigEligible(side:"hero"|"enemy",name:string,src:string,full:boolean){
 if(!full||!src.startsWith("/")||src.startsWith("/heroes/portraits/"))return false;
 if(side==="hero")return /^\/battle\/sprite-(?:aric|lyria|thorgar|kaelith|eldrin|rhokar)\.webp$/.test(src);
 return src.startsWith("/enemies/full/")&&HUMANOID_ENEMIES.test(name.trim());
}
/** Ao menos 2 cantos realmente transparentes. Se a arte tiver fundo opaco,
 * recortes revelariam um mosaico desagradável; mantém-se a imagem intacta.
 */
export function hasClearEdges(rgba:Uint8ClampedArray,width:number,height:number){
 if(width<4||height<4||rgba.length<width*height*4)return false;
 const points:[[number,number],[number,number],[number,number],[number,number]]=[
  [0,0],[width-1,0],[0,height-1],[width-1,height-1]
 ];
 return points.filter(([x,y])=>rgba[(y*width+x)*4+3]<=24).length>=2;
}
export function chooseRigPose(acting:boolean,struck:boolean,dead:boolean,ranged:boolean):RigPose{
 if(dead)return "fall";
 if(struck)return "hit";
 if(acting)return ranged?"cast":"melee";
 return "idle";
}
