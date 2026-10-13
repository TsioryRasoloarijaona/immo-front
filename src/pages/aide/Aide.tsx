import { useState, type ReactNode } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { ArrowUpRight, CircleHelp, Info, Search, TriangleAlert } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState } from '../../components/ui';
import { buttonVariants } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import type { GuideAide } from './guides';
import { filtrerGuides, guidesVisibles, sommaireParTheme, titreDuTheme } from './recherche';

/** Section Aide : sommaire par thème à gauche (au-dessus sur écran étroit), guide ouvert à droite (FEATURE-aide.md). */
export default function Aide() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [recherche, setRecherche] = useState('');

  const visibles = guidesVisibles(user);
  const trouves = filtrerGuides(visibles, recherche);
  // Sans slug, le premier guide ; un slug inconnu ou réservé à un autre rôle donne « Guide introuvable ».
  const guide = slug ? visibles.find((g) => g.slug === slug) : visibles.at(0);

  return (
    <PageShell
      title="Aide"
      crumbs={guide ? [{ label: 'Aide', to: '/aide' }, { label: guide.titre }] : [{ label: 'Aide' }]}
      icon={<CircleHelp />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
    >
      <div className="grid grid-cols-1 gap-4 pt-1 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-16">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Rechercher dans l'aide"
              placeholder="Rechercher un guide…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </InputGroup>
          <Sommaire guides={trouves} actif={guide?.slug} />
        </aside>
        {guide ? (
          <VueGuide guide={guide} />
        ) : (
          <EmptyState
            title="Guide introuvable"
            message="Ce guide n'existe pas ou ne concerne pas votre rôle."
            action={
              <Link to="/aide" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Voir les guides
              </Link>
            }
          />
        )}
      </div>
    </PageShell>
  );
}

function Sommaire({ guides, actif }: Readonly<{ guides: readonly GuideAide[]; actif?: string }>) {
  if (guides.length === 0) {
    return <p className="px-1 text-body text-muted-foreground">Aucun guide ne correspond à cette recherche.</p>;
  }
  return (
    <nav aria-label="Sommaire de l'aide" className="flex max-h-80 flex-col gap-3 overflow-y-auto lg:max-h-[calc(100svh-10rem)]">
      {sommaireParTheme(guides).map((s) => (
        <section key={s.titre} className="flex flex-col gap-0.5">
          <h2 className="px-2 pb-1 text-micro font-semibold tracking-wide text-muted-foreground uppercase">{s.titre}</h2>
          <ul className="flex flex-col gap-0.5">
            {s.guides.map((g) => (
              <li key={g.slug}>
                <NavLink
                  to={`/aide/${g.slug}`}
                  aria-current={g.slug === actif ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-2 py-1.5 text-body no-underline transition-colors',
                    g.slug === actif
                      ? 'bg-(--brand-bg) font-medium text-(--brand)'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  {g.titre}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function VueGuide({ guide }: Readonly<{ guide: GuideAide }>) {
  return (
    <article aria-labelledby="aide-titre" className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <header className="flex flex-col gap-1.5">
        <span className="text-micro font-semibold tracking-wide text-muted-foreground uppercase">{titreDuTheme(guide)}</span>
        <h2 id="aide-titre" className="text-hero font-semibold tracking-tight text-foreground">{guide.titre}</h2>
        <p className="text-body text-muted-foreground">
          <span className="font-medium text-foreground">À quoi ça sert : </span>
          {guide.resume}
        </p>
      </header>

      {guide.video && (
        <video controls preload="metadata" src={guide.video} className="w-full rounded-lg border border-border bg-black">
          <track kind="captions" />
        </video>
      )}

      <ol className="flex flex-col gap-3">
        {guide.etapes.map((etape, i) => (
          <li key={etape} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--brand-bg) text-micro font-semibold text-(--brand) tabular-nums"
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-body leading-relaxed text-foreground">{etape}</span>
          </li>
        ))}
      </ol>

      {guide.bonASavoir && (
        <Encadre
          titre="Bon à savoir"
          icone={<Info aria-hidden className="size-4 shrink-0" />}
          classe="border-(--info-border) bg-(--info-bg) text-(--info)"
          lignes={guide.bonASavoir}
        />
      )}
      {guide.attention && (
        <Encadre
          titre="Attention"
          icone={<TriangleAlert aria-hidden className="size-4 shrink-0" />}
          classe="border-(--amber-border) bg-(--amber-bg) text-(--amber)"
          lignes={guide.attention}
        />
      )}

      {guide.ecran && (
        <div>
          <Link to={guide.ecran} className={buttonVariants({ size: 'sm' })}>
            Ouvrir l'écran <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      )}
    </article>
  );
}

function Encadre({
  titre,
  icone,
  classe,
  lignes,
}: Readonly<{ titre: string; icone: ReactNode; classe: string; lignes: readonly string[] }>) {
  return (
    <section aria-label={titre} className={cn('flex flex-col gap-1.5 rounded-lg border px-4 py-3', classe)}>
      <h3 className="flex items-center gap-2 text-label font-semibold">
        {icone}
        {titre}
      </h3>
      <ul className="flex list-disc flex-col gap-1 pl-10 text-body text-foreground marker:text-current">
        {lignes.map((ligne) => (
          <li key={ligne}>{ligne}</li>
        ))}
      </ul>
    </section>
  );
}
