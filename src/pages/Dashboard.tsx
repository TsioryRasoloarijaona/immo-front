import { Children, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Folder, PhoneCall, UserCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SyntheseAnnuelle from '../components/SyntheseAnnuelle';
import { Badge, Card, ErrorState, LoadingState } from '../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { usePreview } from '../lib/previewContext';
import {
  getDashboard,
  listClients,
  listDossiers,
  listPreProspections,
  listProspections,
  listRelancesDashboard,
} from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate, formatTelephone } from '../lib/format';
import { canonicalStatusLabel, estStatutSortie, toneForStatus } from '../lib/dossierStatus';
import type { PorteeRelance, RelanceProspectionDto } from '../types';
import { etapeBadgeTone, prospectionDisplayName, PIPELINE_STAGES } from '../lib/domain';

/* ---------------------------------------------------------------------------
   Redesign 20/09 — un seul viewport, plus aucun défilement de page.

   L'écran précédent empilait ~1500px (trois hauteurs d'écran) avec deux
   doublons : `prospectionsPage` rendu deux fois (couloir Pipeline + carte
   « Prospections récentes »), `dossiersPage` rendu deux fois (couloir + table
   « Dossiers récents »), et trois StatCards qui redisaient des compteurs déjà
   visibles ailleurs sur le même écran. La géométrie est maintenant celle des
   listes (`fullHeight`) : bande KPI, puis une rangée [file de travail |
   pipeline / (synthèse + dossiers)] qui occupe le reste du viewport.

   Ce qui a été fusionné plutôt que supprimé :
   - « Vente — actualité » (Nouveau / À traiter) : « À traiter » devient un
     couloir à part entière du pipeline (c'est une étape de travail, ambre) ;
     « Nouveau (7 j) » disparaît — les couloirs sont déjà triés
     dateDocument,desc, leurs premières lignes SONT les nouvelles.
   - « Leads du jour » : vide la plupart des jours (l'injection arrive par
     rafales), il coûtait 140px d'état vide. Le couloir Pré-prospections
     porte la même information, triée par date.
   - « Prospections récentes » : doublon strict du couloir Prospections.
   Appels au montage : 10 → 8 (− listNouveauxPreProspects, − la requête
   « Nouveau 7 j »).
   --------------------------------------------------------------------------- */

// Étapes counted as "needs action" for the À traiter lane — the pipeline's
// own starting stage plus its two side-track exception states (see CLAUDE.md
// / lib/domain.tsx's PIPELINE_STAGES / isSideTrackEtape). Not "2 EN COURS DE
// TRAITEMENT" onward — those are already being worked, this bucket is
// specifically the ones nobody has picked up yet.
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

/** Combien de lignes on affiche par section de la file. */
const LIGNES_AFFICHEES = 6;

/** Combien on en demande au serveur — toute la file, pas les six affichées.
 *
 * **L'endpoint ignore `sort`** : `dateRelance,desc`, `joursDeRetard,asc` et
 * leurs inverses rendent tous le même ordre, échéance croissante, figé côté
 * serveur. Pour montrer les plus récentes il faut donc prendre la **fin** de la
 * file. Inverser la page de six donnerait « les six plus anciennes à
 * l'envers » — le genre de faux exact que cet écran a déjà servi une fois.
 *
 * Le surcoût est mesuré et négligeable : les 75 lignes de la file reviennent en
 * 367 ms contre 118 pour six. La borne serveur de 30 jours garantit que cette
 * file reste petite par construction ; `fileComplete` ci-dessous vérifie
 * l'hypothèse au lieu de la supposer. */
const TAILLE_FILE = 200;

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

/** Une des deux sections de la file : « Aujourd'hui » ou « En retard ». */
function ColonneRelances({
  titre,
  precision,
  icone,
  accent,
  accentBg,
  etat,
  messageVide,
  plusRecentesDAbord,
}: {
  titre: string;
  precision?: string;
  icone: ReactNode;
  accent: string;
  accentBg: string;
  etat: { data: { content: RelanceProspectionDto[]; totalElements: number } | null; loading: boolean; error: string | null };
  messageVide: string;
  /** `true` pour la section « En retard » : afficher la fin de la file, les
   * plus récentes d'abord. Sans objet sur « Aujourd'hui », dont toutes les
   * lignes sont à zéro jour. */
  plusRecentesDAbord?: boolean;
}) {
  const page = etat.data;
  /* La fin de la file, renversée — le serveur ne sait trier que dans l'autre
     sens. Voir `TAILLE_FILE`. */
  const lignes = !page
    ? []
    : plusRecentesDAbord
      ? page.content.slice(-LIGNES_AFFICHEES).reverse()
      : page.content.slice(0, LIGNES_AFFICHEES);
  /* Ce qui reste **non affiché**, pas ce qui reste non chargé : on charge
     désormais toute la file pour pouvoir en prendre la fin, donc compter sur
     `content.length` afficherait « et 0 de plus » en masquant 69 lignes. */
  const reste = page ? page.totalElements - lignes.length : 0;
  /* L'hypothèse « la file tient dans une page » est vérifiée, pas supposée :
     si elle tombait, `slice(-6)` rendrait la fin du *premier lot* et non la
     fin de la file — les plus récentes seraient fausses sans rien signaler. */
  const fileComplete = !page || page.content.length >= page.totalElements;
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
        {lignes.map((r) => <LigneRelance key={r.interactionId} r={r} />)}
        {reste > 0 && (
          <p className="pt-1.5 text-micro text-muted-foreground">et {reste} de plus</p>
        )}
        {!fileComplete && plusRecentesDAbord && (
          <p className="pt-1.5 text-micro text-(--amber)">
            File plus longue que prévu — ces lignes ne sont pas forcément les plus récentes.
          </p>
        )}
      </div>
    </div>
  );
}

/** One lane of the pipeline band. Entity lanes share the section-identity
 * accent (icon shape distinguishes them — see index.css); the À traiter lane
 * passes a semantic amber because it is an urgency state, not an entity. */
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
  /** Small muted qualifier next to the title. */
  subtitle?: string;
  count: number | undefined;
  emptyMessage: string;
  /** Shown as a "Voir tout" footer link when the real total exceeds what's
   * previewed here — every column only ever renders a handful of records. */
  viewAllTo: string;
  accent?: string;
  accentBg?: string;
  /** 'neutral' (the count is just a tally) or 'accent' (the count *is* the
   * urgency signal, so it gets the same color as the lane). */
  countTone?: 'neutral' | 'accent';
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-(--neutral-bg)/50">
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
          style={countTone === 'accent' ? { color: accent, background: accentBg } : { color: 'var(--foreground)', background: 'var(--secondary)' }}
        >
          {count ?? 0}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden p-1.5">
        {items.length === 0 ? (
          <p className="px-1.5 py-2 text-micro text-muted-foreground">{emptyMessage}</p>
        ) : (
          items
        )}
      </div>
      {items.length > 0 && (
        <Link
          to={viewAllTo}
          className="flex shrink-0 items-center justify-center gap-0.5 border-t border-border/70 py-1.5 text-micro font-medium text-muted-foreground no-underline transition-colors hover:bg-background hover:text-primary"
        >
          Voir tout
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

/** Une section de la bande KPI segmentée — label micro, gros chiffre
 * tabulaire, précision en dessous. */
function KpiCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-4 py-2.5">
      <span className="text-micro font-medium text-muted-foreground">{label}</span>
      <span className="text-hero font-semibold tabular-nums tracking-tight text-foreground">{value}</span>
      {sub && <span className="text-micro text-muted-foreground">{sub}</span>}
    </div>
  );
}

/** Shared hover-pill treatment for every Kanban row. */
function KanbanItemRow({ onClick, to, children }: { onClick?: () => void; to?: string; children: ReactNode }) {
  const className =
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body font-medium text-foreground no-underline transition-colors hover:bg-(--surface-hover)';
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
     le défaut déjà payé sur la pagination des listes. Les premières lignes de
     chaque couloir sont ce que « récent » veut dire sur cet écran. */
  const { data: prospectionsPage } = useApi(
    () => listProspections({ ouvertes: true }, { size: 7, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: dossiersPage } = useApi(() => listDossiers(undefined, { size: 7, sort: ['docDate,desc'] }), []);
  const { data: aTraiterPage } = useApi(
    () => listProspections({ ouvertes: true, etape: A_TRAITER_ETAPES }, { size: 5, sort: ['dateDocument,desc'] }),
    [],
  );
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
    () => listRelancesDashboard({ echeance: 'AUJOURDHUI', portee }, { size: TAILLE_FILE }),
    [portee],
  );
  const relancesRetard = useApi(
    () => listRelancesDashboard({ echeance: 'RETARD', portee }, { size: TAILLE_FILE }),
    [portee],
  );

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
  const dossiersTotal = statusCounts.reduce((s, c) => s + (c.nombre ?? 0), 0);

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]} fullHeight>
      {/* Un seul viewport : la colonne racine est bornée par `fullHeight` et
          ne défile qu'en dégradé (petit écran) — au format nominal tout tient.
          L'ordre de lecture porte la priorité : la file de travail est en
          haut-gauche, seule zone où vit le rouge ; les chiffres d'argent en
          bande KPI ; l'état du pipeline au centre ; le contexte annuel et les
          derniers dossiers en pied. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-1">
        {/* Bande KPI segmentée (référence Uxerflow) : UNE carte, quatre
            sections séparées par un filet — pas quatre cartes. Le chiffre
            porte la hiérarchie, pas une icône colorée. */}
        <div className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border xl:grid-cols-4">
          <KpiCell label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} />
          <KpiCell label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} sub={`sur ${dossiersActifs} dossiers actifs`} />
          <KpiCell
            label="Prospections ouvertes"
            value={String(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${dashboard.prospectionsTotal ?? 0} au total`}
          />
          <KpiCell label="Dossiers actifs" value={String(dossiersActifs)} sub={`sur ${dossiersTotal} au total`} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
          {/* -------------------------------------------------------------
              Niveau 1 — la file de travail. Haut-gauche, accent warning :
              c'est le travail de la journée, le reste de l'écran est du
              contexte. Un commercial qui ouvre l'application doit voir qui
              rappeler sans chercher.
              ------------------------------------------------------------- */}
          <Card
            title="À rappeler"
            accent="var(--warning)"
            padded={false}
            className="flex min-h-0 flex-col xl:w-[336px] xl:shrink-0 [&>[data-slot=card-content]]:flex [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:flex-1 [&>[data-slot=card-content]]:flex-col"
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
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
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
                plusRecentesDAbord
              />
            </div>

            {/* La borne de 30 jours est une décision serveur, pas un hasard de
                pagination : la base porte 2 020 relances de plus d'un an, qui
                feraient de ce panneau un cimetière plutôt qu'une file. Le dire
                ici est ce qui sépare un chiffre juste d'un chiffre trompeur —
                et le lien donne la sortie vers l'arriéré complet. */}
            <p className="shrink-0 border-t border-border px-3 py-1.5 text-micro text-muted-foreground">
              File bornée aux 30 derniers jours. Les relances désarmées n'y figurent pas.{' '}
              <Link to="/prospections" className="text-(--info) hover:underline">
                Toutes les prospections
              </Link>
            </p>
          </Card>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            {/* -----------------------------------------------------------
                Niveau 3 — l'état du flux, en une seule bande de cinq
                couloirs : pré-prospection → à traiter → prospection →
                client → dossier. « À traiter » est un couloir d'urgence
                (ambre) intercalé à sa place réelle dans le flux ; les
                autres sont des entités (accent partagé, l'icône
                distingue). Comptes serveur réels (totalElements), pas des
                estimations client. Pas de drag/drop — un enregistrement
                change d'étape par sa propre action métier.
                ----------------------------------------------------------- */}
            <Card title="Pipeline" accent="var(--sec-accent)" padded={false} className="flex min-h-[176px] flex-1 flex-col [&>[data-slot=card-content]]:flex [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:flex-1 [&>[data-slot=card-content]]:flex-col">
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-5">
                <KanbanColumn
                  icon={<UserPlus />}
                  title="Pré-prospection"
                  count={preProspectionsPage?.totalElements}
                  emptyMessage="Aucune pré-prospection."
                  viewAllTo="/pre-prospections"
                >
                  {preProspectionsPage?.content.slice(0, 3).map((p) => (
                    <KanbanItemRow to={`/pre-prospections/${p.id}`} key={p.id}>
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
                  {aTraiterPage?.content.slice(0, 3).map((p) => (
                    <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                      <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                      <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                        {p.etape || '—'}
                      </Badge>
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
                  {prospectionsPage?.content.slice(0, 3).map((p) => (
                    <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                      <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                      <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                        {p.etape || '—'}
                      </Badge>
                    </KanbanItemRow>
                  ))}
                </KanbanColumn>

                <KanbanColumn icon={<UserCheck />} title="Clients" count={clientsPage?.totalElements} emptyMessage="Aucun client." viewAllTo="/clients">
                  {clientsPage?.content.slice(0, 3).map((c) => (
                    <KanbanItemRow to={`/clients/${c.id}`} key={c.id}>
                      <span className="min-w-0 truncate">{c.nomAffiche || '—'}</span>
                    </KanbanItemRow>
                  ))}
                </KanbanColumn>

                <KanbanColumn icon={<Folder />} title="Dossier de vente" count={dossiersActifs} emptyMessage="Aucun dossier actif." viewAllTo="/dossiers">
                  {dossiersPage?.content.slice(0, 3).map((d) => (
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

            {/* -----------------------------------------------------------
                Niveau 2 — l'argent dans le temps, et les derniers dossiers
                avec leurs montants. Côte à côte au format large, empilés
                en dessous — la synthèse garde la majorité de la largeur
                pour ses douze barres.
                ----------------------------------------------------------- */}
            <div className="flex shrink-0 flex-col gap-3 min-[1500px]:flex-row">
              <div className="min-w-0 min-[1500px]:flex-[13]">
                <SyntheseAnnuelle />
              </div>

              <Card
                title="Dossiers récents"
                className="min-w-0 min-[1500px]:flex-[9]"
                action={
                  <Link to="/dossiers" className="text-xs font-medium text-primary hover:underline">
                    Voir tout
                  </Link>
                }
                padded={false}
              >
                {!dossiersPage || dossiersPage.content.length === 0 ? (
                  <p className="px-4 py-3 text-body text-muted-foreground">Aucun dossier.</p>
                ) : (
                  /* Le primitif Table, pour hériter de la densité de grille.
                     Le `pl-4`/`pr-4` sur les cellules de bord remplace
                     l'ancien `px-4` uniforme — la Card est `padded={false}`,
                     c'est donc la table qui porte la gouttière du bloc. */
                  <Table containerClassName="overflow-x-auto">
                    <TableHeader>
                      <TableRow className="text-muted-foreground hover:bg-transparent [&>*:first-child]:pl-4 [&>*:last-child]:pr-4">
                        <TableHead className="text-muted-foreground">Client</TableHead>
                        <TableHead className="text-muted-foreground">Statut</TableHead>
                        <TableHead className="text-right text-muted-foreground">Prix</TableHead>
                        <TableHead className="text-muted-foreground">Commercial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dossiersPage.content.slice(0, 6).map((d) => (
                        <TableRow
                          key={d.id}
                          className="cursor-pointer last:border-b-0 hover:bg-(--surface-hover) [&>*:first-child]:pl-4 [&>*:last-child]:pr-4"
                          onClick={() => previewDossier(d.id)}
                        >
                          <TableCell className="font-medium text-foreground">{d.clientNom || '—'}</TableCell>
                          <TableCell>
                            <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || d.statut || '—'}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-foreground">{formatCurrency(d.prix)}</TableCell>
                          <TableCell className="text-muted-foreground">{d.commercialNom || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
