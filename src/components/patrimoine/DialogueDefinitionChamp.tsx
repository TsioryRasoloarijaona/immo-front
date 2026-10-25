import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { creerDefinitionChamp, modifierDefinitionChamp } from '../../lib/apiChampsSpecifiques';
import { LIBELLES_TYPES, TYPE_LISTE } from '../../lib/champsSpecifiques';
import { useEcriture } from '../../lib/useEcriture';
import type { ChampSpecifiqueDto, DefinitionChampDto, PorteurChamps } from '../../types/champsSpecifiques';

const numero = (texte: string) => (texte.trim() === '' ? null : Number(texte));

/** Création ou remplacement complet d'une définition de champ spécifique (Administrateur). */
export default function DialogueDefinitionChamp({ porteur, champ, types, onClose, onFait }: Readonly<{
  porteur: PorteurChamps;
  /** Absent : création. */
  champ?: ChampSpecifiqueDto;
  types: string[];
  onClose: () => void;
  onFait: () => void;
}>) {
  const { occupe, executer } = useEcriture();
  const [categorie, setCategorie] = useState(champ?.categorie ?? '');
  const [ordreCategorie, setOrdreCategorie] = useState(String(champ?.ordreCategorie ?? ''));
  const [libelle, setLibelle] = useState(champ?.libelle ?? '');
  const [ordre, setOrdre] = useState(String(champ?.ordre ?? ''));
  const [typeDonnee, setTypeDonnee] = useState(champ?.typeDonnee ?? types.at(0) ?? 'String');
  const [valeurDefaut, setValeurDefaut] = useState(champ?.valeurDefaut ?? '');
  const [obligatoire, setObligatoire] = useState(champ?.obligatoire ?? false);
  const [choix, setChoix] = useState((champ?.choix ?? []).join('\n'));

  async function enregistrer() {
    const corps: DefinitionChampDto = {
      categorie: categorie.trim() || null,
      ordreCategorie: numero(ordreCategorie),
      libelle: libelle.trim(),
      ordre: numero(ordre),
      typeDonnee,
      valeurDefaut: valeurDefaut.trim() || null,
      obligatoire,
      choix: typeDonnee === TYPE_LISTE ? choix.split('\n').map((c) => c.trim()).filter(Boolean) : [],
    };
    const ok = await executer(
      () => (champ ? modifierDefinitionChamp(porteur, champ.champId, corps) : creerDefinitionChamp(porteur, corps)),
      champ ? 'Champ modifié.' : 'Champ créé.',
    );
    if (ok) {
      onFait();
      onClose();
    }
  }

  return (
    <Modal title={champ ? 'Modifier le champ' : 'Nouveau champ spécifique'} onClose={onClose} width={560}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="def-libelle">Libellé *</FieldLabel>
          <Input id="def-libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="def-type">Type de donnée *</FieldLabel>
          <select id="def-type" value={typeDonnee} onChange={(e) => setTypeDonnee(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-body">
            {types.map((t) => <option key={t} value={t}>{LIBELLES_TYPES[t] ?? t}</option>)}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="def-categorie">Catégorie</FieldLabel>
          <Input id="def-categorie" value={categorie} onChange={(e) => setCategorie(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="def-ordre-categorie">Ordre de la catégorie</FieldLabel>
          <Input id="def-ordre-categorie" type="number" value={ordreCategorie} onChange={(e) => setOrdreCategorie(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="def-ordre">Ordre du champ</FieldLabel>
          <Input id="def-ordre" type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="def-defaut">Valeur par défaut</FieldLabel>
          <Input id="def-defaut" value={valeurDefaut} onChange={(e) => setValeurDefaut(e.target.value)} />
        </Field>
        {typeDonnee === TYPE_LISTE && (
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="def-choix">Choix (un par ligne)</FieldLabel>
            <Textarea id="def-choix" rows={4} value={choix} onChange={(e) => setChoix(e.target.value)} />
          </Field>
        )}
        <label className="flex items-center gap-2 text-body sm:col-span-2">
          <input type="checkbox" checked={obligatoire} onChange={(e) => setObligatoire(e.target.checked)} />
          Saisie obligatoire
        </label>
        <p className="text-micro text-muted-foreground sm:col-span-2">
          Valeur par défaut : date aaaa-mm-jj, décimale avec un point, pourcentage en fraction (0.2), true / false.
        </p>
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={occupe || libelle.trim() === ''} onClick={() => void enregistrer()}>Enregistrer</Button>
      </DialogFooter>
    </Modal>
  );
}
