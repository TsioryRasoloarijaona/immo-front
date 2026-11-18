import { useState } from 'react';
import SearchableSelect, { type SearchableSelectOption } from '../../SearchableSelect';
import Champ from '../../dossier/echeancier/Champ';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import type { DecisionDto, DecisionSaisieDto, ObservationDto } from '../../../types/reunions';

/** Ajout ou modification d'une décision ; `decision` partielle = pré-remplissage (lot + fournisseur d'un intervenant). */
export default function DialogueDecision({ decision, statuts, lots, fournisseurs, onAnnuler, onValider }: Readonly<{
  decision: Partial<DecisionDto>;
  statuts: ObservationDto[];
  lots: SearchableSelectOption[];
  fournisseurs: SearchableSelectOption[];
  onAnnuler: () => void;
  onValider: (corps: DecisionSaisieDto) => Promise<boolean>;
}>) {
  const [s, setS] = useState({
    ordre: decision.ordre == null ? '' : String(decision.ordre),
    lotId: decision.lotId ?? '',
    fournisseurId: decision.fournisseurId ?? '',
    description: decision.description ?? '',
    observationId: decision.observation?.id ?? '',
    objectif: (decision.objectif ?? '').slice(0, 10),
    note: decision.note ?? '',
    nousMemes: decision.nousMemes ?? false,
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (cle: keyof typeof s) => (v: string | boolean | null) => setS((x) => ({ ...x, [cle]: v ?? '' }));
  const itemsStatuts = statuts.map((o) => ({ value: o.id, label: o.libelle ?? '—' }));

  async function valider() {
    if (!s.description.trim() || !s.observationId) {
      setErreur("La description et l'observation sont obligatoires.");
      return;
    }
    setEnCours(true);
    const ok = await onValider({
      ordre: s.ordre === '' ? null : Number(s.ordre),
      lotId: s.lotId || null,
      fournisseurId: s.fournisseurId || null,
      description: s.description.trim(),
      observationId: s.observationId,
      objectif: s.objectif || null,
      note: s.note,
      nousMemes: s.nousMemes,
    });
    setEnCours(false);
    if (ok) onAnnuler();
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{decision.id ? 'Modifier la décision' : 'Nouvelle décision'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Champ id="dec-ordre" libelle="O.D.T.">
            <Input id="dec-ordre" type="number" min={1} step={1} value={s.ordre} onChange={(e) => maj('ordre')(e.target.value)} />
          </Champ>
          <label className="flex items-center gap-2 self-end text-body">
            <input type="checkbox" checked={s.nousMemes} onChange={(e) => maj('nousMemes')(e.target.checked)} />
            Nous mêmes
          </label>
          <Champ id="dec-lot" libelle="Lot">
            <SearchableSelect id="dec-lot" items={lots} value={s.lotId || null} placeholder="Choisir…" emptyMessage="Aucun lot"
              className="w-full min-w-0" onValueChange={maj('lotId')} />
          </Champ>
          <Champ id="dec-fournisseur" libelle="Fournisseur">
            <SearchableSelect id="dec-fournisseur" items={fournisseurs} value={s.fournisseurId || null} placeholder="Choisir…"
              emptyMessage="Aucun fournisseur" className="w-full min-w-0" onValueChange={maj('fournisseurId')} />
          </Champ>
          <div className="col-span-full">
            <Champ id="dec-description" libelle="Description *">
              <Textarea id="dec-description" rows={3} maxLength={500} value={s.description} onChange={(e) => maj('description')(e.target.value)} />
            </Champ>
          </div>
          <Champ id="dec-observation" libelle="Observation *">
            <SearchableSelect id="dec-observation" items={itemsStatuts} value={s.observationId || null} placeholder="Choisir…"
              emptyMessage="Aucun statut" className="w-full min-w-0" onValueChange={maj('observationId')} />
          </Champ>
          <Champ id="dec-objectif" libelle="Objectif">
            <Input id="dec-objectif" type="date" value={s.objectif} onChange={(e) => maj('objectif')(e.target.value)} />
          </Champ>
          <div className="col-span-full">
            <Champ id="dec-note" libelle="Note">
              <Textarea id="dec-note" rows={2} maxLength={500} value={s.note} onChange={(e) => maj('note')(e.target.value)} />
            </Champ>
          </div>
        </div>
        {erreur && <p role="alert" className="text-label text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>Annuler</Button>
          <Button type="button" disabled={enCours} onClick={() => void valider()}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
