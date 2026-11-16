import { useState } from 'react';
import Modal from '../Modal';
import SelecteurImageStatut from '../achat/SelecteurImageStatut';
import SelecteurCouleur from '../configuration/SelecteurCouleur';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { oublierLecturesRecentes } from '../../lib/api';
import { getCatalogueStatutLot, saveStatutLot } from '../../lib/apiProjetConfig';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { StatutLotDto, StatutLotEcritureDto } from '../../types/projetConfig';

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

/** Ajoute `valeur` si elle manque, la retire sinon. */
function basculer<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

/** Création (`statut` absent) ou modification d'un statut de lot du genre `genreId` (le genre ne change pas). */
export default function DialogueStatutLot({ statut, genreId, genreLibelle, ordreDefaut, onClose, onEnregistre }: Readonly<{
  statut: StatutLotDto | null;
  genreId: UUID;
  genreLibelle: string;
  ordreDefaut: number;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const catalogue = useApi(() => getCatalogueStatutLot(genreId), [genreId], 'projet-config-catalogue-statut-lot');
  const [ordre, setOrdre] = useState(String(statut?.ordre ?? ordreDefaut));
  const [code, setCode] = useState(statut?.code ?? '');
  const [description, setDescription] = useState(statut?.description ?? '');
  const [typeId, setTypeId] = useState<string>(statut?.typeId ?? '');
  const [duree, setDuree] = useState(String(statut?.duree ?? 0));
  const [couleur, setCouleur] = useState(statut?.couleur ?? '');
  const [imageId, setImageId] = useState<UUID | null>(statut?.imageId ?? null);
  const [notes, setNotes] = useState(statut?.notes ?? '');
  const [cases, setCases] = useState<number[]>(statut?.cases ?? []);
  const [champs, setChamps] = useState<UUID[]>(statut?.champsObligatoiresIds ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: StatutLotEcritureDto = {
      genreId, ordre: Number(ordre), code: code.trim(), description: description.trim(), typeId,
      dureeVieJours: Number(duree), couleur: couleur.trim(), imageId, notes, cases, champsObligatoires: champs,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      await saveStatutLot(corps, statut?.id);
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
    <Modal title={statut ? `Statut ${statut.code ?? ''}` : `Nouveau statut — ${genreLibelle}`} onClose={onClose} width={720}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="sl-ordre">O.D.T.</FieldLabel>
            <Input id="sl-ordre" type="number" min={0} value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sl-code">Code *</FieldLabel>
            <Input id="sl-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="sl-desc">Description *</FieldLabel>
            <Input id="sl-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sl-type">Type *</FieldLabel>
            <select id="sl-type" className={CLASSE_SELECT} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Choisir…</option>
              {catalogue.data?.types.map((t) => <option key={t.id} value={t.id}>{t.libelle ?? t.code}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="sl-duree">Durée de vie (jours)</FieldLabel>
            <Input id="sl-duree" type="number" min={0} value={duree} onChange={(e) => setDuree(e.target.value)} />
            <p className="text-micro text-muted-foreground">0 = durée infinie</p>
          </Field>
          <Field>
            <FieldLabel htmlFor="sl-couleur">Couleur</FieldLabel>
            <SelecteurCouleur id="sl-couleur" valeur={couleur} onChange={setCouleur} desactive={false} />
          </Field>
          <div className="flex flex-col gap-1">
            {catalogue.data?.cases.map((c) => (
              <Case key={c.numero} libelle={c.libelle} coche={cases.includes(c.numero)}
                onChange={() => setCases(basculer(cases, c.numero))} />
            ))}
          </div>
          <Field className="col-span-2">
            <FieldLabel>Image</FieldLabel>
            <SelecteurImageStatut valeur={imageId} onChange={setImageId} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="sl-notes">Notes</FieldLabel>
            <Input id="sl-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <Tabs defaultValue="champs">
          <TabsList>
            <TabsTrigger value="champs">Champs obligatoires</TabsTrigger>
          </TabsList>
          <TabsContent value="champs" className="pt-2">
            <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
              {catalogue.data?.champs.length === 0 && <p className="text-micro text-muted-foreground">Aucun champ disponible.</p>}
              {catalogue.data?.champs.map((c) => (
                <Case key={c.id} libelle={c.libelle ?? c.code ?? ''} coche={champs.includes(c.id)}
                  onChange={() => setChamps(basculer(champs, c.id))} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        {catalogue.error && <p role="alert" className="text-body text-destructive">{catalogue.error}</p>}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi || !code.trim() || !description.trim() || !typeId}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
