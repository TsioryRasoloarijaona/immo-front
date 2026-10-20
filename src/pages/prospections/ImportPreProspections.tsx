import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LienFiche from '../../components/LienFiche';
import { AlertTriangle, ArrowLeft, Check, FileText, RotateCcw, Upload, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import RefSelect from '../../components/RefSelect';
import { Badge, Card, Chip, StatCard } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  apercuImportPreProspections,
  getSupportsForOrigine,
  importerPreProspections,
  type ImportPreProspectionsParams,
  type StatutImportable,
} from '../../lib/api';
import { phraseRepartitionImport } from '../../lib/equipe';
import { formatDateTime, formatNumber, pluriel } from '../../lib/format';
import {
  referentielItems,
  useActionsCommerciales,
  useEtapesProspection,
  useOriginesProspection,
  useTranchesFiltre,
  useTypesContactProspection,
} from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';
import type { BadgeTone, LigneImportDto, RapportImportPreProspectionsDto, StatutLigneImport } from '../../types';

// Tons choisis pour leurs glyphes (`TONE_GLYPH`) : ✓ créée, ⚠ à vérifier, ✗ rejetée, rien pour « déjà là ».
const STATUTS: Record<StatutLigneImport, { libelle: string; tone: BadgeTone; aide: string }> = {
  NOUVELLE: { libelle: 'Nouvelle', tone: 'success', aide: 'Aucun contact identique connu : créée si cochée.' },
  DOUBLON: { libelle: 'Doublon', tone: 'amber', aide: 'Même contact qu\'une prospection existante, autre date : créée si cochée, et signalée.' },
  DEJA_IMPORTEE: { libelle: 'Déjà importée', tone: 'neutral', aide: 'Même contact et même date : le même lead réimporté, ignoré.' },
  ERREUR: { libelle: 'Erreur', tone: 'warning', aide: 'Ligne inexploitable, ignorée.' },
};
const ORDRE_STATUTS: StatutLigneImport[] = ['NOUVELLE', 'DOUBLON', 'DEJA_IMPORTEE', 'ERREUR'];

const STATUTS_IMPORTABLES: StatutImportable[] = ['NOUVELLE', 'DOUBLON'];
const TOUS_COCHES: Record<StatutImportable, boolean> = { NOUVELLE: true, DOUBLON: true };

function compteParStatut(rapport: RapportImportPreProspectionsDto, s: StatutLigneImport): number {
  const comptes: Record<StatutLigneImport, number> = {
    NOUVELLE: rapport.nouvelles,
    DOUBLON: rapport.doublons,
    DEJA_IMPORTEE: rapport.dejaImportees,
    ERREUR: rapport.erreurs,
  };
  return comptes[s];
}

function libelleDejaImportees(n: number): string {
  if (n <= 0) return '';
  const s = n > 1 ? 's' : '';
  return ` — ${n} déjà importée${s} ignorée${s}`;
}

type Etape = 'fichier' | 'apercu' | 'resultat';
type Filtre = StatutLigneImport | 'TOUTES';

// Vides, le serveur pose ses défauts.
type Reglages = Omit<ImportPreProspectionsParams, 'trancheId' | 'statuts'>;

/* Deux appels sans état : `POST /import/apercu` n'écrit rien, puis le même fichier
   repart vers `POST /import` avec la tranche (absente de l'export, un fichier =
   une tranche). Voir FEATURE-creation-pre-prospection.md §5. */
export default function ImportPreProspections() {
  const navigate = useNavigate();

  const [etape, setEtape] = useState<Etape>('fichier');
  const [fichier, setFichier] = useState<File | null>(null);
  const [rapport, setRapport] = useState<RapportImportPreProspectionsDto | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [reglages, setReglages] = useState<Reglages>({});
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>('TOUTES');
  // Le serveur filtre par statut, la classification ne bouge pas (FEATURE-import-selectif.md §2).
  const [coches, setCoches] = useState<Record<StatutImportable, boolean>>(TOUS_COCHES);

  // Chargée dès l'arrivée : l'aperçu pré-sélectionne une tranche dans cette liste.
  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({
    label: t.code && t.description ? `${t.code} — ${t.description}` : t.description || t.code || t.id,
    value: t.id,
  }));

  const etapes = useEtapesProspection();
  const origines = useOriginesProspection();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  const supports = useApi(
    () => (reglages.origineId ? getSupportsForOrigine(reglages.origineId) : Promise.resolve([])),
    [reglages.origineId],
  );

  const lignesFiltrees = useMemo(() => {
    const lignes = rapport?.lignes ?? [];
    return filtre === 'TOUTES' ? lignes : lignes.filter((l) => l.statut === filtre);
  }, [rapport, filtre]);

  function reset() {
    setEtape('fichier');
    setFichier(null);
    setRapport(null);
    setTrancheId(null);
    setErreur(null);
    setFiltre('TOUTES');
    setCoches(TOUS_COCHES);
  }

  async function analyser() {
    if (!fichier) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await apercuImportPreProspections(fichier);
      setRapport(r);
      setTrancheId(r.trancheSuggereeId ?? null);
      setFiltre('TOUTES');
      setCoches(TOUS_COCHES);
      setEtape('apercu');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'analyse du fichier.");
    } finally {
      setBusy(false);
    }
  }

  async function importer() {
    if (!fichier || !trancheId) return;
    setBusy(true);
    setErreur(null);
    try {
      // Jamais vide : le bouton est désactivé tant que N = 0.
      const statuts = STATUTS_IMPORTABLES.filter((s) => coches[s]);
      const r = await importerPreProspections(fichier, { trancheId, ...reglages, statuts });
      setRapport(r);
      setFiltre('TOUTES');
      setEtape('resultat');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'import.");
    } finally {
      setBusy(false);
    }
  }

  function compte(s: StatutImportable): number {
    if (!rapport) return 0;
    return s === 'NOUVELLE' ? rapport.nouvelles : rapport.doublons;
  }
  const aCreer = STATUTS_IMPORTABLES.reduce((n, s) => n + (coches[s] ? compte(s) : 0), 0);
  const creees = rapport?.creees ?? 0;
  const trancheSuggeree = rapport?.trancheSuggereeId
    ? trancheItems.find((t) => t.value === rapport.trancheSuggereeId)
    : undefined;

  return (
    <PageShell
      title="Importer des leads"
      crumbs={[{ label: 'Ventes' }, { label: 'Pré-prospections', to: '/pre-prospections' }, { label: 'Import' }]}
      icon={<UserPlus />}
      accent="var(--sec-preprospection)"
      accentBg="var(--sec-preprospection-bg)"
      actions={
        <Button type="button" size="sm" variant="outline" onClick={() => navigate('/pre-prospections')}>
          <ArrowLeft data-icon="inline-start" /> Pré-prospections
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {etape === 'fichier' && (
          <Card title="1. Fichier à importer">
            <div className="flex flex-col gap-3">
              <p className="text-body text-muted-foreground">
                L'export CSV des leads (Meta / Leads Center), tel quel. Colonnes reconnues par leur nom, dans
                n'importe quel ordre — seule « Nom » est indispensable. Séparateur « , » ou « ; », 5 000 lignes au plus.
                Rien n'est écrit à cette étape.
              </p>
              <label className="flex h-10 max-w-md cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-3 text-body text-muted-foreground hover:border-ring">
                <Upload className="size-3.5 shrink-0" />
                <span className="truncate">{fichier ? fichier.name : 'Choisir un fichier CSV…'}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { setFichier(e.target.files?.[0] ?? null); setErreur(null); }}
                />
              </label>
              {erreur && <p className="text-body text-destructive">{erreur}</p>}
              <div>
                <Button type="button" disabled={!fichier || busy} onClick={analyser}>
                  <FileText data-icon="inline-start" /> {busy ? 'Analyse…' : 'Analyser le fichier'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {rapport && etape !== 'fichier' && (
          <>
            {etape === 'resultat' && (
              <div className="flex items-start gap-2 rounded-lg border border-(--success-border) bg-(--success-bg) px-3.5 py-3 text-body text-(--success)">
                <Check aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-medium">{creees} pré-prospection{creees > 1 ? 's' : ''} créée{creees > 1 ? 's' : ''}</span>
                  {rapport.trancheCode ? ` sur la tranche ${rapport.trancheCode}` : ''}
                  {libelleDejaImportees(rapport.dejaImportees)}
                  {rapport.erreurs > 0 ? ` — ${rapport.erreurs} en erreur` : ''}.
                  <span className="block">{phraseRepartitionImport(rapport.repartition, rapport.nonAttribuees)}</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Lignes lues" value={formatNumber(rapport.totalLignes)} />
              <StatCard label="Nouvelles" value={formatNumber(rapport.nouvelles)} tone="success" icon={<Check />} />
              <StatCard label="Doublons" value={formatNumber(rapport.doublons)} sub="signalés" tone="amber" icon={<AlertTriangle />} />
              <StatCard label="Déjà importées" value={formatNumber(rapport.dejaImportees)} sub="ignorées" />
              <StatCard label="Erreurs" value={formatNumber(rapport.erreurs)} sub="ignorées" tone={rapport.erreurs > 0 ? 'warning' : 'neutral'} />
            </div>

            {rapport.avertissements.length > 0 && (
              <div className="rounded-lg border border-(--amber-border) bg-(--amber-bg) px-3.5 py-3">
                <ul className="flex flex-col gap-1 text-body text-(--amber)">
                  {rapport.avertissements.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {etape === 'apercu' && (
              <Card title="2. Tranche de rattachement">
                <div className="flex flex-col gap-3">
                  <p className="text-body text-muted-foreground">
                    L'export ne dit pas à quelle tranche les leads appartiennent : <span className="font-medium text-foreground">toutes</span> les
                    lignes du fichier seront rattachées à la tranche choisie. Un fichier qui en mêle plusieurs est à découper avant l'import.
                  </p>
                  {rapport.formulaires.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-label text-muted-foreground">Formulaires :</span>
                      {rapport.formulaires.map((f) => <Chip key={f}>{f}</Chip>)}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <FormField>
                      <FieldLabel htmlFor="imp-tranche">Tranche *</FieldLabel>
                      <RefSelect
                        id="imp-tranche"
                        value={trancheId}
                        onChange={setTrancheId}
                        items={trancheItems}
                        placeholder={tranches.loading ? 'Chargement…' : 'Choisir une tranche…'}
                      />
                      {trancheSuggeree && trancheId === trancheSuggeree.value && (
                        <p className="text-micro text-muted-foreground">
                          Proposée d'après le nom des formulaires (« {rapport.trancheSuggereeCode} »). Modifiable.
                        </p>
                      )}
                    </FormField>
                  </div>

                  <div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReglagesOuverts((v) => !v)}>
                      {reglagesOuverts ? 'Masquer les réglages' : 'Réglages avancés'}
                    </Button>
                  </div>
                  {reglagesOuverts && (
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Vides, le serveur pose 1 A TRAITER / FACEBOOK / WEB. */}
                      <FormField>
                        <FieldLabel htmlFor="imp-nature">Nature</FieldLabel>
                        <RefSelect id="imp-nature" value={reglages.etapeId ?? null} onChange={(v) => setReglages((r) => ({ ...r, etapeId: v ?? undefined }))} items={referentielItems(etapes.data)} placeholder="Défaut : 1 A TRAITER" />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="imp-origine">Source de contact</FieldLabel>
                        <RefSelect id="imp-origine" value={reglages.origineId ?? null} onChange={(v) => setReglages((r) => ({ ...r, origineId: v ?? undefined, origineSupportId: undefined }))} items={referentielItems(origines.data)} placeholder="Défaut : FACEBOOK" />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="imp-support">Support</FieldLabel>
                        <RefSelect id="imp-support" value={reglages.origineSupportId ?? null} onChange={(v) => setReglages((r) => ({ ...r, origineSupportId: v ?? undefined }))} items={referentielItems(supports.data ?? [])} placeholder={reglages.origineId ? 'Défaut : aucun' : "Choisir une source d'abord"} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="imp-type">Type</FieldLabel>
                        <RefSelect id="imp-type" value={reglages.typeContactId ?? null} onChange={(v) => setReglages((r) => ({ ...r, typeContactId: v ?? undefined }))} items={referentielItems(typesContact.data)} placeholder="Défaut : WEB" />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="imp-action">Action commerciale</FieldLabel>
                        <RefSelect id="imp-action" value={reglages.actionCommercialeId ?? null} onChange={(v) => setReglages((r) => ({ ...r, actionCommercialeId: v ?? undefined }))} items={referentielItems(actionsCommerciales.data)} placeholder="Défaut : aucune" />
                      </FormField>
                    </div>
                  )}

                  <fieldset className="flex flex-col gap-1.5">
                    <legend className="mb-1.5 text-label font-medium text-foreground">Lignes à importer</legend>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                      {STATUTS_IMPORTABLES.map((s) => {
                        const n = compte(s);
                        return (
                          <label
                            key={s}
                            title={STATUTS[s].aide}
                            className={`flex items-center gap-1.5 text-label ${n === 0 ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer text-foreground'}`}
                          >
                            <input
                              type="checkbox"
                              className="size-3.5"
                              checked={coches[s]}
                              disabled={n === 0 || busy}
                              onChange={(e) => setCoches((c) => ({ ...c, [s]: e.target.checked }))}
                            />
                            {STATUTS[s].libelle}s ({n})
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-micro text-muted-foreground">
                      Les lignes déjà importées et les erreurs ne sont jamais importées.
                    </p>
                  </fieldset>

                  {erreur && <p className="text-body text-destructive">{erreur}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={reset} disabled={busy}>
                      <ArrowLeft data-icon="inline-start" /> Changer de fichier
                    </Button>
                    <Button type="button" disabled={!trancheId || aCreer === 0 || busy} onClick={importer}>
                      <Upload data-icon="inline-start" />
                      {busy ? 'Import…' : `Importer ${pluriel(aCreer, 'ligne')}`}
                    </Button>
                    {aCreer === 0 && (
                      <span className="text-body text-muted-foreground">
                        {rapport.nouvelles + rapport.doublons === 0 ? 'Aucune ligne à créer dans ce fichier.' : 'Cocher au moins un type de ligne.'}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card
              title={etape === 'apercu' ? 'Aperçu ligne par ligne — rien n\'est encore écrit' : 'Résultat ligne par ligne'}
              action={
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button type="button" size="sm" variant={filtre === 'TOUTES' ? 'default' : 'outline'} onClick={() => setFiltre('TOUTES')}>
                    Toutes ({rapport.totalLignes})
                  </Button>
                  {ORDRE_STATUTS.map((s) => {
                    const n = compteParStatut(rapport, s);
                    return (
                      <Button key={s} type="button" size="sm" variant={filtre === s ? 'default' : 'outline'} title={STATUTS[s].aide} onClick={() => setFiltre(s)}>
                        {STATUTS[s].libelle}s ({n})
                      </Button>
                    );
                  })}
                </div>
              }
            >
              <TableauLignes lignes={lignesFiltrees} importe={rapport.importe} />
            </Card>

            {etape === 'resultat' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={() => navigate('/pre-prospections')}>
                  <UserPlus data-icon="inline-start" /> Voir les pré-prospections
                </Button>
                <Button type="button" variant="outline" onClick={reset}>
                  <RotateCcw data-icon="inline-start" /> Importer un autre fichier
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

function CodeLigne({ ligne }: Readonly<{ ligne: LigneImportDto }>) {
  if (ligne.preProspectionId) {
    return (
      <LienFiche cible={{ type: 'prospection', id: ligne.preProspectionId, pre: true }} className="font-medium underline-offset-2 hover:underline">
        {ligne.code || ligne.preProspectionId}
      </LienFiche>
    );
  }
  if (ligne.statut === 'NOUVELLE' || ligne.statut === 'DOUBLON') {
    return <span className="whitespace-nowrap text-muted-foreground">Non importée</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function LiensDoublons({ ids }: Readonly<{ ids: string[] }>) {
  if (ids.length === 0) return null;
  return (
    <span className="ml-1">
      {ids.map((id, i) => (
        <LienFiche key={id} cible={{ type: 'prospection', id, pre: false }} className="underline-offset-2 hover:underline">
          {i > 0 ? ', ' : ''}voir{ids.length > 1 ? ` ${i + 1}` : ''}
        </LienFiche>
      ))}
    </span>
  );
}

function TableauLignes({ lignes, importe }: Readonly<{ lignes: LigneImportDto[]; importe: boolean }>) {
  if (lignes.length === 0) {
    return <p className="text-body text-muted-foreground">Aucune ligne pour ce filtre.</p>;
  }
  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-1 bg-card">
          <TableRow>
            <TableHead className="w-12 text-right">Ligne</TableHead>
            <TableHead>Statut</TableHead>
            {importe && <TableHead>Code</TableHead>}
            <TableHead>Créé</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Formulaire</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l) => {
            const s = STATUTS[l.statut];
            return (
              <TableRow key={l.ligne}>
                <TableCell className="text-right tabular-nums text-muted-foreground">{l.ligne}</TableCell>
                <TableCell><Badge tone={s.tone}>{s.libelle}</Badge></TableCell>
                {importe && (
                  <TableCell>
                    <CodeLigne ligne={l} />
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(l.dateCreation)}</TableCell>
                <TableCell className="font-medium">{l.nom || '—'}</TableCell>
                <TableCell className="whitespace-nowrap">{l.telephone || '—'}</TableCell>
                <TableCell className="max-w-56 truncate" title={l.email ?? undefined}>{l.email || '—'}</TableCell>
                <TableCell className="max-w-56 truncate" title={l.formulaire ?? undefined}>{l.formulaire || '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {l.message || ''}
                  <LiensDoublons ids={l.doublonIds ?? []} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
