import { Children, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Coins, Folder, PhoneCall, Sparkles, TrendingUp, UserCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { usePreview } from '../lib/previewContext';
import {
  getDashboard,
  listClients,
  listDossiers,
  listNouveauxPreProspects,
  listPreProspections,
  listProspections,
  listRelancesDashboard,
} from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate, formatTelephone, toApiDateTime, todayISO } from '../lib/format';
import { canonicalStatusLabel, estStatutSortie, toneForStatus } from '../lib/dossierStatus';
import type { PorteeRelance, RelanceProspectionDto } from '../types';
import { etapeBadgeTone, prospectionDisplayName, PIPELINE_STAGES } from '../lib/domain';

// Étapes counted as "needs action" for the Vente actuality panel — the
// pipeline's own starting stage plus its two side-track exception states
// (see CLAUDE.md / lib/domain.tsx's PIPELINE_STAGES / isSideTrackEtape).
// Not "2 EN COURS DE TRAITEMENT" onward — those are already being worked,
// this bucket is specifically the ones nobody has picked up yet.
const A_TRAITER_ETAPES = [PIPELINE_STAGES[0], 'A RAPPELER PAR LE COMMERCIAL', 'AFFAIRES A SUIVRE'];

/* ---------------------------------------------------------------------------
   La file du jour — le bloc que cet écran existe pour porter.

   Ce qu'il remplace : une tuile « Relances en retard » alimentée par
   `DashboardDto.relancesEnRetard`, qui porte les relances de **dossier**
   (rappels de titre foncier) et que le serveur renvoie **vide**. L'écran
   affichait donc 0 pendant que 75 relances *commerciales* attendaient d'être
   passées. Deux populations, une seule câblée, et la mauvaise.

   **Ce panneau est une file de travail, pas un compteur d'arriéré, et il le
   dit.** `echeance=RETARD` est borné à 30 jours glissants côté serveur,
   délibérément : la base porte 3 710 relances en retard dont 2 020 de plus
   d'un an. Intituler ce bloc « relances en retard » sans plus le ferait
   mentir presque autant que le « 0 » d'avant — d'où la mention de la fenêtre
   et le lien vers l'arriéré complet.
   --------------------------------------------------------------------------- */

/** Une relance à passer. Le numéro est mis en avant parce que c'est l'action :
 * mesuré **50/50 renseigné** là où le nom manque une fois sur cinquante. Sur
 * une pré-prospection il est même la seule prise — aucune fiche tiers
 * n'existe encore. */
function LigneRelance({ r }: { r: RelanceProspectionDto }) {
  const tel = (r.telephone ?? '').replace(/\s/g, '');
  return (
    <div className="flex min-w-0 items-baseline gap-2.5 border-b border-border py-1.5 last:border-b-0">
      <span
        className={`shrink-0 tabular-nums text-micro font-semibold ${r.joursDeRetard ? 'text-(--warning)' : 'text-(--info)'}`}
        title={r.dateRelance ? `Échéance du ${formatDate(r.dateRelance)}` : undefined}
      >
        {r.joursDeRetard ? `${r.joursDeRetard} j` : "auj."}
      </span>

      <Link
        to={`/${r.preProspection ? 'pre-prospections' : 'prospections'}/${r.prospectionId}`}
        className="min-w-0 flex-1 truncate text-body font-semibold text-foreground no-underline hover:underline"
      >
        {r.prospectNom || <span className="font-normal text-muted-foreground italic">Lead sans nom</span>}
      </Link>

      {tel ? (
        <a
          href={`tel:${tel}`}
          className="shrink-0 tabular-nums text-body text-(--info) no-underline hover:underline"
          title="Appeler"
        >
          {formatTelephone(r.telephone)}
        </a>
      ) : (
        <span className="shrink-0 text-micro text-muted-foreground">pas de numéro</span>
      )}

      <span className="hidden shrink-0 text-micro text-muted-foreground sm:inline">
        {r.nonAffectee ? 'non affectée' : r.commercialNom || '—'}
      </span>
    </div>
  );
}

/** Une des deux colonnes de la file : « Aujourd'hui » ou « En retard ». */
function ColonneRelances({
  titre,
  precision,
  icone,
  accent,
  accentBg,
  etat,
  messageVide,
}: {
  titre: string;
  precision?: string;
  icone: ReactNode;
  accent: string;
  accentBg: string;
  etat: { data: { content: RelanceProspectionDto[]; totalElements: number } | null; loading: boolean; error: string | null };
  messageVide: string;
}) {
  const page = etat.data;
  const reste = page ? page.totalElements - page.content.length : 0;
  return (
    <div className="overflow-hidden rounded-lg border border-border" style={{ background: accentBg }}>
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="flex items-baseline gap-2 px-3 pt-2">
        <span className="shrink-0" style={{ color: accent }}>{icone}</span>
        <span className="text-label font-semibold text-foreground">{titre}</span>
        {precision && <span className="text-micro text-muted-foreground">{precision}</span>}
        <span className="ml-auto text-hero font-semibold tabular-nums" style={{ color: accent }}>
          {page ? page.totalElements : '—'}
        </span>
      </div>
      <div className="px-3 pb-2">
        {etat.loading && !page && <span className="text-micro text-muted-foreground">Chargement…</span>}
        {etat.error && <span className="text-micro text-destructive">{etat.error}</span>}
        {page && page.content.length === 0 && (
          <p className="py-2 text-body text-muted-foreground">{messageVide}</p>
        )}
        {page?.content.map((r) => <LigneRelance key={r.interactionId} r={r} />)}
        {reste > 0 && (
          <p className="pt-1.5 text-micro text-muted-foreground">et {reste} de plus</p>
        )}
      </div>
    </div>
  );
}

function nDaysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** One column of a dashboard "lane" grid — used both by the "Pipeline"
 * Kanban (four entity stages, identified by icon shape — see
 * index.css's section-identity convention: --sec-accent is one shared hue
 * across every entity, the icon is what actually distinguishes them) and by
 * "Vente — actualité" (two urgency states, which *do* get distinct
 * semantic colors — info/amber are meaningful here, not identity). Each
 * column is its own contained, tinted card (a thin accent bar on top plus a
 * subtle background) so lanes read as separate at a glance instead of one
 * continuous wall of text — the previous version relied on plain
 * side-by-side text (Vente — actualité) or a `divide-x` border too faint
 * against the dark theme to actually separate anything (Pipeline). */
function KanbanColumn({
  icon,
  title,
  subtitle,
  count,
  emptyMessage,
  viewAllTo,
  accent = 'var(--sec-accent)',
  accentBg = 'var(--sec-accent-bg)',
  countTone = 'neutral',
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Small muted qualifier next to the title, e.g. "(7 derniers jours)". */
  subtitle?: string;
  count: number | undefined;
  emptyMessage: string;
  /** Shown as a "Voir tout" footer link when the real total exceeds what's
   * previewed here — every column only ever renders a handful of records. */
  viewAllTo: string;
  /** Defaults to the shared section-identity accent (Pipeline's case).
   * Pass a semantic status color (e.g. `var(--info)`/`var(--amber)`) for
   * lanes that represent an urgency state rather than an entity type. */
  accent?: string;
  accentBg?: string;
  /** 'neutral' (Pipeline — the count is just a tally, not itself a signal)
   * or 'accent' (Vente — actualité — the count *is* the urgency signal, so
   * it gets the same color as the lane). */
  countTone?: 'neutral' | 'accent';
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-(--neutral-bg)/50">
      <span aria-hidden className="block h-0.75 shrink-0" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3" style={{ color: accent, background: accentBg }}>
            {icon}
          </span>
          <span className="truncate text-body font-semibold text-foreground">{title}</span>
          {subtitle && <span className="truncate text-micro font-normal text-muted-foreground">{subtitle}</span>}
        </div>
        <span
          className="shrink-0 rounded-full px-1.75 py-0.5 text-micro font-bold tabular-nums shadow-xs"
          style={countTone === 'accent' ? { color: accent, background: accentBg } : { color: 'var(--foreground)', background: 'var(--background)' }}
        >
          {count ?? 0}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        {items.length === 0 ? (
          <p className="px-1.5 py-2 text-micro text-muted-foreground">{emptyMessage}</p>
        ) : (
          items
        )}
      </div>
      {items.length > 0 && (
        <Link
          to={viewAllTo}
          className="flex items-center justify-center gap-0.5 border-t border-border/70 py-1.5 text-micro font-medium text-muted-foreground no-underline transition-colors hover:bg-background hover:text-primary"
        >
          Voir tout
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

/** Shared hover-pill treatment for every Kanban row — a plain name (Pré-
 * prospection/Prospections/Clients) or the richer name+badge row (Dossier
 * de vente) both get the same rounded hover surface and truncation. */
function KanbanItemRow({ onClick, to, children }: { onClick?: () => void; to?: string; children: ReactNode }) {
  const className =
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body font-medium text-foreground no-underline transition-colors hover:bg-background';
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export default function Dashboard() {
  const { data: dashboard, loading, error } = useApi(() => getDashboard(), []);
  /* `sort` explicite : sans lui le serveur rend un ordre non déterministe —
     le défaut déjà payé sur la pagination des listes — et la carte
     « Prospections récentes » plus bas montrait six prospections ouvertes
     prises au hasard sous un titre qui promettait les dernières. */
  const { data: prospectionsPage } = useApi(
    () => listProspections({ ouvertes: true }, { size: 7, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: dossiersPage } = useApi(() => listDossiers(undefined, { size: 7, sort: ['docDate,desc'] }), []);
  const { data: nouvellesPage } = useApi(
    () => listProspections({ ouvertes: true, dateDebut: toApiDateTime(nDaysAgoISO(7)) }, { size: 5, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: aTraiterPage } = useApi(
    () => listProspections({ ouvertes: true, etape: A_TRAITER_ETAPES }, { size: 5, sort: ['dateDocument,desc'] }),
    [],
  );
  // Kanban's own two columns not already covered by an existing fetch —
  // Prospections reuses `prospectionsPage` above, Dossier de vente reuses
  // `dossiersPage` below, both already fetched for their own cards.
  const { data: preProspectionsPage } = useApi(
    () => listPreProspections({ ouvertes: true }, { size: 4, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: clientsPage } = useApi(() => listClients(undefined, { size: 4, sort: ['code,desc'] }), []);

  /* `MOI` est le défaut du serveur et le bon défaut métier — un commercial
     ouvre son tableau de bord pour voir *ses* rappels. La bascule vers
     l'équipe reste à un clic, et elle compte : sur le jeu réel, ce compte voit
     2 relances en propre pour 75 côté équipe. */
  const [portee, setPortee] = useState<PorteeRelance>('MOI');
  const relancesJour = useApi(
    () => listRelancesDashboard({ echeance: 'AUJOURDHUI', portee }, { size: 6 }),
    [portee],
  );
  const relancesRetard = useApi(
    () => listRelancesDashboard({ echeance: 'RETARD', portee }, { size: 6 }),
    [portee],
  );
  /* Date seule, pas un instant : le paramètre `jour` est un `format: date`. */
  const leadsDuJour = useApi(() => listNouveauxPreProspects(todayISO(), { size: 5 }), []);

  const { previewDossier } = usePreview();

  if (loading) return <PageShell title="Dashboard"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard"><ErrorState message={error} /></PageShell>;
  if (!dashboard) return null;

  const statusCounts = dashboard.dossiersParEtape ?? [];
  /* « Actifs » veut dire ce que le serveur entend par là. `dossiersParEtape`
     renvoie **toutes** les étapes, sorties comprises — 15 `ANNULATION` et 5
     `DESISTEMENT` sur 116 —, et sommer le tableau entier annonçait donc 116
     dossiers actifs. L'agrégat affiché juste à côté disait déjà le contraire :
     `panierMoyen` divise `valeurPipeline` par 96, pas par 116. L'écran se
     contredisait lui-même. */
  const dossiersActifs = statusCounts
    .filter((c) => !estStatutSortie(c.etape))
    .reduce((s, c) => s + (c.nombre ?? 0), 0);

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]}>
      {/* Everything below is sized to land on one screen at a normal laptop
          viewport (~900px tall) — dense stat row, then a 3-column bank of
          panels — rather than a single tall column that forces scrolling. */}
      <div className="flex flex-col gap-3">
        {/* -----------------------------------------------------------------
            Premier bloc, pleine largeur, avant même les chiffres du
            portefeuille : c'est le travail de la journée, et le reste de
            l'écran est du contexte. L'ordre de lecture porte la priorité —
            un commercial qui ouvre l'application doit voir qui rappeler sans
            chercher.
            ----------------------------------------------------------------- */}
        <Card
          title="À rappeler"
          accent="var(--warning)"
          padded={false}
          action={
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {(['MOI', 'EQUIPE'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPortee(v)}
                  aria-pressed={portee === v}
                  className={`rounded px-2 py-0.5 text-micro font-medium ${
                    portee === v ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v === 'MOI' ? 'Moi' : 'Équipe'}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
            <ColonneRelances
              titre="Aujourd'hui"
              icone={<PhoneCall className="size-3.5" />}
              accent="var(--info)"
              accentBg="var(--info-bg)"
              etat={relancesJour}
              messageVide="Rien d'échu aujourd'hui."
            />
            <ColonneRelances
              titre="En retard"
              precision="1 à 30 jours"
              icone={<AlertTriangle className="size-3.5" />}
              accent="var(--warning)"
              accentBg="var(--warning-bg)"
              etat={relancesRetard}
              messageVide="Aucun retard sur les 30 derniers jours."
            />
          </div>

          {/* La borne de 30 jours est une décision serveur, pas un hasard de
              pagination : la base porte 2 020 relances de plus d'un an, qui
              feraient de ce panneau un cimetière plutôt qu'une file. Le dire
              ici est ce qui sépare un chiffre juste d'un chiffre trompeur —
              et le lien donne la sortie vers l'arriéré complet. */}
          <p className="border-t border-border px-3 py-1.5 text-micro text-muted-foreground">
            File de travail bornée aux 30 derniers jours. Les relances désarmées — prospection transformée en vente — n'y
            figurent pas.{' '}
            <Link to="/prospections" className="text-(--info) hover:underline">
              Voir toutes les prospections
            </Link>
          </p>
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <StatCard icon={<Coins />} label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} tone="progress" />
          <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} tone="info" />
          <StatCard
            icon={<Users />}
            label="Prospections ouvertes"
            value={String(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${dashboard.prospectionsTotal ?? 0} au total`}
            tone="info"
          />
          <StatCard icon={<Folder />} label="Dossiers actifs" value={String(dossiersActifs)} tone="success" />
          {/* Ce que l'écran promettait de compter, enfin compté — et sur la
              bonne population. La précision « 30 j » n'est pas décorative :
              sans elle la tuile se lirait comme l'arriéré total, qu'elle
              n'est pas. */}
          <StatCard
            icon={<AlertTriangle />}
            label="Relances en retard"
            value={relancesRetard.data ? String(relancesRetard.data.totalElements) : '—'}
            sub="30 derniers jours"
            tone="warning"
          />
        </div>

        <Card title="Vente — actualité" accent="var(--sec-accent)" padded={false}>
          {/* Briefly answers "what's new" and "what needs picking up" for
              the Ventes pipeline, side by side — Nouveau is prospections
              created in the last 7 days (dateDebut filter), À traiter is
              prospections still sitting in the pipeline's starting stage or
              a side-track exception state (A_TRAITER_ETAPES, see above) —
              nobody has moved them forward yet. Both are real server-side
              filtered counts (totalElements), not client-side guesses.
              Reuses the same contained-lane treatment as the Pipeline
              Kanban below (KanbanColumn), just with semantic info/amber
              accents instead of the shared identity accent — these two
              lanes are urgency states, not entity types, so distinct color
              is meaningful here. */}
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
            <KanbanColumn
              icon={<Sparkles />}
              title="Nouveau"
              subtitle="7 derniers jours"
              count={nouvellesPage?.totalElements}
              emptyMessage="Aucune nouvelle prospection."
              viewAllTo="/prospections"
              accent="var(--info)"
              accentBg="var(--info-bg)"
              countTone="accent"
            >
              {nouvellesPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                  <span className="shrink-0 text-micro text-muted-foreground">{formatDate(p.dateDocument)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn
              icon={<AlertCircle />}
              title="À traiter"
              subtitle="non prises en charge"
              count={aTraiterPage?.totalElements}
              emptyMessage="Rien à traiter — pipeline à jour."
              viewAllTo="/prospections"
              accent="var(--amber)"
              accentBg="var(--amber-bg)"
              countTone="accent"
            >
              {aTraiterPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                  <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                    {p.etape || '—'}
                  </Badge>
                </KanbanItemRow>
              ))}
            </KanbanColumn>
          </div>
        </Card>

        <Card title="Pipeline" accent="var(--sec-accent)" padded={false}>
          {/* Funnel view of the whole Ventes flow, one column per stage —
              replaces the old "Dossiers par étape" bar chart (dossier
              statuses only) with the full pré-prospection → prospection →
              client → dossier journey. Each column is its own tinted card
              (see KanbanColumn) with a real server-side count (totalElements
              from the matching list endpoint) plus its most recent few
              records. There's no drag/drop — records move stage by their
              own workflow action (transformer, créer prospect, créer
              dossier), not by dragging a card here. */}
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <KanbanColumn
              icon={<UserPlus />}
              title="Pré-prospection"
              count={preProspectionsPage?.totalElements}
              emptyMessage="Aucune pré-prospection."
              viewAllTo="/pre-prospections"
            >
              {preProspectionsPage?.content.map((p) => (
                <KanbanItemRow to={`/pre-prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 truncate">{prospectionDisplayName(p)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn
              icon={<Users />}
              title="Prospections"
              count={dashboard.prospectionsOuvertes}
              emptyMessage="Aucune prospection ouverte."
              viewAllTo="/prospections"
            >
              {prospectionsPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 truncate">{prospectionDisplayName(p)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn icon={<UserCheck />} title="Clients" count={clientsPage?.totalElements} emptyMessage="Aucun client." viewAllTo="/clients">
              {clientsPage?.content.map((c) => (
                <KanbanItemRow to={`/clients/${c.id}`} key={c.id}>
                  <span className="min-w-0 truncate">{c.nomAffiche || '—'}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn icon={<Folder />} title="Dossier de vente" count={dossiersActifs} emptyMessage="Aucun dossier actif." viewAllTo="/dossiers">
              {dossiersPage?.content.slice(0, 4).map((d) => (
                <KanbanItemRow onClick={() => previewDossier(d.id)} key={d.id}>
                  <span className="min-w-0 flex-1 truncate">{d.clientNom || '—'}</span>
                  <Badge tone={toneForStatus(d.statut)} className="shrink-0 text-micro">
                    {canonicalStatusLabel(d.statut) || d.statut || '—'}
                  </Badge>
                </KanbanItemRow>
              ))}
            </KanbanColumn>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Prend la place de l'ancienne carte « Relances en retard », qui
              lisait `DashboardDto.relancesEnRetard` — les relances de
              *dossier*, que le serveur renvoie vides. Les relances
              commerciales sont montées dans le bloc de tête ; cette place
              revient aux leads du jour, l'autre moitié du travail entrant. */}
          <Card
            title="Leads du jour"
            action={
              <Link to="/pre-prospections" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            }
          >
            {leadsDuJour.error && <ErrorState message={leadsDuJour.error} />}
            {leadsDuJour.data && leadsDuJour.data.content.length === 0 ? (
              /* Une journée à zéro est le cas courant, pas une panne :
                 l'injection est automatique et arrive par rafales — la
                 plupart des jours à zéro, puis des pointes à 20 ou 34,
                 week-end compris. L'état vide doit donc rassurer, pas
                 alerter. */
              <EmptyState
                title="Aucun lead aujourd'hui"
                message="Les leads arrivent par rafales : une journée vide est normale."
              />
            ) : (
              <div>
                {leadsDuJour.data?.content.map((l) => {
                  const tel = (l.telephone ?? '').replace(/\s/g, '');
                  return (
                    <div
                      className="flex items-baseline gap-2.5 border-b border-border py-2 last:border-b-0"
                      key={l.prospectionId}
                    >
                      <Sparkles className="size-3 shrink-0 self-center text-(--info)" />
                      <Link
                        to={`/pre-prospections/${l.prospectionId}`}
                        className="min-w-0 flex-1 truncate text-body font-semibold text-foreground no-underline hover:underline"
                      >
                        {l.nom || <span className="font-normal text-muted-foreground italic">Lead anonyme</span>}
                      </Link>
                      {/* Sur une pré-prospection, aucune fiche tiers n'existe
                          encore : le numéro saisi au premier contact est la
                          seule prise sur ce lead. */}
                      {tel ? (
                        <a href={`tel:${tel}`} className="shrink-0 tabular-nums text-body text-(--info) no-underline hover:underline">
                          {formatTelephone(l.telephone)}
                        </a>
                      ) : (
                        <span className="shrink-0 text-micro text-muted-foreground">pas de numéro</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            title="Prospections récentes"
            action={
              <Link to="/prospections" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            }
          >
            {!prospectionsPage || prospectionsPage.content.length === 0 ? (
              <EmptyState title="Aucune prospection" />
            ) : (
              <div>
                {prospectionsPage.content.slice(0, 6).map((p) => (
                  <Link
                    to={`/prospections/${p.id}`}
                    className="flex w-full items-center gap-2.5 border-b border-border py-2 text-left no-underline last:border-b-0"
                    key={p.id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body font-semibold text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="truncate text-micro text-muted-foreground">{p.commercialNom || '—'}</div>
                    </div>
                    <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                      {p.etape || '—'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Dossiers récents"
          action={
            <Link to="/dossiers" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          }
          padded={false}
        >
          {!dossiersPage || dossiersPage.content.length === 0 ? (
            <EmptyState title="Aucun dossier" />
          ) : (
            /* Passé au primitif : cette table était la seule à réimplémenter
               `<table>` à la main, donc la seule que la densité de grille
               n'atteignait pas. Le `pl-4`/`pr-4` sur les cellules de bord
               remplace l'ancien `px-4` uniforme — la Card est `padded={false}`,
               c'est donc la table qui porte la gouttière du bloc : sans ça la
               colonne « Client » ne s'aligne plus sous le titre de la Card. */
            <Table containerClassName="overflow-x-auto">
              <TableHeader>
                <TableRow className="text-muted-foreground hover:bg-transparent [&>*:first-child]:pl-4 [&>*:last-child]:pr-4">
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Commercial</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-right text-muted-foreground">Prix</TableHead>
                  <TableHead className="text-right text-muted-foreground">Total à payer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossiersPage.content.slice(0, 7).map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer last:border-b-0 hover:bg-(--surface-hover) [&>*:first-child]:pl-4 [&>*:last-child]:pr-4"
                    onClick={() => previewDossier(d.id)}
                  >
                    <TableCell className="font-medium text-foreground">{d.clientNom || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.commercialNom || '—'}</TableCell>
                    <TableCell>
                      {/* Le Kanban plus haut passait déjà par `canonicalStatusLabel`
                          et `toneForStatus` ; ce tableau affichait le code brut
                          (`CONCRETISATION`) sous une pastille neutre en dur. Le
                          même champ se lisait de deux façons sur le même écran, et
                          la couleur n'y portait plus rien. */}
                      <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || d.statut || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">{formatCurrency(d.prix)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(d.totalAPayer)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
