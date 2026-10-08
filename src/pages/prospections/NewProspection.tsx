import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, X } from 'lucide-react';
import Modal from '../../components/Modal';
import { Card, EmptyState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import DoublonsProspectPanel from '../../components/DoublonsProspectPanel';
import ProspectionExistanteNotice from '../../components/ProspectionExistanteNotice';
import {
  createProspect,
  createProspection,
  doublonsDepuisErreur,
  getSupportsForOrigine,
  listProjetTranches,
  listProjets,
  listProspects,
  listTrancheArticles,
  prospectionExistanteDepuisErreur,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { usePreview } from '../../lib/previewContext';
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
import type {
  CreerProspectRequest,
  CreerProspectionRequest,
  ProspectDoublonDto,
  ProspectListItemDto,
  ProspectionDetailDto,
  ProspectionExistanteDto,
} from '../../types';

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
  verrouille = false,
}: {
  onSelectExisting: (p: ProspectListItemDto | null) => void;
  onNewFormChange: (form: CreerProspectRequest) => void;
  mode: 'existing' | 'new';
  onModeChange: (mode: 'existing' | 'new') => void;
  selectedProspect: ProspectListItemDto | null;
  /** Prospect imposé par l'appelant : ni bascule, ni recherche, ni retrait. */
  verrouille?: boolean;
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
      {!verrouille && (
        <div className="mb-3 flex gap-2">
          <Button type="button" size="sm" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => onModeChange('existing')}>
            Prospect existant
          </Button>
          <Button type="button" size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => onModeChange('new')}>
            Nouveau prospect
          </Button>
        </div>
      )}

      {mode === 'existing' && (
        selectedProspect ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/40 px-3 py-2 text-label">
            <span className="font-medium text-foreground">{personDisplayName(selectedProspect)}</span>
            <span className="text-muted-foreground">{selectedProspect.mobile || selectedProspect.telephone || '—'}</span>
            <span className="text-muted-foreground">{selectedProspect.email || '—'}</span>
            {!verrouille && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Changer de prospect" onClick={() => onSelectExisting(null)}>
                <X className="text-destructive" />
              </Button>
            )}
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
/* La saisie d'une nouvelle prospection, en boîte plutôt qu'en page pleine.
 *
 * Ce n'était pas une page : une page est une destination, alors que ceci est
 * une **interruption** du travail en cours — on regarde sa liste, on crée, on
 * revient à sa liste. La page pleine faisait perdre ce contexte pour rien, et
 * c'est précisément ce qu'une modale existe pour éviter.
 *
 * La route `/prospections/nouveau` est conservée et ouvre désormais cette boîte
 * **au-dessus de la liste** : l'URL reste partageable, le bouton Retour ferme,
 * et la liste reste visible derrière le voile — ce qui est justement le sens du
 * geste. Le bouton de la liste n'a pas changé, il navigue toujours.
 *
 * Depuis la liste, la création réussie navigue vers la fiche créée. Depuis une
 * fiche prospect (`prospectInitial`), rien ne navigue : `onCree` reçoit la
 * prospection et l'appelant décide (voir FEATURE-prospection-depuis-prospect.md). */
export default function NouvelleProspectionDialog({
  onClose,
  prospectInitial,
  onCree,
}: {
  onClose: () => void;
  /** Prospect pré-sélectionné et verrouillé (mode « existant » forcé). */
  prospectInitial?: ProspectListItemDto;
  /** Remplace la navigation après succès ; l'appelant ferme la boîte. */
  onCree?: (prospection: ProspectionDetailDto) => void;
}) {
  const navigate = useNavigate();
  const { ouvrirFicheProspection } = usePreview();
  const [prospectMode, setProspectMode] = useState<'existing' | 'new'>('existing');
  const [selectedProspect, setSelectedProspect] = useState<ProspectListItemDto | null>(prospectInitial ?? null);
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
  // 409 `doublons` de la création du prospect (mode « Nouveau prospect ») :
  // des fiches au même nom, téléphone ou email existent. Une question, pas
  // une erreur — voir `DoublonsProspectPanel`.
  const [doublons, setDoublons] = useState<ProspectDoublonDto[] | null>(null);
  // 409 `prospectionExistante` de la création de la prospection : ce prospect
  // a déjà une prospection ouverte sur ce projet. Une redirection, pas une
  // erreur — voir `ProspectionExistanteNotice`.
  const [existante, setExistante] = useState<ProspectionExistanteDto | null>(null);

  const isMorale = !!newProspectForm.raisonSociale?.trim();
  const newProspectReady = (newProspectForm.prenom?.trim() && newProspectForm.nom?.trim()) || isMorale;
  const prospectReady = prospectMode === 'existing' ? !!selectedProspect : !!newProspectReady;
  // Champs obligatoires du POST /api/prospections (spec du 21/09, alignés sur
  // l'écran légataire) : tranche, nature, type, source de contact et notes non
  // vides — le backend renvoie 400 sans eux, autant griser le bouton avant.
  const champsObligatoiresOk = !!trancheId && !!etapeId && !!typeContactId && !!origineId && !!notes.trim();
  const canCreate = prospectReady && champsObligatoiresOk;

  /** Choisit une fiche existante à la place du nouveau prospect saisi — la
   * réponse « c'est cette personne » à la liste de doublons. La bascule en
   * mode « existant » rend la sélection visible dans le sélecteur, comme si
   * l'utilisateur l'avait cherchée lui-même. */
  function choisirDoublon(d: ProspectDoublonDto) {
    setDoublons(null);
    setSubmitError(null);
    setProspectMode('existing');
    setSelectedProspect({
      id: d.id,
      code: d.code ?? undefined,
      prenom: d.prenom ?? undefined,
      nom: d.nomFamille ?? undefined,
      raisonSociale: d.raisonSociale ?? undefined,
      telephone: d.telephone ?? undefined,
      mobile: d.mobile ?? undefined,
      email: d.email ?? undefined,
      ville: d.ville ?? undefined,
      type: d.type ?? undefined,
    });
  }

  async function handleCreate(ignorerDoublons = false) {
    if (!canCreate || !trancheId || !etapeId || !typeContactId || !origineId) return;
    setSubmitting(true);
    setSubmitError(null);
    setExistante(null);
    let prospectId: string;
    if (prospectMode === 'existing') {
      prospectId = selectedProspect!.id;
    } else {
      try {
        const cree = await createProspect({ ...newProspectForm, ignorerDoublons: ignorerDoublons || undefined });
        prospectId = cree.id;
        // La fiche existe désormais : si la prospection échoue juste après,
        // un second clic ne doit pas la recréer (et retomber sur le 409
        // doublon qu'elle produirait contre elle-même). On bascule donc en
        // mode « existant » sur la fiche créée.
        setDoublons(null);
        choisirDoublon({
          id: cree.id,
          code: cree.code,
          prenom: cree.prenom,
          nomFamille: cree.nom,
          raisonSociale: cree.raisonSociale,
          telephone: cree.telephone,
          mobile: cree.mobile,
          email: cree.email,
          ville: cree.ville,
          criteres: [],
        });
      } catch (err) {
        const trouves = doublonsDepuisErreur(err);
        if (trouves && trouves.length > 0) setDoublons(trouves);
        else {
          setDoublons(null);
          setSubmitError(err instanceof Error ? err.message : 'Échec de la création du prospect.');
        }
        setSubmitting(false);
        return;
      }
    }
    try {
      const body: CreerProspectionRequest = {
        prospectId,
        commercialId: prospectionCommercialId || undefined,
        trancheId,
        articleId: articleId || undefined,
        origineId,
        origineSupportId: origineSupportId || undefined,
        vocationId: vocationId || undefined,
        typeContactId,
        actionCommercialeId: actionCommercialeId || undefined,
        etapeId,
        ancienClient: ancienClient || undefined,
        notes: notes.trim(),
      };
      const prospection = await createProspection(body);
      if (onCree) onCree(prospection);
      else navigate(`/prospections/${prospection.id}`);
    } catch (err) {
      setExistante(prospectionExistanteDepuisErreur(err));
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* 920 : le formulaire tient une grille de trois colonnes et le tableau de
       résultats du sélecteur de prospect. Plus étroit, la grille retombe à deux
       colonnes et la boîte dépasse la hauteur d'écran. `Modal` borne déjà à
       88vh et fait défiler au-delà. */
    <Modal title="Nouvelle prospection" onClose={onClose} width={920}>
      <div className="flex flex-col gap-3">
        <ProspectPicker
          mode={prospectMode}
          onModeChange={(m) => { setProspectMode(m); setSelectedProspect(null); }}
          selectedProspect={selectedProspect}
          onSelectExisting={setSelectedProspect}
          onNewFormChange={setNewProspectForm}
          verrouille={!!prospectInitial}
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
              <FieldLabel htmlFor="pr-tranche">Tranche *</FieldLabel>
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
              <FieldLabel htmlFor="pr-nature">Nature *</FieldLabel>
              <Select items={etapeItems} value={etapeId} onValueChange={(v) => setEtapeId((v as string) || null)}>
                <SelectTrigger id="pr-nature" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent><SelectGroup>{etapeItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="pr-typeContact">Type *</FieldLabel>
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
              <FieldLabel htmlFor="pr-origine">Source de contact *</FieldLabel>
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
            <FieldLabel htmlFor="pr-notes">Notes *</FieldLabel>
            <Textarea id="pr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </Card>

        {doublons && doublons.length > 0 && prospectMode === 'new' && (
          <DoublonsProspectPanel
            doublons={doublons}
            libelleChoisir="Choisir"
            busy={submitting}
            onChoisir={choisirDoublon}
            onNouveauContact={() => void handleCreate(true)}
          />
        )}

        {existante ? (
          <ProspectionExistanteNotice
            existante={existante}
            message={submitError}
            onOuvrir={onClose}
            ouvrirEnDialogue={prospectInitial ? (id) => { onClose(); ouvrirFicheProspection(id, false); } : undefined}
          />
        ) : (
          submitError && <p className="text-body text-destructive">{submitError}</p>
        )}
      </div>

      {/* La sortie explicite, que la page pleine n'avait pas : elle comptait
          sur le fil d'Ariane. Une boîte se ferme aussi par Échap et par le
          voile, mais un bouton reste ce qu'on cherche des yeux. */}
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        {/* Pas `onClick={handleCreate}` : l'événement de clic passerait pour
            `ignorerDoublons` et court-circuiterait le contrôle de doublon. */}
        <Button type="button" onClick={() => { setDoublons(null); void handleCreate(false); }} disabled={!canCreate || submitting}>
          <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer la prospection'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
