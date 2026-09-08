import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, TrendingUp, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import {
  createProspect,
  createProspection,
  getSupportsForOrigine,
  listProjetTranches,
  listProjets,
  listProspects,
  listTrancheArticles,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { personDisplayName } from '../../lib/domain';
import {
  referentielItems,
  useActionsCommerciales,
  useEtapesProspection,
  useOriginesProspection,
  useTierTypes,
  useTypesContactProspection,
  useVocations,
} from '../../lib/referentiels';
import TelephoneField, { INDICATIF_MAROC } from '../../components/TelephoneField';
import type { CreerProspectRequest, CreerProspectionRequest, ProspectListItemDto } from '../../types';

// Indicatifs pré-remplis, comme sur les autres formulaires de création : c'est
// leur absence qui produit les numéros que le canal WhatsApp rejette.
const EMPTY_NEW_PROSPECT: CreerProspectRequest = {
  indicatifTelephone: INDICATIF_MAROC,
  indicatifMobile: INDICATIF_MAROC,
};

/** "Prospect" half of the combined form — either pick an existing prospect
 * (search + click a row, same pattern as NewDossier.tsx's article picker)
 * or fill in the same minimal fields as NewProspect.tsx's quick-add form.
 * `onProspectReady` reports the currently usable id/creation-payload up to
 * the parent so it knows whether the "Créer" button can be enabled. */
function ProspectPicker({
  onSelectExisting,
  onNewFormChange,
  mode,
  onModeChange,
  selectedProspect,
}: {
  onSelectExisting: (p: ProspectListItemDto | null) => void;
  onNewFormChange: (form: CreerProspectRequest) => void;
  mode: 'existing' | 'new';
  onModeChange: (mode: 'existing' | 'new') => void;
  selectedProspect: ProspectListItemDto | null;
}) {
  const [search, setSearch] = useState('');
  const results = useApi(
    () => (mode === 'existing' && search.trim() ? listProspects({ search: search.trim() }, { page: 0, size: 20 }) : Promise.resolve(null)),
    [mode, search],
  );
  const [newForm, setNewForm] = useState<CreerProspectRequest>(EMPTY_NEW_PROSPECT);
  const tierTypes = useTierTypes();
  const tierTypeItems = referentielItems(tierTypes.data);
  const { commerciaux } = useAppData();
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  function setNew<K extends keyof CreerProspectRequest>(key: K, value: CreerProspectRequest[K]) {
    const next = { ...newForm, [key]: value };
    setNewForm(next);
    onNewFormChange(next);
  }

  return (
    <Card title="Prospect" accent="var(--sec-prospect)">
      <div className="mb-3 flex gap-2">
        <Button type="button" size="sm" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => onModeChange('existing')}>
          Prospect existant
        </Button>
        <Button type="button" size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => onModeChange('new')}>
          Nouveau prospect
        </Button>
      </div>

      {mode === 'existing' && (
        selectedProspect ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-label">
            <span className="font-medium text-foreground">{personDisplayName(selectedProspect)}</span>
            <span className="text-muted-foreground">{selectedProspect.mobile || selectedProspect.telephone || '—'}</span>
            <span className="text-muted-foreground">{selectedProspect.email || '—'}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Changer de prospect" onClick={() => onSelectExisting(null)}>
              <X className="text-destructive" />
            </Button>
          </div>
        ) : (
          <>
            <FormField>
              <FieldLabel htmlFor="pp-search">Rechercher un prospect</FieldLabel>
              <Input id="pp-search" placeholder="Nom, téléphone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </FormField>
            {results.loading && <LoadingState />}
            {!results.loading && search.trim() && (results.data?.content.length ?? 0) === 0 && (
              <EmptyState title="Aucun résultat" message="Essayez un autre terme, ou basculez sur « Nouveau prospect »." />
            )}
            {results.data && results.data.content.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-1 bg-card">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-9"><Search className="size-3.5 text-muted-foreground" /></TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.data.content.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => onSelectExisting(p)}>
                        <TableCell />
                        <TableCell className="font-medium text-foreground">{personDisplayName(p)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.mobile || p.telephone || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{p.email || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )
      )}

      {mode === 'new' && (
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="pp-type">Type</FieldLabel>
              <Select items={tierTypeItems} value={newForm.typeId ?? null} onValueChange={(v) => setNew('typeId', (v as string) || undefined)}>
                <SelectTrigger id="pp-type" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{tierTypeItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pp-commercial">Commercial</FieldLabel>
              <Select items={commercialItems} value={newForm.commercialId ?? null} onValueChange={(v) => setNew('commercialId', (v as string) || undefined)}>
                <SelectTrigger id="pp-commercial" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{commercialItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pp-prenom">Prénom {!newForm.raisonSociale?.trim() && '*'}</FieldLabel>
              <Input id="pp-prenom" value={newForm.prenom ?? ''} onChange={(e) => setNew('prenom', e.target.value || undefined)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pp-nom">Nom {!newForm.raisonSociale?.trim() && '*'}</FieldLabel>
              <Input id="pp-nom" value={newForm.nom ?? ''} onChange={(e) => setNew('nom', e.target.value || undefined)} />
            </FormField>
            <FormField className="sm:col-span-2">
              <FieldLabel htmlFor="pp-raisonSociale">Raison sociale (si personne morale)</FieldLabel>
              <Input id="pp-raisonSociale" value={newForm.raisonSociale ?? ''} onChange={(e) => setNew('raisonSociale', e.target.value || undefined)} />
            </FormField>
            <TelephoneField
              id="pp-telephone"
              label="Téléphone"
              numero={newForm.telephone ?? ''}
              indicatif={newForm.indicatifTelephone ?? null}
              onNumeroChange={(v) => setNew('telephone', v || undefined)}
              onIndicatifChange={(v) => setNew('indicatifTelephone', v ?? undefined)}
            />
            <TelephoneField
              id="pp-mobile"
              label="Mobile"
              numero={newForm.mobile ?? ''}
              indicatif={newForm.indicatifMobile ?? null}
              onNumeroChange={(v) => setNew('mobile', v || undefined)}
              onIndicatifChange={(v) => setNew('indicatifMobile', v ?? undefined)}
            />
            <FormField className="sm:col-span-2">
              <FieldLabel htmlFor="pp-email">Email</FieldLabel>
              <Input id="pp-email" type="email" value={newForm.email ?? ''} onChange={(e) => setNew('email', e.target.value || undefined)} />
            </FormField>
          </div>
        </FieldGroup>
      )}
    </Card>
  );
}

/** `POST /api/prospections` (from_front.md demande #9, livré) — combine les
 * deux moitiés du formulaire legacy Omran "Prospection :"/"Prospect :" en
 * une seule page : le prospect doit exister avant la prospection (contrainte
 * métier confirmée), donc soit on en choisit un existant, soit on en crée un
 * nouveau juste avant d'appeler cet endpoint, dans le même clic "Créer". */
export default function NewProspection() {
  const navigate = useNavigate();
  const [prospectMode, setProspectMode] = useState<'existing' | 'new'>('existing');
  const [selectedProspect, setSelectedProspect] = useState<ProspectListItemDto | null>(null);
  const [newProspectForm, setNewProspectForm] = useState<CreerProspectRequest>(EMPTY_NEW_PROSPECT);

  const { commerciaux } = useAppData();
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  const [projetId, setProjetId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const projets = useApi(() => listProjets({ page: 0, size: 200 }), []);
  const tranches = useApi(
    () => (projetId ? listProjetTranches(projetId, { page: 0, size: 200 }) : Promise.resolve(null)),
    [projetId],
  );
  const articles = useApi(
    () => (trancheId ? listTrancheArticles(trancheId, {}, { page: 0, size: 200 }) : Promise.resolve(null)),
    [trancheId],
  );
  const projetItems = (projets.data?.content ?? []).map((p) => ({ label: p.description || p.code || p.id, value: p.id }));
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const articleItems = (articles.data?.content ?? []).map((a) => ({ label: a.code || a.description || a.id, value: a.id }));

  const [origineId, setOrigineId] = useState<string | null>(null);
  const [origineSupportId, setOrigineSupportId] = useState<string | null>(null);
  const [vocationId, setVocationId] = useState<string | null>(null);
  const [typeContactId, setTypeContactId] = useState<string | null>(null);
  const [actionCommercialeId, setActionCommercialeId] = useState<string | null>(null);
  const [etapeId, setEtapeId] = useState<string | null>(null);
  const [prospectionCommercialId, setProspectionCommercialId] = useState<string | null>(null);
  const [ancienClient, setAncienClient] = useState(false);
  const [notes, setNotes] = useState('');

  const origines = useOriginesProspection();
  const supports = useApi(
    () => (origineId ? getSupportsForOrigine(origineId) : Promise.resolve([])),
    [origineId],
  );
  const vocations = useVocations();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  const etapes = useEtapesProspection();

  const origineItems = referentielItems(origines.data);
  const supportItems = referentielItems(supports.data ?? []);
  const vocationItems = referentielItems(vocations.data);
  const typeContactItems = referentielItems(typesContact.data);
  const actionCommercialeItems = referentielItems(actionsCommerciales.data);
  const etapeItems = referentielItems(etapes.data);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isMorale = !!newProspectForm.raisonSociale?.trim();
  const newProspectReady = (newProspectForm.prenom?.trim() && newProspectForm.nom?.trim()) || isMorale;
  const canCreate = prospectMode === 'existing' ? !!selectedProspect : !!newProspectReady;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const prospectId = prospectMode === 'existing' ? selectedProspect!.id : (await createProspect(newProspectForm)).id;
      const body: CreerProspectionRequest = {
        prospectId,
        commercialId: prospectionCommercialId || undefined,
        trancheId: trancheId || undefined,
        articleId: articleId || undefined,
        origineId: origineId || undefined,
        origineSupportId: origineSupportId || undefined,
        vocationId: vocationId || undefined,
        typeContactId: typeContactId || undefined,
        actionCommercialeId: actionCommercialeId || undefined,
        etapeId: etapeId || undefined,
        ancienClient: ancienClient || undefined,
        notes: notes.trim() || undefined,
      };
      const prospection = await createProspection(body);
      navigate(`/prospections/${prospection.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Nouvelle prospection"
      crumbs={[{ label: 'Ventes' }, { label: 'Prospections', to: '/prospections' }, { label: 'Nouvelle prospection' }]}
      icon={<TrendingUp />}
      accent="var(--sec-prospection)"
      accentBg="var(--sec-prospection-bg)"
    >
      <div className="flex max-w-220 flex-col gap-3">
        <ProspectPicker
          mode={prospectMode}
          onModeChange={(m) => { setProspectMode(m); setSelectedProspect(null); }}
          selectedProspect={selectedProspect}
          onSelectExisting={setSelectedProspect}
          onNewFormChange={setNewProspectForm}
        />

        <Card title="Prospection">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField>
              <FieldLabel htmlFor="pr-projet">Projet</FieldLabel>
              <Select items={projetItems} value={projetId} onValueChange={(v) => { setProjetId((v as string) || null); setTrancheId(null); setArticleId(null); }}>
                <SelectTrigger id="pr-projet" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{projetItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-tranche">Tranche</FieldLabel>
              <Select items={trancheItems} value={trancheId} onValueChange={(v) => { setTrancheId((v as string) || null); setArticleId(null); }} disabled={!projetId}>
                <SelectTrigger id="pr-tranche" className="w-full"><SelectValue placeholder={projetId ? 'Choisir…' : 'Choisir un projet d\'abord'} /></SelectTrigger>
                <SelectContent><SelectGroup>{trancheItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-article">Article (optionnel)</FieldLabel>
              <Select items={articleItems} value={articleId} onValueChange={(v) => setArticleId((v as string) || null)} disabled={!trancheId}>
                <SelectTrigger id="pr-article" className="w-full"><SelectValue placeholder={trancheId ? 'Choisir…' : 'Choisir une tranche d\'abord'} /></SelectTrigger>
                <SelectContent><SelectGroup>{articleItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-commercial">Commercial</FieldLabel>
              <Select items={commercialItems} value={prospectionCommercialId} onValueChange={(v) => setProspectionCommercialId((v as string) || null)}>
                <SelectTrigger id="pr-commercial" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{commercialItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-nature">Nature</FieldLabel>
              <Select items={etapeItems} value={etapeId} onValueChange={(v) => setEtapeId((v as string) || null)}>
                <SelectTrigger id="pr-nature" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{etapeItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-typeContact">Type</FieldLabel>
              <Select items={typeContactItems} value={typeContactId} onValueChange={(v) => setTypeContactId((v as string) || null)}>
                <SelectTrigger id="pr-typeContact" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{typeContactItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-actionCommerciale">Action commerciale</FieldLabel>
              <Select items={actionCommercialeItems} value={actionCommercialeId} onValueChange={(v) => setActionCommercialeId((v as string) || null)}>
                <SelectTrigger id="pr-actionCommerciale" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{actionCommercialeItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-origine">Source de contact</FieldLabel>
              <Select items={origineItems} value={origineId} onValueChange={(v) => { setOrigineId((v as string) || null); setOrigineSupportId(null); }}>
                <SelectTrigger id="pr-origine" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{origineItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-support">Support</FieldLabel>
              <Select items={supportItems} value={origineSupportId} onValueChange={(v) => setOrigineSupportId((v as string) || null)} disabled={!origineId}>
                <SelectTrigger id="pr-support" className="w-full"><SelectValue placeholder={origineId ? 'Choisir…' : 'Choisir une source d\'abord'} /></SelectTrigger>
                <SelectContent><SelectGroup>{supportItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-vocation">Vocation</FieldLabel>
              <Select items={vocationItems} value={vocationId} onValueChange={(v) => setVocationId((v as string) || null)}>
                <SelectTrigger id="pr-vocation" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{vocationItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
          </div>

          <label className="mt-3.5 flex items-center gap-1.5 text-label text-foreground">
            <input type="checkbox" className="size-3.5" checked={ancienClient} onChange={(e) => setAncienClient(e.target.checked)} />
            C'est un ancien client
          </label>

          <FormField className="mt-3.5">
            <FieldLabel htmlFor="pr-notes">Notes</FieldLabel>
            <Textarea id="pr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </Card>

        {submitError && <p className="text-body text-destructive">{submitError}</p>}

        <div className="flex items-center justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleCreate} disabled={!canCreate || submitting}>
            <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer la prospection'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
