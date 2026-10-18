/** Tradução de expressões visíveis ao jogador, inclusive textos salvos.
 * Nunca modifica IDs, nomes de região ou o estado do jogo. */
export const ROTULOS_DE_EFEITO: Readonly<Record<string,string>> = {
 bleed:"Sangramento",poison:"Envenenamento",stun:"Atordoamento",shield:"Escudo",
 regen:"Regeneração",taunt:"Provocação",inspired:"Inspirado",vulnerable:"Vulnerável",
 ward:"Proteção mágica",lastStand:"Última resistência",dodge:"Esquiva",
 riposte:"Contra-ataque",might:"Força ampliada",critBlessing:"Bênção crítica",
 slow:"Lentidão",evasion:"Evasão"
};
export function statusEmPortugues(id:string):string {return ROTULOS_DE_EFEITO[id]??id;}
const TRADUCOES:ReadonlyArray<readonly [RegExp,string]>=[
 [/\bDrop Supremo Imperial\b/gi,"Peça Suprema Imperial encontrada"],
 [/\bChance de drop\b/gi,"Chance de obtenção"],
 [/\bdrop\b/gi,"obtenção"],
 [/\bRanking\b/gi,"Classificação"],
 [/\bTop 10\b/gi,"10 melhores"],
 [/\bTop 3\b/gi,"3 primeiros"],
 [/\bUltimate\b/gi,"Habilidade suprema"],
 [/\bBerserker\b/gi,"Guerreiro Frenético"],
 [/\bJackpot\b/gi,"Grande Prêmio"],
 [/\bRaid\b/gi,"Incursão"],
 [/\bKit completo\b/gi,"Conjunto completo"],
 [/\bXP\b/g,"EXP"],
 [/\boffline\b/gi,"sem internet"],
 [/\bW\.O\./gi,"derrota por ausência"],
 [/\bOrc\b/g,"Orco"]
];
export function textoEmPortugues(texto:string):string {
 return TRADUCOES.reduce((s,[regex,replacement])=>s.replace(regex,replacement),texto);
}
