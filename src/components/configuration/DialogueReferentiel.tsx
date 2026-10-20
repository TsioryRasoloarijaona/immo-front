import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import ChampReferentiel from './ChampReferentiel';
import SousGrilleLignes from './SousGrilleLignes';
import { creerLigneReferentiel, modifierLigneReferentiel } from '../../lib/apiReferentielsAdmin';
import {
  corpsReferentiel, defDe, estProtegee, itemsDe, lignesDepuis, scalaires, type LigneAvecId, type LigneBrouillon,
} from '../../lib/referentielsAdmin';
import { brouillonDepuis, useSaisie, type Choix } from '../../lib/saisiePatrimoine';
import type { DescripteurReferentielDto, LigneReferentiel } from '../../types/referentielsAdmin';

/** Création (`ligne` absente) ou modification, générée depuis le descripteur ; l'erreur 400/409 du serveur s'affiche telle quelle. */
export default function DialogueReferentiel({ descripteur, ligne, choix, onClose, onSaved }: Readonly<{
  descripteur: DescripteurReferentielDto;
  ligne?: LigneAvecId;
  choix: Record<string, Choix>;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const champsSimples = scalaires(descripteur.champs);
  const defs = champsSimples.map(defDe);
  const [depart] = useState(() => brouillonDepuis(defs, ligne));
  const { brouillon, modifier, envoi, erreur, champErreur, envoyer } = useSaisie(defs, depart);
  const lignesEnfants = descripteur.champs.filter((c) => c.type === 'LIGNES');
  const [lignes, setLignes] = useState<Record<string, LigneBrouillon[]>>(() => Object.fromEntries(
    lignesEnfants.map((c) => [c.nom, lignesDepuis(c, (ligne?.[c.nom] as LigneReferentiel[] | undefined) ?? [])]),
  ));
  const protegee = ligne !== undefined && estProtegee(descripteur, ligne);

  function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps = corpsReferentiel(descripteur.champs, brouillon, ligne ? depart : undefined, lignes);
    void envoyer(
      () => (ligne
        ? modifierLigneReferentiel(descripteur.slug, ligne.id, corps)
        : creerLigneReferentiel(descripteur.slug, corps)),
      onSaved,
    );
  }

  return (
    <Modal title={`${ligne ? 'Modifier' : 'Nouvelle ligne'} — ${descripteur.libelle}`} onClose={onClose} width={720}>
      <form onSubmit={enregistrer}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {champsSimples.map((c) => (
            <ChampReferentiel key={c.nom} champ={c} id={`ref-${c.nom}`} valeur={brouillon[c.nom] ?? ''} items={itemsDe(c, choix)}
              desactive={protegee && c.nom === 'code'} onChange={(v) => modifier(c.nom, v)}
              erreur={champErreur === c.nom ? erreur : null} />
          ))}
          {lignesEnfants.map((c) => (
            <SousGrilleLignes key={c.nom} champ={c} lignes={lignes[c.nom] ?? []} choix={choix} desactive={false}
              onChange={(l) => setLignes((prev) => ({ ...prev, [c.nom]: l }))} />
          ))}
        </div>
        {protegee && (
          <p className="mt-3 text-micro text-muted-foreground">
            Code protégé : il sert de repère au CRM, il ne peut être ni modifié ni supprimé.
          </p>
        )}
        {erreur && champErreur === null && <p className="mt-3 text-body text-destructive">{erreur}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
