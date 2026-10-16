import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import type { CatalogueChampsDto, ChampModeleDto } from '../../types/modeles';
import type { PorteeCondition } from '../../lib/editeurModele/commandes';

const PORTEES: { valeur: PorteeCondition; libelle: string; aide: string }[] = [
  { valeur: 'paragraphe', libelle: 'Le paragraphe', aide: 'Le paragraphe (ou la puce) où se trouve le curseur.' },
  { valeur: 'passage', libelle: 'Le passage sélectionné', aide: "Seulement le texte sélectionné, à l'intérieur d'une phrase." },
  { valeur: 'bloc', libelle: 'Un bloc de paragraphes', aide: 'Tous les paragraphes et titres sélectionnés, ensemble.' },
];

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

/** Condition : champ (+ oui/non pour un booléen) et portée. Champs de liste proposés seulement dans leur ligne ↻. */
export function DialogueCondition({
  catalogue,
  listeActive,
  selectionVide,
  onAppliquer,
  onClose,
}: Readonly<{
  catalogue: CatalogueChampsDto;
  listeActive: string | null;
  selectionVide: boolean;
  onAppliquer: (si: string, valeur: string | null, portee: PorteeCondition) => void;
  onClose: () => void;
}>) {
  const champs: ChampModeleDto[] = [
    ...catalogue.groupes.flatMap((g) => g.champs),
    ...catalogue.listes.filter((l) => l.cle === listeActive).flatMap((l) => l.champs),
  ];
  const [cle, setCle] = useState(champs[0]?.cle ?? '');
  const [valeur, setValeur] = useState<'true' | 'false'>('true');
  const [portee, setPortee] = useState<PorteeCondition>(selectionVide ? 'paragraphe' : 'passage');
  const champ = champs.find((c) => c.cle === cle);
  const booleen = champ?.type === 'BOOLEEN';

  return (
    <Modal title="Condition d'affichage" onClose={onClose} width={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (cle) onAppliquer(cle, booleen ? valeur : null, portee);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="cond-champ">Afficher seulement si</FieldLabel>
            <select id="cond-champ" className={CLASSE_SELECT} value={cle} onChange={(e) => setCle(e.target.value)}>
              {champs.map((c) => (
                <option key={c.cle} value={c.cle}>{c.libelle}</option>
              ))}
            </select>
            {!booleen && <p className="text-micro text-muted-foreground">…est renseigné (non vide) pour la fiche.</p>}
          </Field>
          {booleen && (
            <Field>
              <FieldLabel htmlFor="cond-valeur">Vaut</FieldLabel>
              <select id="cond-valeur" className={CLASSE_SELECT} value={valeur} onChange={(e) => setValeur(e.target.value as 'true' | 'false')}>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </Field>
          )}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label font-medium text-foreground">S'applique à</legend>
            {PORTEES.map((p) => (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control -- le libellé est dans des span imbriqués
              <label key={p.valeur} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/40 has-checked:border-primary/40 has-checked:bg-primary/5">
                <input
                  type="radio"
                  name="cond-portee"
                  className="mt-0.5 accent-primary"
                  checked={portee === p.valeur}
                  disabled={p.valeur === 'passage' && selectionVide}
                  onChange={() => setPortee(p.valeur)}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium text-foreground">{p.libelle}</span>
                  <span className="text-micro text-muted-foreground">{p.aide}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={!cle}>Appliquer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

/** Répétition : la ligne de tableau, la puce, le paragraphe ou le passage sélectionné est dupliqué par élément. */
export function DialogueRepetition({
  catalogue,
  onAppliquer,
  onClose,
}: Readonly<{
  catalogue: CatalogueChampsDto;
  onAppliquer: (liste: string) => void;
  onClose: () => void;
}>) {
  const [liste, setListe] = useState(catalogue.listes[0]?.cle ?? '');
  return (
    <Modal title="Répéter pour chaque élément" onClose={onClose} width={440}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (liste) onAppliquer(liste);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rep-liste">Liste</FieldLabel>
            <select id="rep-liste" className={CLASSE_SELECT} value={liste} onChange={(e) => setListe(e.target.value)}>
              {catalogue.listes.map((l) => (
                <option key={l.cle} value={l.cle}>{l.libelle}</option>
              ))}
            </select>
            <p className="text-micro text-muted-foreground">
              Dans un tableau : la ligne courante. Sinon : le passage sélectionné, ou la puce / le paragraphe du curseur.
              Liste vide pour une fiche = élément retiré.
            </p>
          </Field>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={!liste}>Appliquer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
