import { Children, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Folder, PhoneCall, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import RefSelect from '../components/RefSelect';
import { useAuth } from '../lib/auth';
import SyntheseAnnuelle from '../components/SyntheseAnnuelle';
import { Badge, Card, ErrorState, LoadingState } from '../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import FicheProspectionLazy, { type FicheOuverte } from '../components/dashboard/FicheProspectionLazy';
import ListeProspectionsDialog from '../components/dashboard/ListeProspectionsDialog';
import ListeRelancesDialog from '../components/dashboard/ListeRelancesDialog';
import { usePreview } from '../lib/previewContext';
import {
  getDashboard,
  getTranchesReferentiel,
  listClients,
  listDossiers,
  listPreProspections,
  listProspections,
  listRelancesDashboard,
  type ProspectionFilterParams,
} from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate, formatNumber, formatTelephone } from '../lib/format';
import { estAdministrateur } from '../lib/roles';
import { canonicalStatusLabel, estStatutSortie, toneForStatus } from '../lib/dossierStatus';
import type { PorteeRelance, ReferentielItemDto, RelanceProspectionDto, UUID } from '../types';
import { etapeBadgeTone, prospectionDisplayName, PIPELINE_STAGES } from '../lib/domain';

const A_TRAITER_ETAPES = [PIPELINE_STAGES[0], 'A RAPPELER PAR LE COMMERCIAL', 'AFFAIRES A SUIVRE'];

/* Déclarés une fois, lus par le couloir et par son dialogue « Voir tout » : la
   liste complète doit compter ce que le couloir annonce. */
const FILTRES_OUVERTES: ProspectionFilterParams = { ouvertes: true };
const FILTRES_A_TRAITER: ProspectionFilterParams = { ouvertes: true, etape: A_TRAITER_ETAPES };

function avecTranche(filtres: ProspectionFilterParams, trancheId: UUID | undefined): ProspectionFilterParams {
  return trancheId ? { ...filtres, trancheId: [trancheId] } : filtres;
}

function libelleTranche(t: ReferentielItemDto): string {
  return [t.code, t.description].filter(Boolean).join(' — ') || t.id;
}

type ListeOuverte = 'relances-jour' | 'relances-retard' | 'pre-prospections' | 'a-traiter' | 'prospections';

const LIGNES_COULOIR = 5;

// Relances commerciales, pas `DashboardDto.relancesEnRetard` (relances de dossier, servies vides).
// `echeance=RETARD` est borné à 30 jours glissants côté serveur.

const LIGNES_AFFICHEES = 6;

/* Toute la file, pas les six affichées : l'endpoint ignore `sort` (échéance
   croissante figée), les plus récentes sont donc la fin de la file.
   `fileComplete` vérifie qu'elle tient dans une page. */
const TAILLE_FILE = 200;

function LigneRelance({ r, onOuvrir }: Readonly<{ r: RelanceProspectionDto; onOuvrir: (fiche: FicheOuverte) => void }>) {
  const tel = (r.telephone ?? '').replace(/\s/g, '');
  return (
    <div className="flex min-w-0 items-baseline gap-2.5 border-b border-border py-1.5 last:border-b-0">
      <span
        className={`shrink-0 tabular-nums text-micro font-semibold ${r.joursDeRetard ? 'text-(--warning)' : 'text-(--info)'}`}
        title={r.dateRelance ? `Échéance du ${formatDate(r.dateRelance)}` : undefined}
      >
        {r.joursDeRetard ? `${r.joursDeRetard} j` : "auj."}
      </span>

      <button
        type="button"
        onClick={() => onOuvrir({ id: r.prospectionId, pre: !!r.preProspection })}
        className="min-w-0 flex-1 truncate text-left text-body font-semibold text-foreground hover:underline"
      >
        {r.prospectNom || <span className="font-normal text-muted-foreground italic">Lead sans nom</span>}
      </button>

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

function ColonneRelances({
  titre,
  precision,
  icone,
  accent,
  accentBg,
  etat,
  messageVide,
  plusRecentesDAbord,
  onOuvrir,
  onVoirTout,
}: Readonly<{
  onOuvrir: (fiche: FicheOuverte) => void;
  onVoirTout: () => void;
  titre: string;
  precision?: string;
  icone: ReactNode;
  accent: string;
  accentBg: string;
  etat: { data: { content: RelanceProspectionDto[]; totalElements: number } | null; loading: boolean; error: string | null };
  messageVide: string;
  plusRecentesDAbord?: boolean;
}>) {
  const page = etat.data;
  // La fin de la file, renversée : le serveur ne trie que dans l'autre sens.
  let lignes: RelanceProspectionDto[] = [];
  if (page) {
    lignes = plusRecentesDAbord ? page.content.slice(-LIGNES_AFFICHEES).reverse() : page.content.slice(0, LIGNES_AFFICHEES);
  }
  // Le reste non affiché, pas non chargé : toute la file est chargée.
  const reste = page ? page.totalElements - lignes.length : 0;
  // Si la file dépasse une page, `slice(-6)` rendrait la fin du premier lot, pas celle de la file.
  const fileComplete = !page || page.content.length >= page.totalElements;
  return (
    <div className="overflow-hidden rounded-lg" style={{ background: accentBg }}>
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
        {lignes.map((r) => <LigneRelance key={r.interactionId} r={r} onOuvrir={onOuvrir} />)}
        {page && page.totalElements > 0 && (
          <button
            type="button"
            onClick={onVoirTout}
            className="mt-1.5 flex items-center gap-0.5 text-micro font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voir tout{reste > 0 ? ` — ${reste} de plus` : ''}
            <ChevronRight className="size-3" />
          </button>
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

function KanbanColumn({
  icon,
  title,
  subtitle,
  count,
  emptyMessage,
  error,
  viewAllTo,
  onVoirTout,
  accent = 'var(--sec-accent)',
  accentBg = 'var(--sec-accent-bg)',
  countTone = 'neutral',
  className = '',
  children,
}: Readonly<{
  icon: ReactNode;
  title: string;
  subtitle?: string;
  count: number | undefined;
  emptyMessage: string;
  /** Rendu à la place de `emptyMessage`, compte `—` : sans lui une erreur se lirait « vide / 0 ». */
  error?: string | null;
  viewAllTo?: string;
  /** L'emporte sur `viewAllTo`. */
  onVoirTout?: () => void;
  accent?: string;
  accentBg?: string;
  countTone?: 'neutral' | 'accent';
  className?: string;
  children: ReactNode;
}>) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-lg bg-(--neutral-bg)/50 ${className}`}>
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
          {count ?? (error ? '—' : 0)}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden p-1.5">
        {error && <p className="px-1.5 py-2 text-micro text-(--destructive)">{error}</p>}
        {!error && items.length === 0 && <p className="px-1.5 py-2 text-micro text-muted-foreground">{emptyMessage}</p>}
        {!error && items}
      </div>
      {items.length > 0 && onVoirTout && (
        <button type="button" onClick={onVoirTout} className={CLASSE_VOIR_TOUT}>
          Voir tout
          <ChevronRight className="size-3" />
        </button>
      )}
      {items.length > 0 && !onVoirTout && viewAllTo && (
        <Link to={viewAllTo} className={`${CLASSE_VOIR_TOUT} no-underline`}>
          Voir tout
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

const CLASSE_VOIR_TOUT =
  'flex w-full shrink-0 items-center justify-center gap-0.5 border-t border-border/70 py-1.5 text-micro font-medium text-muted-foreground transition-colors hover:bg-background hover:text-primary';

function KpiCell({ label, value, sub }: Readonly<{ label: string; value: string; sub?: string }>) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-4 py-2.5">
      <span className="text-micro font-medium text-muted-foreground">{label}</span>
      <span className="text-hero font-semibold tabular-nums tracking-tight text-foreground">{value}</span>
      {sub && <span className="text-micro text-muted-foreground">{sub}</span>}
    </div>
  );
}

function KanbanItemRow({ onClick, to, children }: Readonly<{ onClick?: () => void; to?: string; children: ReactNode }>) {
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

/* Propriété d'entité `docDate`, pas le champ DTO `dateDocument` : sinon 400.
   `id,asc` départage les ex æquo, sans lui l'ordre n'est pas déterministe. */
const TRI_PROSPECTIONS = ['docDate,desc', 'id,asc'];

export default function Dashboard() {
  /* Le backend répond 403 à un non-admin qui envoie `trancheId` : pour lui aucun
     `trancheId` ne part, et `?tranche=` dans l'URL est ignoré. */
  const { user } = useAuth();
  const isAdmin = estAdministrateur(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const trancheId: UUID | undefined = isAdmin ? searchParams.get('tranche') || undefined : undefined;
  const choisirTranche = (id: UUID | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('tranche', id);
        else next.delete('tranche');
        return next;
      },
      { replace: true },
    );
  };
  const tranches = useApi(
    () => (isAdmin ? getTranchesReferentiel() : Promise.resolve([] as ReferentielItemDto[])),
    [isAdmin],
  );
  const trancheActive = trancheId ? tranches.data?.find((t) => t.id === trancheId) : undefined;

  const filtresOuvertes = useMemo(() => avecTranche(FILTRES_OUVERTES, trancheId), [trancheId]);
  const filtresATraiter = useMemo(() => avecTranche(FILTRES_A_TRAITER, trancheId), [trancheId]);

  const { data: dashboard, loading, error } = useApi(() => getDashboard({ trancheId }), [trancheId]);
  const { data: prospectionsPage, error: prospectionsErreur } = useApi(
    () => listProspections(filtresOuvertes, { size: LIGNES_COULOIR, sort: TRI_PROSPECTIONS }),
    [trancheId],
  );
  // 7 et non `LIGNES_COULOIR` : la même page alimente aussi « Dossiers récents ».
  const { data: dossiersPage, error: dossiersErreur } = useApi(
    () => listDossiers(trancheId ? { trancheId: [trancheId] } : undefined, { size: 7, sort: ['docDate,desc'] }),
    [trancheId],
  );
  const { data: aTraiterPage, error: aTraiterErreur } = useApi(
    () => listProspections(filtresATraiter, { size: LIGNES_COULOIR, sort: TRI_PROSPECTIONS }),
    [trancheId],
  );
  const { data: preProspectionsPage, error: preProspectionsErreur } = useApi(
    () => listPreProspections(filtresOuvertes, { size: LIGNES_COULOIR, sort: TRI_PROSPECTIONS }),
    [trancheId],
  );
  const { data: clientsPage, error: clientsErreur } = useApi(
    () => listClients(trancheId ? { trancheId } : undefined, { size: LIGNES_COULOIR, sort: ['code,desc'] }),
    [trancheId],
  );

  const [portee, setPortee] = useState<PorteeRelance>('MOI');
  const relancesJour = useApi(
    () => listRelancesDashboard({ echeance: 'AUJOURDHUI', portee, trancheId }, { size: TAILLE_FILE }),
    [portee, trancheId],
  );
  const relancesRetard = useApi(
    () => listRelancesDashboard({ echeance: 'RETARD', portee, trancheId }, { size: TAILLE_FILE }),
    [portee, trancheId],
  );

  const { previewDossier } = usePreview();

  // `fiche` ne sert qu'aux lignes cliquées sur le tableau de bord ; une liste ouverte gère les siennes.
  const [liste, setListe] = useState<ListeOuverte | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);

  // Rendu aussi sur les états chargement / erreur : une tranche qui échoue doit rester réversible.
  const filtreTranche = isAdmin ? (
    <div className="flex flex-wrap items-center gap-2">
      {trancheId && (
        <span className="inline-flex items-center gap-1 rounded-full bg-(--sec-accent-bg) py-0.5 pr-1 pl-2.5 text-micro font-medium text-(--sec-accent)">
          Tranche : {trancheActive?.code || trancheActive?.description || '…'}
          <button
            type="button"
            onClick={() => choisirTranche(null)}
            className="rounded-full p-0.5 hover:bg-background/60"
            aria-label="Revenir à toutes les tranches"
            title="Toutes les tranches"
          >
            <X className="size-3" />
          </button>
        </span>
      )}
      <div className="w-64 max-w-full">
        <RefSelect
          id="dashboard-tranche"
          label="Tranche"
          size="sm"
          placeholder="Toutes les tranches"
          value={trancheId ?? null}
          onChange={choisirTranche}
          items={(tranches.data ?? []).map((t) => ({ label: libelleTranche(t), value: t.id }))}
        />
      </div>
    </div>
  ) : undefined;

  if (loading && !dashboard) return <PageShell title="Dashboard" actions={filtreTranche}><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard" actions={filtreTranche}><ErrorState message={error} /></PageShell>;
  if (!dashboard) return null;

  const statusCounts = dashboard.dossiersParEtape ?? [];
  /* `dossiersParEtape` inclut les étapes de sortie : les exclure, comme le fait
     le serveur pour `panierMoyen`. */
  const dossiersActifs = statusCounts
    .filter((c) => !estStatutSortie(c.etape))
    .reduce((s, c) => s + (c.nombre ?? 0), 0);
  const dossiersTotal = statusCounts.reduce((s, c) => s + (c.nombre ?? 0), 0);

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]} actions={filtreTranche} fullHeight>
      <div
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-1 transition-opacity ${loading ? 'opacity-60' : ''}`}
        aria-busy={loading}
      >
        <div className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border xl:grid-cols-4">
          <KpiCell label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} />
          <KpiCell label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} sub={`sur ${formatNumber(dossiersActifs)} dossiers actifs`} />
          <KpiCell
            label="Prospections ouvertes"
            value={formatNumber(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${formatNumber(dashboard.prospectionsTotal ?? 0)} au total`}
          />
          <KpiCell label="Dossiers actifs" value={formatNumber(dossiersActifs)} sub={`sur ${formatNumber(dossiersTotal)} au total`} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
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
                onOuvrir={setFiche}
                onVoirTout={() => setListe('relances-jour')}
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
                onOuvrir={setFiche}
                onVoirTout={() => setListe('relances-retard')}
              />
            </div>

            <p className="shrink-0 border-t border-border px-3 py-1.5 text-micro text-muted-foreground">
              File bornée aux 30 derniers jours. Les relances désarmées n'y figurent pas.{' '}
              {/* `?periode=toutes` : la liste s'ouvre sinon sur le mois courant et
                  cacherait l'arriéré. */}
              <Link to="/prospections?periode=toutes" className="text-(--info) hover:underline">
                Toutes les prospections
              </Link>
            </p>
          </Card>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <Card title="Pipeline" accent="var(--sec-accent)" padded={false} className="shrink-0">
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <KanbanColumn
                  icon={<UserPlus />}
                  title="Pré-prospection"
                  count={preProspectionsPage?.totalElements}
                  emptyMessage="Aucune pré-prospection."
                  error={preProspectionsErreur}
                  onVoirTout={() => setListe('pre-prospections')}
                >
                  {preProspectionsPage?.content.slice(0, LIGNES_COULOIR).map((p) => (
                    <KanbanItemRow onClick={() => setFiche({ id: p.id, pre: true })} key={p.id}>
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
                  error={aTraiterErreur}
                  onVoirTout={() => setListe('a-traiter')}
                  accent="var(--amber)"
                  accentBg="var(--amber-bg)"
                  countTone="accent"
                >
                  {aTraiterPage?.content.slice(0, LIGNES_COULOIR).map((p) => (
                    <KanbanItemRow onClick={() => setFiche({ id: p.id, pre: false })} key={p.id}>
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
                  error={prospectionsErreur}
                  onVoirTout={() => setListe('prospections')}
                >
                  {prospectionsPage?.content.slice(0, LIGNES_COULOIR).map((p) => (
                    <KanbanItemRow onClick={() => setFiche({ id: p.id, pre: false })} key={p.id}>
                      <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                      <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                        {p.etape || '—'}
                      </Badge>
                    </KanbanItemRow>
                  ))}
                </KanbanColumn>

                <KanbanColumn
                  icon={<UserCheck />}
                  title="Clients"
                  count={clientsPage?.totalElements}
                  emptyMessage="Aucun client."
                  error={clientsErreur}
                  viewAllTo="/clients"
                >
                  {clientsPage?.content.slice(0, LIGNES_COULOIR).map((c) => (
                    <KanbanItemRow to={`/clients/${c.id}`} key={c.id}>
                      <span className="min-w-0 truncate">{c.nomAffiche || '—'}</span>
                    </KanbanItemRow>
                  ))}
                </KanbanColumn>

                <KanbanColumn
                  icon={<Folder />}
                  title="Dossier de vente"
                  count={dossiersActifs}
                  emptyMessage="Aucun dossier actif."
                  error={dossiersErreur}
                  viewAllTo="/dossiers"
                  className="sm:col-span-2"
                >
                  {dossiersPage?.content.slice(0, LIGNES_COULOIR).map((d) => (
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

            <div className="flex shrink-0 flex-col gap-3 min-[1500px]:flex-row">
              <div className="min-w-0 min-[1500px]:flex-[13]">
                <SyntheseAnnuelle trancheId={trancheId} />
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

      {liste === 'relances-jour' && (
        <ListeRelancesDialog
          titre={`À rappeler aujourd'hui — ${portee === 'MOI' ? 'moi' : 'équipe'}`}
          etat={relancesJour}
          onClose={() => setListe(null)}
        />
      )}
      {liste === 'relances-retard' && (
        <ListeRelancesDialog
          titre={`Relances en retard — ${portee === 'MOI' ? 'moi' : 'équipe'}`}
          etat={relancesRetard}
          plusRecentesDAbord
          note="File bornée aux 30 derniers jours. Les relances désarmées n'y figurent pas."
          onClose={() => setListe(null)}
        />
      )}
      {liste === 'pre-prospections' && (
        <ListeProspectionsDialog
          titre="Pré-prospections ouvertes"
          pre
          filtres={filtresOuvertes}
          onClose={() => setListe(null)}
        />
      )}
      {liste === 'a-traiter' && (
        <ListeProspectionsDialog
          titre="Prospections à traiter"
          pre={false}
          filtres={filtresATraiter}
          onClose={() => setListe(null)}
        />
      )}
      {liste === 'prospections' && (
        <ListeProspectionsDialog
          titre="Prospections ouvertes"
          pre={false}
          filtres={filtresOuvertes}
          onClose={() => setListe(null)}
        />
      )}

      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </PageShell>
  );
}
