import { applyAction, newCampaign, normalizeCampaign, type Action, type Campaign } from "@/lib/game";

export const LOCAL_SAVE_KEY = "cronicas-da-guilda:standalone:v1";
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
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function persist(save: LocalSave): LocalSave {
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(save));
  return save;
}

function freshSave(): LocalSave {
  return persist({
    state: newCampaign(randomSeed()),
    revision: 0,
    updatedAt: new Date().toISOString(),
    format: 1,
  });
}

export function readLocalCampaign(): LocalSave {
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  if (!raw) return freshSave();

  try {
    const parsed = JSON.parse(raw) as Partial<LocalSave>;
    if (!parsed.state || !Number.isSafeInteger(parsed.revision) || (parsed.revision ?? -1) < 0) {
      return freshSave();
    }
    const normalized: LocalSave = {
      state: normalizeCampaign(parsed.state as Campaign),
      revision: parsed.revision!,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      format: 1,
    };
    persist(normalized);
    return normalized;
  } catch {
    // Preserve a corrupted payload so a future manual recovery is still possible.
    try { localStorage.setItem(`${LOCAL_SAVE_KEY}:corrupted:${Date.now()}`, raw); } catch {}
    return freshSave();
  }
}

export function updateLocalCampaign(expectedRevision: number, action: Action): ({ conflict: false } & LocalSave) | ({ conflict: true } & LocalSave) {
  const current = readLocalCampaign();
  if (current.revision !== expectedRevision) return { conflict: true, ...current };

  const next: LocalSave = {
    state: applyAction(current.state, action),
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    format: 1,
  };
  persist(next);
  return { conflict: false, ...next };
}

export function exportLocalCampaign(save?: LocalSave): string {
  const current = save ?? readLocalCampaign();
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    revision: current.revision,
    state: current.state,
  };
  return JSON.stringify(envelope, null, 2);
}

export function importLocalCampaign(raw: string): LocalSave {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error("O arquivo de backup não contém um JSON válido."); }

  if (!parsed || typeof parsed !== "object") throw new Error("Backup inválido.");
  const candidate = parsed as Partial<BackupEnvelope> & Partial<LocalSave> & Partial<Campaign>;
  const stateCandidate = candidate.state ?? candidate;

  try {
    const state = normalizeCampaign(stateCandidate as Campaign);
    const next: LocalSave = {
      state,
      revision: Number.isSafeInteger(candidate.revision) && (candidate.revision ?? -1) >= 0
        ? Number(candidate.revision) + 1
        : 1,
      updatedAt: new Date().toISOString(),
      format: 1,
    };
    return persist(next);
  } catch {
    throw new Error("Este backup não é uma campanha compatível com Crônicas da Guilda.");
  }
}

export function clearLocalCampaign(): void {
  localStorage.removeItem(LOCAL_SAVE_KEY);
}
