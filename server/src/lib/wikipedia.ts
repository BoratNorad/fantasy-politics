/**
 * Minimal Wikipedia REST client. Used to fill in player photos/bios (Phase 1)
 * and, from Phase 3, to fetch weekly pageviews for Media Share scoring.
 *
 * Wikimedia asks API clients to send a descriptive User-Agent.
 */
const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ?? 'FantasyPoliticsGame/0.1 (self-hosted hobby project)';

export interface WikiSummary {
  title: string;
  extract: string | null;
  thumbnail: string | null;
}

export async function fetchWikiSummary(title: string, lang = 'en'): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, '_'),
  )}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status} for "${title}"`);
  const data = (await res.json()) as {
    title: string;
    extract?: string;
    thumbnail?: { source: string };
    originalimage?: { source: string };
  };
  return {
    title: data.title,
    extract: data.extract ?? null,
    thumbnail: data.thumbnail?.source ?? data.originalimage?.source ?? null,
  };
}
