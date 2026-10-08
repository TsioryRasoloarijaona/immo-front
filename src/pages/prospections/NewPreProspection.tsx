import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import {
  creerPreProspection,
  getSupportsForOrigine,
  listProjetTranches,
  listProjets,
  listTrancheArticles,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import {
  referentielItems,
  useActionsCommerciales,
  useEtapesProspection,
  useOriginesProspection,
  useTypesContactProspection,
  useVocations,
} from '../../lib/referentiels';
import type { CreerPreProspectionRequest, PreProspectionCreeeDto } from '../../types';

/** Longueurs maximales du contrat `CreerPreProspectionRequest` — le backend
 * répond 400 au-delà ; autant l'empêcher à la saisie. */
const MAX_TEXTE = 255;
const MAX_NOTES = 1000;

/** Un `<Select>` de référentiel, tel que le rend `NewProspection` — répété
 * neuf fois ici, d'où le composant local. Tous optionnels : le contrat ne rend
 * que `nom` obligatoire, et le serveur pose la vocation `VENTE` lui-même. */
function ChampSelect({
  id,
  label,
  items,
  value,
  onChange,
  disabled,
  placeholder = 'Choisir…',
}: {
  id: string;
  label: string;
  items: { label: string; value: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(v) => onChange((v as string) || null)} disabled={disabled}>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormField>
  );
}

/* `POST /api/pre-prospections` (FEATURE-creation-pre-prospection.md) — la
 * saisie d'un lead brut, équivalent de l'écran « Pré-prospection » d'OMRAN.
 *
 * Même geste que `NouvelleProspectionDialog` : une boîte au-dessus de la
 * liste, ouverte par la route `/pre-prospections/nouveau`. Mais pas de
 * sélecteur de prospect ni de commercial : le contact vit en champs libres
 * (`TempDescription` / `TempTel` / `TempEMail`) et **aucune fiche prospect
 * n'est créée** — c'est l'objet de « Transformer en prospect » ensuite.
 *
 * Le téléphone est un seul champ texte, stocké tel quel : le contrat n'a pas
 * d'indicatif séparé ici, et c'est par ses 9 derniers chiffres que la hotline
 * le retrouve, quel que soit le format.
 *
 * Les doublons sont **signalés, jamais refusés** (OMRAN enregistre lui aussi
 * une ligne par soumission). Sans doublon, la création navigue vers la fiche,
 * comme pour une prospection. Avec, la boîte reste ouverte et les nomme : la
 * ligne est bien créée, mais l'opérateur doit le savoir avant de l'appeler. */
export default function NouvellePreProspectionDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

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
  const parLibelle = (a: { label: string }, b: { label: string }) =>
    a.label.localeCompare(b.label, 'fr', { numeric: true });
  const projetItems = (projets.data?.content ?? [])
    .map((p) => ({ label: p.description || p.code || p.id, value: p.id }))
    .sort(parLibelle);
  const trancheItems = (tranches.data?.content ?? [])
    .map((t) => ({ label: t.description || t.code || t.id, value: t.id }))
    .sort(parLibelle);
  const articleItems = (articles.data?.content ?? [])
    .map((a) => ({ label: a.code || a.description || a.id, value: a.id }))
    .sort(parLibelle);

  const [etapeId, setEtapeId] = useState<string | null>(null);
  const [typeContactId, setTypeContactId] = useState<string | null>(null);
  const [actionCommercialeId, setActionCommercialeId] = useState<string | null>(null);
  const [origineId, setOrigineId] = useState<string | null>(null);
  const [origineSupportId, setOrigineSupportId] = useState<string | null>(null);
  const [vocationId, setVocationId] = useState<string | null>(null);

  const etapes = useEtapesProspection();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  const origines = useOriginesProspection();
  const supports = useApi(
    () => (origineId ? getSupportsForOrigine(origineId) : Promise.resolve([])),
    [origineId],
  );
  const vocations = useVocations();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Posé quand la création a réussi **avec** des doublons : la boîte bascule
   * sur le panneau d'avertissement au lieu de naviguer. */
  const [resultat, setResultat] = useState<PreProspectionCreeeDto | null>(null);

  const canCreate = !!nom.trim();

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: CreerPreProspectionRequest = {
        nom: nom.trim(),
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        trancheId: trancheId || undefined,
        articleId: articleId || undefined,
        etapeId: etapeId || undefined,
        typeContactId: typeContactId || undefined,
        actionCommercialeId: actionCommercialeId || undefined,
        origineId: origineId || undefined,
        origineSupportId: origineSupportId || undefined,
        vocationId: vocationId || undefined,
      };
      const cree = await creerPreProspection(body);
      if (cree.doublons.length === 0) {
        navigate(`/pre-prospections/${cree.preProspection.id}`);
        return;
      }
      setResultat(cree);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  if (resultat) {
    const { preProspection, doublons } = resultat;
    return (
      <Modal title="Pré-prospection créée" onClose={onClose} width={560}>
        <div className="flex flex-col gap-3">
          <p className="text-body text-foreground">
            <Check aria-hidden className="mr-1 inline size-3.5 text-(--success)" />
            La pré-prospection <span className="font-medium">{preProspection.code ?? ''}</span> a été enregistrée.
          </p>
          {/* Amber, pas rouge : rien n'a échoué. C'est une mise en garde avant
              l'appel — le contact a déjà été enregistré, peut-être déjà traité. */}
          <div className="rounded-lg border border-(--amber-border) bg-(--amber-bg) px-3.5 py-3">
            <p className="flex items-start gap-2 text-body font-medium text-(--amber)">
              <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {doublons.length === 1
                ? 'Ce contact existe déjà dans une autre prospection.'
                : `Ce contact existe déjà dans ${doublons.length} autres prospections.`}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-body text-foreground">
              {doublons.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <Link to={`/prospections/${d.id}`} className="font-medium underline-offset-2 hover:underline">
                    {d.code || d.id}
                  </Link>
                  <span className="text-muted-foreground">{formatDateTime(d.dateCreation)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" onClick={() => navigate(`/pre-prospections/${preProspection.id}`)}>
            Ouvrir la fiche
          </Button>
        </DialogFooter>
      </Modal>
    );
  }

  return (
    /* 920 : la même largeur que la nouvelle prospection, pour la même grille
       de trois colonnes. `Modal` borne à 88vh et fait défiler au-delà. */
    <Modal title="Nouvelle pré-prospection" onClose={onClose} width={920}>
      <div className="flex flex-col gap-3">
        <Card title="Contact">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField>
              <FieldLabel htmlFor="ppr-nom">Nom *</FieldLabel>
              <Input
                id="ppr-nom"
                value={nom}
                maxLength={MAX_TEXTE}
                autoFocus
                onChange={(e) => setNom(e.target.value)}
              />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="ppr-telephone">Téléphone</FieldLabel>
              <Input
                id="ppr-telephone"
                inputMode="tel"
                value={telephone}
                maxLength={MAX_TEXTE}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="ppr-email">Email</FieldLabel>
              <Input
                id="ppr-email"
                type="email"
                value={email}
                maxLength={MAX_TEXTE}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
          </div>
        </Card>

        <Card title="Prospection">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <ChampSelect
              id="ppr-projet"
              label="Projet"
              items={projetItems}
              value={projetId}
              onChange={(v) => { setProjetId(v); setTrancheId(null); setArticleId(null); }}
            />
            <ChampSelect
              id="ppr-tranche"
              label="Tranche"
              items={trancheItems}
              value={trancheId}
              onChange={(v) => { setTrancheId(v); setArticleId(null); }}
              disabled={!projetId}
              placeholder={projetId ? 'Choisir…' : "Choisir un projet d'abord"}
            />
            <ChampSelect
              id="ppr-article"
              label="Article"
              items={articleItems}
              value={articleId}
              onChange={setArticleId}
              disabled={!trancheId}
              placeholder={trancheId ? 'Choisir…' : "Choisir une tranche d'abord"}
            />
            <ChampSelect id="ppr-nature" label="Nature" items={referentielItems(etapes.data)} value={etapeId} onChange={setEtapeId} />
            <ChampSelect id="ppr-type" label="Type" items={referentielItems(typesContact.data)} value={typeContactId} onChange={setTypeContactId} />
            <ChampSelect
              id="ppr-action"
              label="Action commerciale"
              items={referentielItems(actionsCommerciales.data)}
              value={actionCommercialeId}
              onChange={setActionCommercialeId}
            />
            <ChampSelect
              id="ppr-origine"
              label="Source de contact"
              items={referentielItems(origines.data)}
              value={origineId}
              onChange={(v) => { setOrigineId(v); setOrigineSupportId(null); }}
            />
            <ChampSelect
              id="ppr-support"
              label="Support"
              items={referentielItems(supports.data ?? [])}
              value={origineSupportId}
              onChange={setOrigineSupportId}
              disabled={!origineId}
              placeholder={origineId ? 'Choisir…' : "Choisir une source d'abord"}
            />
            <ChampSelect
              id="ppr-vocation"
              label="Vocation"
              items={referentielItems(vocations.data)}
              value={vocationId}
              onChange={setVocationId}
              placeholder="Vente (défaut)"
            />
          </div>

          <FormField className="mt-3.5">
            <FieldLabel htmlFor="ppr-notes">Notes</FieldLabel>
            <Textarea id="ppr-notes" value={notes} maxLength={MAX_NOTES} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </Card>

        {submitError && <p className="text-body text-destructive">{submitError}</p>}
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="button" onClick={handleCreate} disabled={!canCreate || submitting}>
          <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer la pré-prospection'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
