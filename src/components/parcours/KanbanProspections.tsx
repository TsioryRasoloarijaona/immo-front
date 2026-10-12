import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CarteKanban from './CarteKanban';
import ProchaineActionDialog from './ProchaineActionDialog';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import { avancerProspection, listProspections, type ProspectionFilterParams } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { estChefOuExempte } from '../../lib/roles';
import { prospectionDisplayName } from '../../lib/domain';
import { formatNumber } from '../../lib/format';
import { CARTES_PAR_COLONNE, COLONNES_CARTE, colonnesKanban, type ColonneKanban } from '../../lib/kanban';
import { useEtapesProspection } from '../../lib/referentiels';
import { useToast } from '../../lib/toastContext';
import { cn } from '../../lib/utils';
import type { FiltresAvancesProspection, PageDto, ProspectionListItemDto } from '../../types';

interface ContenuColonne {
  cartes: ProspectionListItemDto[];
  total: number;
}

interface Deplacement {
  carte: ProspectionListItemDto;
  depuis: ColonneKanban;
  vers: ColonneKanban;
}

const TRI = ['docDate,desc', 'id,asc'];

function charger(filtres: ProspectionFilterParams, avances: FiltresAvancesProspection | undefined, valeur: string | null): Promise<PageDto<ProspectionListItemDto>> {
  return listProspections(filtres, { page: 0, size: CARTES_PAR_COLONNE, sort: TRI }, {
    colonnes: COLONNES_CARTE,
    filtres: avances,
    depliage: { groupeColonne: 'etape', groupeValeur: valeur },
  });
}

/** Une requête par colonne (au plus 200 cartes) ; les lignes sans étape rejoignent la première colonne. */
async function chargerColonnes(colonnes: ColonneKanban[], filtres: ProspectionFilterParams, avances: FiltresAvancesProspection | undefined) {
  const pages = await Promise.all(colonnes.map((c) => charger(filtres, avances, c.etape.code ?? c.etape.id)));
  const sansEtape = colonnes.some((c) => c.recoitSansEtape) ? await charger(filtres, avances, null) : null;
  return new Map<string, ContenuColonne>(colonnes.map((c, i) => {
    const page = pages[i];
    const extra = c.recoitSansEtape && sansEtape ? sansEtape : null;
    return [c.etape.id, { cartes: [...page.content, ...(extra?.content ?? [])], total: page.totalElements + (extra?.totalElements ?? 0) }];
  }));
}

/** Kanban des prospections : mêmes filtres que la liste (FEATURE-parcours-commercial.md §4). */
export default function KanbanProspections({
  filtres,
  avances,
  cle,
  onOuvrir,
}: Readonly<{
  filtres: ProspectionFilterParams;
  avances: FiltresAvancesProspection | undefined;
  /** Clé sérialisée des filtres : la relance du chargement en dépend. */
  cle: string;
  onOuvrir: (id: string) => void;
}>) {
  const { user } = useAuth();
  const showToast = useToast();
  const etapes = useEtapesProspection();
  const colonnes = colonnesKanban(etapes.data);
  const [ouvertes, setOuvertes] = useState<ReadonlySet<string>>(new Set());
  const [glissee, setGlissee] = useState<{ carte: ProspectionListItemDto; depuis: ColonneKanban } | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const [deplacement, setDeplacement] = useState<Deplacement | null>(null);

  const contenu = useApi(
    () => (colonnes.length > 0 ? chargerColonnes(colonnes, filtres, avances) : Promise.resolve(null)),
    [cle, colonnes.map((c) => c.etape.id).join(',')],
  );

  const erreur = contenu.error ?? etapes.error;
  if (erreur) return <ErrorState message={erreur} />;
  if (!etapes.loading && colonnes.length === 0) {
    return <EmptyState title="Aucune étape" message="Le référentiel des étapes de prospection est vide." />;
  }
  if (!contenu.data) return <LoadingState />;
  const donnees = contenu.data;

  const cibles = (depuis: ColonneKanban) =>
    colonnes.filter((c) => c.etape.id !== depuis.etape.id).map((c) => ({ id: c.etape.id, libelle: c.libelle }));
  const deposer = (carte: ProspectionListItemDto, depuis: ColonneKanban, versId: string) => {
    const vers = colonnes.find((c) => c.etape.id === versId);
    if (vers && vers.etape.id !== depuis.etape.id) setDeplacement({ carte, depuis, vers });
  };

  function cartesDe(c: ColonneKanban): ProspectionListItemDto[] {
    const base = (donnees.get(c.etape.id)?.cartes ?? []).filter((p) => p.id !== deplacement?.carte.id);
    return deplacement?.vers.etape.id === c.etape.id ? [deplacement.carte, ...base] : base;
  }

  return (
    <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto pb-2" aria-busy={contenu.loading}>
      {colonnes.map((c) => {
        const total = donnees.get(c.etape.id)?.total ?? 0;
        const cartes = cartesDe(c);
        const autres = Math.max(0, total - (donnees.get(c.etape.id)?.cartes.length ?? 0));
        const ouverte = !c.repliee || ouvertes.has(c.etape.id);
        const basculer = () => setOuvertes((s) => {
          const n = new Set(s);
          if (n.has(c.etape.id)) n.delete(c.etape.id); else n.add(c.etape.id);
          return n;
        });
        return (
          <section
            key={c.etape.id}
            aria-label={`${c.libelle} · ${formatNumber(total)}`}
            onDragOver={(e) => {
              if (!glissee || glissee.depuis.etape.id === c.etape.id) return;
              e.preventDefault();
              setSurvol(c.etape.id);
            }}
            onDragLeave={() => setSurvol((s) => (s === c.etape.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(null);
              if (glissee) deposer(glissee.carte, glissee.depuis, c.etape.id);
              setGlissee(null);
            }}
            className={cn(
              'flex shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/40 p-2',
              ouverte ? 'w-64' : 'w-12 items-center',
              survol === c.etape.id && 'border-primary bg-(--brand-bg)',
            )}
          >
            <header className={cn('flex items-center justify-between gap-1', !ouverte && 'flex-col')}>
              {c.repliee && (
                <button type="button" onClick={basculer} aria-expanded={ouverte} aria-label={`${ouverte ? 'Replier' : 'Déplier'} ${c.libelle}`} className="rounded p-0.5 text-muted-foreground hover:bg-muted">
                  {ouverte ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
                </button>
              )}
              {ouverte ? <Badge tone="progress">{c.libelle}</Badge> : <span className="text-micro text-muted-foreground [writing-mode:vertical-rl]">{c.libelle}</span>}
              <span className="text-micro font-semibold text-muted-foreground tabular-nums">{formatNumber(total)}</span>
            </header>
            {ouverte && (
              <ul className="flex min-h-12 flex-1 flex-col gap-1.5 overflow-y-auto">
                {cartes.map((p) => (
                  <CarteKanban
                    key={p.id}
                    carte={p}
                    cibles={cibles(c)}
                    avecCommercial={estChefOuExempte(user)}
                    enAttente={deplacement?.carte.id === p.id}
                    onOuvrir={() => onOuvrir(p.id)}
                    onDeplacer={(versId) => deposer(p, c, versId)}
                    onGlisser={() => setGlissee({ carte: p, depuis: c })}
                  />
                ))}
                {autres > 0 && <li className="px-1 text-micro text-muted-foreground">+ {formatNumber(autres)} autres — affinez les filtres ou passez en liste</li>}
              </ul>
            )}
          </section>
        );
      })}
      {deplacement && (
        <ProchaineActionDialog
          nom={prospectionDisplayName(deplacement.carte)}
          depuis={deplacement.depuis.libelle}
          vers={deplacement.vers.libelle}
          onClose={() => setDeplacement(null)}
          onSubmit={async (prochaineAction, phrase) => {
            await avancerProspection(deplacement.carte.id, { etapeId: deplacement.vers.etape.id, prochaineAction });
            await contenu.refetch();
            showToast(phrase);
          }}
        />
      )}
    </div>
  );
}
