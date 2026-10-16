import { applyAction, newCampaign, normalizeCampaign, type Action, type Campaign } from "@/lib/game";

export const LOCAL_SAVE_KEY = "cronicas-da-guilda:standalone:v1";
export const LOCAL_RECOVERY_KEY = LOCAL_SAVE_KEY + ":recovery";
export const BACKUP_FORMAT = "cronicas-da-guilda-save-v1";

export type LocalSave = {
  state: Campaign;
  revision: number;
  updatedAt: string;
  format: 1;
};

type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  revision: number;
  state: Campaign;
};

function randomSeed(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function")
    return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/** Não substituir um save que ainda possa ser recuperado. A cópia de
 * segurança só é atualizada depois de confirmar que o anterior era válido. */
function validState(value: unknown): value is Campaign {
  if (!value || typeof value !== "object") return false;
  const s=value as Partial<Campaign>;
  return s.schema===1 && typeof s.name==="string" &&
    Number.isSafeInteger(s.day) && s.day! >= 1 &&
    Number.isFinite(s.gold) && Array.isArray(s.heroes) &&
    s.heroes.length >= 1 && Array.isArray(s.team) &&
    Array.isArray(s.chest) && Array.isArray(s.rivals);
}
function parseSave(raw: string): LocalSave {
  const value=JSON.parse(raw) as Partial<LocalSave>;
  if (!value || !validState(value.state) ||
      !Number.isSafeInteger(value.revision) || value.revision! < 0)
    throw new Error("Dados de campanha incompletos.");
  return {state:normalizeCampaign(value.state),revision:value.revision!,updatedAt:typeof value.updatedAt==="string"?value.updatedAt:new Date().toISOString(),format:1};
}
function persist(save: LocalSave, keepSnapshot=true): LocalSave {
  if(keepSnapshot){
    const previous=localStorage.getItem(LOCAL_SAVE_KEY);
    if(previous){
      try{
        // Preserva o estado anterior, já validado, antes de substituir a campanha.
        const parsed=parseSave(previous);
        localStorage.setItem(LOCAL_RECOVERY_KEY,JSON.stringify(parsed));
      }catch{/* Nunca sobreponha a cópia de resgate com dados corrompidos. */}
    }
  }
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(save));
  return save;
}
function freshSave(): LocalSave {
  return persist({state:newCampaign(randomSeed()),revision:0,updatedAt:new Date().toISOString(),format:1});
}

/** Ao encontrar dados danificados, bloqueia alterações. Não inicia uma campanha
 * nova por acidente. A pessoa pode recuperar a cópia ou importar backup. */
export function readLocalCampaign(): LocalSave {
  const raw=localStorage.getItem(LOCAL_SAVE_KEY);
  if(!raw)return freshSave();
  let parsed:LocalSave;
  try{parsed=parseSave(raw);}
  catch{
    try{localStorage.setItem(LOCAL_SAVE_KEY+":corrupted:"+Date.now(),raw);}catch{}
    throw new Error("Salvamento inválido. O arquivo original foi preservado. Use 'Recuperar campanha' ou importe um backup, sem reiniciar o jogo.");
  }
  // Migra saves antigos sem mexer na cópia de segurança com o mesmo revision.
  localStorage.setItem(LOCAL_SAVE_KEY,JSON.stringify(parsed));
  return parsed;
}
export function restoreRecoveryCampaign(): LocalSave {
  const raw=localStorage.getItem(LOCAL_RECOVERY_KEY);
  if(!raw)throw new Error("Nenhum salvamento anterior disponível. Use seu arquivo de backup.");
  let previous:LocalSave;
  try{previous=parseSave(raw);}
  catch{throw new Error("A cópia de resgate está inválida. Importe um backup manual.");}
  let revision=previous.revision+1;
  const rawCurrent=localStorage.getItem(LOCAL_SAVE_KEY);
  if(rawCurrent){try{revision=Math.max(revision,parseSave(rawCurrent).revision+1);}catch{}}
  return persist({...previous,revision,updatedAt:new Date().toISOString()},false);
}
export function recoveryAvailable(): boolean {
  const raw=localStorage.getItem(LOCAL_RECOVERY_KEY);
  if(!raw)return false;
  try{return !!parseSave(raw);}catch{return false;}
}

export function updateLocalCampaign(expectedRevision: number, action: Action): ({ conflict: false } & LocalSave) | ({ conflict: true } & LocalSave) {
  const current=readLocalCampaign();
  if(current.revision!==expectedRevision)return {conflict:true,...current};
  return {conflict:false,...persist({
    state:applyAction(current.state,action),revision:current.revision+1,
    updatedAt:new Date().toISOString(),format:1
  })};
}
export function exportLocalCampaign(save?:LocalSave):string {
  const current=save??readLocalCampaign();
  const envelope:BackupEnvelope={format:BACKUP_FORMAT,exportedAt:new Date().toISOString(),revision:current.revision,state:current.state};
  return JSON.stringify(envelope,null,2);
}
export function importLocalCampaign(raw:string):LocalSave {
  let candidate:unknown;
  try{candidate=JSON.parse(raw);}catch{throw new Error("O arquivo de backup não contém um JSON válido.");}
  if(!candidate||typeof candidate!=="object")throw new Error("Backup inválido.");
  const value=candidate as Partial<BackupEnvelope>&Partial<LocalSave>&Partial<Campaign>;
  if("format" in value&&value.format!==BACKUP_FORMAT&&value.format!==1)
    throw new Error("Formato de backup incompatível com Crônicas da Guilda.");
  const stateCandidate=value.state??value;
  if(!validState(stateCandidate))throw new Error("Backup sem os dados obrigatórios da campanha. Nenhuma alteração foi feita.");
  let state:Campaign;
  try{state=normalizeCampaign(stateCandidate);}catch{throw new Error("Backup não é uma campanha compatível. Nenhuma alteração foi feita.");}
  // Importar backup antigo deve avançar a revisão local, não fazer o relógio
  // voltar e permitir que uma aba desatualizada sobrescreva a importação.
  let currentRevision=0;
  const currentRaw=localStorage.getItem(LOCAL_SAVE_KEY);
  if(currentRaw)try{currentRevision=parseSave(currentRaw).revision;}catch{}
  const revision=Math.max(currentRevision,Number.isSafeInteger(value.revision)?Math.max(0,Number(value.revision)):0)+1;
  return persist({state,revision,updatedAt:new Date().toISOString(),format:1});
}
export function clearLocalCampaign():void { localStorage.removeItem(LOCAL_SAVE_KEY); }
