import type { BrandIcon, WebsiteMatch } from '../types';

/**
 * Logo-Suche über frei nutzbare Dienste ohne API-Schlüssel – alle liefern CORS-Header,
 * damit die Bilder im Editor zugeschnitten und lokal gespeichert werden können:
 * - Simple Icons: ~3'400 einfarbige Marken-Icons (Katalog einmalig laden, lokal durchsuchen)
 * - Clearbit Autocomplete: Firmenname → Website
 * - Favicone: Website-Icon bis 256 px
 */
const SIMPLE_ICONS_VERSION = '15';
export const SIMPLE_ICONS_INDEX_URL = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/data/simple-icons.json`;
const COMPANY_SUGGEST_URL = 'https://autocomplete.clearbit.com/v1/companies/suggest';

const MAX_BRANDS = 12;
const MAX_WEBSITES = 6;

export function brandIconUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${encodeURIComponent(slug)}`;
}

export function websiteIconUrl(domain: string): string {
  return `https://favicone.com/${encodeURIComponent(domain)}?s=256`;
}

/** Vergleichsform: ohne Akzente, Leer- und Sonderzeichen ("Disney+" → "disney"). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// ─── Simple Icons ───────────────────────────────────────────────────────────

interface IndexedBrand {
  icon: BrandIcon;
  terms: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';

function aliasTerms(aliases: unknown): string[] {
  if (!isRecord(aliases)) return [];
  const aka = Array.isArray(aliases.aka) ? aliases.aka.filter(isString) : [];
  const localized = isRecord(aliases.loc) ? Object.values(aliases.loc).filter(isString) : [];
  return [...aka, ...localized];
}

function parseIndex(data: unknown): IndexedBrand[] {
  const entries = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.icons) ? data.icons : [];
  return entries.flatMap((entry: unknown) => {
    if (!isRecord(entry) || !isString(entry.slug) || !isString(entry.title) || !isString(entry.hex)) return [];
    const icon: BrandIcon = { slug: entry.slug, title: entry.title, hex: entry.hex };
    const terms = [entry.title, entry.slug, ...aliasTerms(entry.aliases)].map(normalize).filter(Boolean);
    return [{ icon, terms }];
  });
}

let indexPromise: Promise<IndexedBrand[]> | null = null;

function loadIndex(): Promise<IndexedBrand[]> {
  indexPromise ??= fetch(SIMPLE_ICONS_INDEX_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Katalog nicht erreichbar (${response.status})`);
      return response.json() as Promise<unknown>;
    })
    .then(parseIndex)
    .catch((error: unknown) => {
      indexPromise = null; // beim nächsten Versuch neu laden
      throw error;
    });
  return indexPromise;
}

/** 0 = exakt, 1 = Wortanfang, 2 = enthalten; null = kein Treffer. */
function matchScore(terms: string[], query: string): number | null {
  let best: number | null = null;
  for (const term of terms) {
    const score = term === query ? 0 : term.startsWith(query) ? 1 : term.includes(query) ? 2 : null;
    if (score !== null && (best === null || score < best)) best = score;
  }
  return best;
}

export async function searchBrandIcons(query: string): Promise<BrandIcon[]> {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const index = await loadIndex();
  return index
    .flatMap((brand) => {
      const score = matchScore(brand.terms, needle);
      return score === null ? [] : [{ brand, score }];
    })
    .sort((a, b) => a.score - b.score || a.brand.icon.title.length - b.brand.icon.title.length)
    .slice(0, MAX_BRANDS)
    .map(({ brand }) => brand.icon);
}

// ─── Websites ───────────────────────────────────────────────────────────────

/** "https://www.netflix.com/ch" → "netflix.com"; null, wenn es nicht nach einer Domain aussieht. */
export function toDomain(query: string): string | null {
  const host = query
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0];
  return host && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export async function searchWebsites(query: string, signal?: AbortSignal): Promise<WebsiteMatch[]> {
  const domain = toDomain(query);
  if (domain) return [{ name: domain, domain }];
  if (query.trim().length < 2) return [];

  const response = await fetch(`${COMPANY_SUGGEST_URL}?query=${encodeURIComponent(query.trim())}`, { signal });
  if (!response.ok) throw new Error(`Firmensuche nicht erreichbar (${response.status})`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  return data
    .flatMap((entry: unknown) => {
      if (!isRecord(entry) || !isString(entry.domain) || !isString(entry.name)) return [];
      const key = entry.domain.toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ name: entry.name, domain: key }];
    })
    .slice(0, MAX_WEBSITES);
}
