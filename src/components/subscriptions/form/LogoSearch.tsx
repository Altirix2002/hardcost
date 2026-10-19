import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Loader2, SearchX, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { brandIconUrl, searchBrandIcons, searchWebsites, websiteIconUrl } from '../../../services/logoSearch';
import type { BrandIcon, LogoSource, WebsiteMatch } from '../../../types';
import { cn } from '../../../utils/cn';
import { INSET_PANEL } from '../../../utils/fieldStyles';
import { spring, springWithFade } from '../../../utils/motion';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';

interface LogoSearchProps {
  initialQuery: string;
  onPick: (source: LogoSource) => void;
  onCancel: () => void;
}

interface SearchResults {
  query: string;
  brands: BrandIcon[];
  websites: WebsiteMatch[];
  failed: boolean;
}

interface ResultTile {
  key: string;
  label: string;
  imageUrl: string;
  source: LogoSource;
}

const DEBOUNCE_MS = 350;

const TILE =
  'flex w-full flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center transition-colors hover:bg-zinc-900/5 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:hover:bg-white/10';

function ResultSection({
  title,
  icon: Icon,
  tiles,
  hidden,
  onHide,
  onPick,
}: {
  title: string;
  icon: LucideIcon;
  tiles: ResultTile[];
  hidden: Set<string>;
  onHide: (key: string) => void;
  onPick: (source: LogoSource) => void;
}) {
  const visible = tiles.filter((tile) => !hidden.has(tile.key));
  if (visible.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h4 className="flex items-center gap-1.5 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </h4>
      <ul className="grid grid-cols-4 gap-1 sm:grid-cols-6">
        {visible.map((tile, index) => (
          <motion.li
            key={tile.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: { ...springWithFade, delay: index * 0.02 } }}
          >
            <motion.button
              type="button"
              onClick={() => onPick(tile.source)}
              whileTap={{ scale: 0.92 }}
              transition={spring}
              className={TILE}
            >
              <img
                src={tile.imageUrl}
                alt=""
                crossOrigin="anonymous"
                loading="lazy"
                onError={() => onHide(tile.key)}
                className="h-12 w-12 rounded-[30%] bg-white object-contain p-2 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              />
              <span className="w-full truncate text-[11px] leading-tight text-zinc-600 dark:text-zinc-300">{tile.label}</span>
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/** Logo im Netz suchen: Marken-Icons (Simple Icons) und Website-Icons. */
export function LogoSearch({ initialQuery, onPick, onCancel }: LogoSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const trimmed = query.trim();
  const loading = trimmed.length >= 2 && results?.query !== trimmed;

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void Promise.allSettled([searchBrandIcons(trimmed), searchWebsites(trimmed, controller.signal)]).then(
        ([brands, websites]) => {
          if (controller.signal.aborted) return;
          setResults({
            query: trimmed,
            brands: brands.status === 'fulfilled' ? brands.value : [],
            websites: websites.status === 'fulfilled' ? websites.value : [],
            failed: brands.status === 'rejected' && websites.status === 'rejected',
          });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const current = results?.query === trimmed ? results : null;
  const brandTiles: ResultTile[] = (current?.brands ?? []).map((brand) => ({
    key: `brand-${brand.slug}`,
    label: brand.title,
    imageUrl: brandIconUrl(brand.slug),
    source: { src: brandIconUrl(brand.slug), monochrome: true, brandColor: `#${brand.hex.toLowerCase()}` },
  }));
  const websiteTiles: ResultTile[] = (current?.websites ?? []).map((site) => ({
    key: `site-${site.domain}`,
    label: site.domain,
    imageUrl: websiteIconUrl(site.domain),
    source: { src: websiteIconUrl(site.domain) },
  }));
  const visibleCount = [...brandTiles, ...websiteTiles].filter((tile) => !hidden.has(tile.key)).length;
  const hide = (key: string) => setHidden((previous) => new Set(previous).add(key));

  return (
    <div className={cn(INSET_PANEL, 'flex flex-col gap-4')}>
      <TextField
        label="Logo suchen"
        placeholder="Name oder Website, z.B. netflix.com"
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          // Enter soll nicht das ganze Abo speichern.
          if (event.key === 'Enter') event.preventDefault();
        }}
      />

      <div className="flex min-h-24 flex-col gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 items-center justify-center text-zinc-400"
            >
              <Loader2 className="h-6 w-6 animate-spin" aria-label="Suche läuft" />
            </motion.div>
          ) : current && visibleCount > 0 ? (
            <motion.div key={`results-${current.query}`} className="flex flex-col gap-4">
              <ResultSection title="Marken" icon={Sparkles} tiles={brandTiles} hidden={hidden} onHide={hide} onPick={onPick} />
              <ResultSection title="Websites" icon={Globe} tiles={websiteTiles} hidden={hidden} onHide={hide} onPick={onPick} />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
            >
              <SearchX className="h-6 w-6 text-zinc-400" aria-hidden />
              {trimmed.length < 2
                ? 'Mindestens zwei Zeichen eingeben.'
                : current?.failed
                  ? 'Die Logo-Suche braucht eine Internetverbindung.'
                  : 'Nichts gefunden – versuch es mit der Website, z.B. firma.ch.'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          Der Suchbegriff geht an Simple Icons, Clearbit und Favicone. Das gewählte Logo wird lokal gespeichert.
        </p>
        <Button size="sm" variant="ghost" onClick={onCancel} className="shrink-0">
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
