import { MatchResult } from './results';

export interface ResultsSourceMeta {
  sourceUrl: string;
  source: string | null;
  updatedAt: string | null;
  total: number;
}

interface ResultsPayload {
  source?: unknown;
  updatedAt?: unknown;
  matches?: unknown;
}

function normalizeStage(value: unknown): MatchResult['stage'] {
  const stage = String(value || '').toLowerCase();
  if (stage === 'round_of_32' || stage === 'last_32') return 'round32';
  if (stage === 'round of 32' || stage === '1/16 final' || stage === '16vos') return 'round32';
  if (stage === 'round_of_16') return 'round16';
  if (stage === 'quarterfinals') return 'quarters';
  if (stage === 'semifinals') return 'semis';
  if (stage === 'groups' || stage === 'round32' || stage === 'round16' || stage === 'quarters' || stage === 'semis' || stage === 'final') {
    return stage;
  }
  return 'groups';
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMatch(raw: any, index: number): MatchResult {
  return {
    id: String(raw?.id || `gist-${index}`),
    homeTeam: String(raw?.homeTeam || ''),
    awayTeam: String(raw?.awayTeam || ''),
    homeGoals: toNumber(raw?.homeGoals ?? raw?.homeScore),
    awayGoals: toNumber(raw?.awayGoals ?? raw?.awayScore),
    winner: typeof raw?.winner === 'string' && raw.winner.trim() ? String(raw.winner).trim() : undefined,
    stage: normalizeStage(raw?.stage),
    finished: typeof raw?.finished === 'boolean' ? raw.finished : true,
  };
}

export function getResultsGistUrl(): string {
  const raw = String(import.meta.env.VITE_RESULTS_GIST_URL || '').trim();
  if (!raw) {
    throw new Error('Missing VITE_RESULTS_GIST_URL');
  }
  return raw;
}

export async function fetchResultsFromGist(): Promise<{ matches: MatchResult[]; meta: ResultsSourceMeta }> {
  const sourceUrl = getResultsGistUrl();
  const response = await fetch(sourceUrl, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch gist results (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  const objectPayload = (payload && typeof payload === 'object') ? (payload as ResultsPayload) : null;
  const rawMatches = Array.isArray(payload)
    ? payload
    : Array.isArray(objectPayload?.matches)
      ? objectPayload?.matches
      : [];

  const matches = rawMatches.map((item, index) => parseMatch(item, index));
  const meta: ResultsSourceMeta = {
    sourceUrl,
    source: typeof objectPayload?.source === 'string' ? objectPayload.source : null,
    updatedAt: typeof objectPayload?.updatedAt === 'string' ? objectPayload.updatedAt : null,
    total: matches.length,
  };

  return { matches, meta };
}