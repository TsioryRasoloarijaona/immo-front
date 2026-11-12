import { useState } from 'react';
import Modal from '../Modal';
import SelecteurCouleur from '../configuration/SelecteurCouleur';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { creerStatutAchat, getChampsObligatoiresStatutAchat, getImagesStatutAchat, getTypesDocumentsStatutAchat, getTypesStatutAchat, modifierStatutAchat, urlImageStatut } from '../../lib/apiAchatConfig';
import { oublierLecturesRecentes } from '../../lib/api';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { ChampStatutAchatDto, DocumentAJoindreAchatDto, StatutAchatConfigDto, StatutAchatEcritureDto } from '../../types/achatConfig';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

function Case({ libelle, coche, onChange }: Readonly<{ libelle: string; coche: boolean; onChange: (v: boolean) => void }>) {
  return (
    <label className="flex w-fit items-center gap-2 text-label text-foreground">
      <input type="checkbox" className="accent-(--brand)" checked={coche} onChange={(e) => onChange(e.target.checked)} />
      {libelle}
    </label>
  );
}

function ListeChamps({ champs, choisis, onChange }: Readonly<{ champs: ChampStatutAchatDto[]; choisis: string[]; onChange: (v: string[]) => void }>) {
  return (
    <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
      {champs.map((c) => (
        <Case key={c.nom} libelle={c.libelle} coche={choisis.includes(c.nom)}
          onChange={(v) => onChange(v ? [...choisis, c.nom] : choisis.filter((n) => n !== c.nom))} />
      ))}
    </div>
  );
}

function SelecteurImage({ valeur, onChange }: Readonly<{ valeur: UUID | null; onChange: (id: UUID | null) => void }>) {
  const { data, loading, error } = useApi(getImagesStatutAchat, [], 'achat-config-images');
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" size="sm" variant={valeur ? 'outline' : 'default'} onClick={() => onChange(null)}>Aucune</Button>
      {loading && !data && <span className="text-micro text-muted-foreground">Chargement…</span>}
      {error && <span className="text-micro text-destructive">{error}</span>}
      {!error && data?.map((i) => (
        <button key={i.id} type="button" title={i.code ?? undefined} aria-label={i.code ?? 'Image'} aria-pressed={valeur === i.id}
          onClick={() => onChange(i.id)}
          className={`rounded-md border p-0.5 ${valeur === i.id ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}>
          <img src={urlImageStatut(i.id)} alt="" className="size-6 object-contain" />
        </button>
      ))}
    </div>
  );
}

function DocumentsAJoindre({ lignes, onChange }: Readonly<{ lignes: DocumentAJoindreAchatDto[]; onChange: (v: DocumentAJoindreAchatDto[]) => void }>) {
  const { data: types } = useApi(getTypesDocumentsStatutAchat, [], 'achat-config-types-documents');
  const libres = (types ?? []).filter((t) => !lignes.some((l) => l.typeDocumentId === t.id));
  const maj = (i: number, p: Partial<DocumentAJoindreAchatDto>) => onChange(lignes.map((l, k) => (k === i ? { ...l, ...p } : l)));
  return (
    <div className="flex flex-col gap-2">
      {lignes.length === 0 && <p className="text-micro text-muted-foreground">Aucun document à joindre.</p>}
      {lignes.map((l, i) => (
        <div key={l.typeDocumentId} className="flex items-center gap-4 text-body">
          <span className="min-w-48 flex-1">{l.typeDocumentLibelle ?? types?.find((t) => t.id === l.typeDocumentId)?.description ?? l.typeDocumentId}</span>
          <Case libelle="Obligatoire" coche={l.obligatoire} onChange={(v) => maj(i, { obligatoire: v })} />
          <Case libelle="Avec titre" coche={l.avecTitre} onChange={(v) => maj(i, { avecTitre: v })} />
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(lignes.filter((_, k) => k !== i))}>Retirer</Button>
        </div>
      ))}
      <select aria-label="Ajouter un type de document" className={CLASSE_SELECT} value=""
        onChange={(e) => e.target.value && onChange([...lignes, { typeDocumentId: e.target.value, obligatoire: false, avecTitre: false }])}>
        <option value="">Ajouter un type de document…</option>
        {libres.map((t) => <option key={t.id} value={t.id}>{t.description ?? t.code}</option>)}
      </select>
    </div>
  );
}

/** Création (`statut` absent) ou modification d'un statut de pièce d'achat. */
export default function DialogueStatutAchat({ statut, ordreDefaut, onClose, onEnregistre }: Readonly<{
  statut: StatutAchatConfigDto | null;
  ordreDefaut: number;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const types = useApi(getTypesStatutAchat, [], 'achat-config-types-statut');
  const catalogue = useApi(getChampsObligatoiresStatutAchat, [], 'achat-config-champs-statut');
  const [ordre, setOrdre] = useState(String(statut?.ordre ?? ordreDefaut));
  const [code, setCode] = useState(statut?.code ?? '');
  const [description, setDescription] = useState(statut?.description ?? '');
  const [typeId, setTypeId] = useState<string>(statut?.typeId ?? '');
  const [duree, setDuree] = useState(String(statut?.dureeVieJours ?? 0));
  const [couleur, setCouleur] = useState(statut?.couleur ?? '');
  const [okPaiement, setOkPaiement] = useState(statut?.okPourPaiement ?? false);
  const [compta, setCompta] = useState(statut?.valideComptabilite ?? false);
  const [lectureSeule, setLectureSeule] = useState(statut?.lectureSeule ?? false);
  const [imageId, setImageId] = useState<UUID | null>(statut?.imageId ?? null);
  const [notes, setNotes] = useState(statut?.notes ?? '');
  const [champs, setChamps] = useState(statut?.champsObligatoires ?? []);
  const [champsFournisseur, setChampsFournisseur] = useState(statut?.champsObligatoiresFournisseur ?? []);
  const [documents, setDocuments] = useState(statut?.documentsAJoindre ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: StatutAchatEcritureDto = {
      ordre: Number(ordre), code: code.trim(), description: description.trim(), typeId,
      dureeVieJours: Number(duree), couleur: couleur.trim(), okPourPaiement: okPaiement, valideComptabilite: compta,
      lectureSeule, imageId, notes, champsObligatoires: champs, champsObligatoiresFournisseur: champsFournisseur,
      documentsAJoindre: documents,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      await (statut ? modifierStatutAchat(statut.id, corps) : creerStatutAchat(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      oublierLecturesRecentes();
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal title={statut ? `Statut ${statut.code ?? ''}` : 'Nouveau statut'} onClose={onClose} width={720}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="st-ordre">O.D.T.</FieldLabel>
            <Input id="st-ordre" type="number" min={0} value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="st-code">Code *</FieldLabel>
            <Input id="st-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="st-desc">Description *</FieldLabel>
            <Input id="st-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="st-type">Type *</FieldLabel>
            <select id="st-type" className={CLASSE_SELECT} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Choisir…</option>
              {types.data?.map((t) => <option key={t.id} value={t.id}>{t.description ?? t.code}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="st-duree">Durée de vie (jours)</FieldLabel>
            <Input id="st-duree" type="number" min={0} value={duree} onChange={(e) => setDuree(e.target.value)} />
            <p className="text-micro text-muted-foreground">0 = durée infinie</p>
          </Field>
          <Field>
            <FieldLabel htmlFor="st-couleur">Couleur</FieldLabel>
            <SelecteurCouleur id="st-couleur" valeur={couleur} onChange={setCouleur} desactive={false} />
          </Field>
          <div className="flex flex-col gap-1">
            <Case libelle="Validé(e) pour paiement" coche={okPaiement} onChange={setOkPaiement} />
            <Case libelle="Valider en comptabilité" coche={compta} onChange={setCompta} />
            <Case libelle="En lecture seule" coche={lectureSeule} onChange={setLectureSeule} />
          </div>
          <Field className="col-span-2">
            <FieldLabel>Image</FieldLabel>
            <SelecteurImage valeur={imageId} onChange={setImageId} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="st-notes">Notes</FieldLabel>
            <Input id="st-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <Tabs defaultValue="pieces">
          <TabsList>
            <TabsTrigger value="pieces">Champs obligatoires</TabsTrigger>
            <TabsTrigger value="fournisseur">Champs obligatoires Fournisseur</TabsTrigger>
            <TabsTrigger value="documents">Documents à joindre</TabsTrigger>
          </TabsList>
          <TabsContent value="pieces" className="pt-2">
            <ListeChamps champs={catalogue.data?.piece ?? []} choisis={champs} onChange={setChamps} />
          </TabsContent>
          <TabsContent value="fournisseur" className="pt-2">
            <ListeChamps champs={catalogue.data?.fournisseur ?? []} choisis={champsFournisseur} onChange={setChampsFournisseur} />
          </TabsContent>
          <TabsContent value="documents" className="pt-2">
            <DocumentsAJoindre lignes={documents} onChange={setDocuments} />
          </TabsContent>
        </Tabs>
        {(types.error ?? catalogue.error) && <p role="alert" className="text-body text-destructive">{types.error ?? catalogue.error}</p>}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi || !code.trim() || !description.trim() || !typeId}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
