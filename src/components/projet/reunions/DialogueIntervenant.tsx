import { useState } from 'react';
import SearchableSelect, { type SearchableSelectOption } from '../../SearchableSelect';
import Champ from '../../dossier/echeancier/Champ';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import type { IntervenantDto, IntervenantSaisieDto } from '../../../types/reunions';

function nombre(v: string): number | null {
  return v === '' ? null : Number(v);
}

/** Ajout ou modification d'un intervenant (lot, fournisseur, effectif). */
export default function DialogueIntervenant({ intervenant, lots, fournisseurs, onAnnuler, onValider }: Readonly<{
  intervenant: IntervenantDto | null;
  lots: SearchableSelectOption[];
  fournisseurs: SearchableSelectOption[];
  onAnnuler: () => void;
  onValider: (corps: IntervenantSaisieDto) => Promise<boolean>;
}>) {
  const [s, setS] = useState({
    ordre: intervenant?.ordre == null ? '' : String(intervenant.ordre),
    effectif: intervenant?.effectif == null ? '' : String(intervenant.effectif),
    lotId: intervenant?.lotId ?? '',
    fournisseurId: intervenant?.fournisseurId ?? '',
    note: intervenant?.note ?? '',
  });
  const [enCours, setEnCours] = useState(false);
  const maj = (cle: keyof typeof s) => (v: string | null) => setS((x) => ({ ...x, [cle]: v ?? '' }));

  async function valider() {
    setEnCours(true);
    const ok = await onValider({
      ordre: nombre(s.ordre),
      effectif: nombre(s.effectif),
      lotId: s.lotId || null,
      fournisseurId: s.fournisseurId || null,
      note: s.note,
    });
    setEnCours(false);
    if (ok) onAnnuler();
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{intervenant ? "Modifier l'intervenant" : 'Nouvel intervenant'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Champ id="int-ordre" libelle="O.D.T.">
            <Input id="int-ordre" type="number" min={1} step={1} value={s.ordre} onChange={(e) => maj('ordre')(e.target.value)} />
          </Champ>
          <Champ id="int-effectif" libelle="Effectif">
            <Input id="int-effectif" type="number" min={0} step={1} value={s.effectif} onChange={(e) => maj('effectif')(e.target.value)} />
          </Champ>
          <Champ id="int-lot" libelle="Lot">
            <SearchableSelect id="int-lot" items={lots} value={s.lotId || null} placeholder="Choisir…" emptyMessage="Aucun lot"
              className="w-full min-w-0" onValueChange={maj('lotId')} />
          </Champ>
          <Champ id="int-fournisseur" libelle="Fournisseur">
            <SearchableSelect id="int-fournisseur" items={fournisseurs} value={s.fournisseurId || null} placeholder="Choisir…"
              emptyMessage="Aucun fournisseur" className="w-full min-w-0" onValueChange={maj('fournisseurId')} />
          </Champ>
          <div className="col-span-full">
            <Champ id="int-note" libelle="Note">
              <Textarea id="int-note" rows={2} maxLength={500} value={s.note} onChange={(e) => maj('note')(e.target.value)} />
            </Champ>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>Annuler</Button>
          <Button type="button" disabled={enCours} onClick={() => void valider()}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
