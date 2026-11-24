import { useState } from 'react';
import Modal from '../Modal';
import { ChampListe, ChampNombre, ChampTexte } from '../achat/champsSaisieAchat';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { formatCurrency } from '../../lib/format';
import { montantRsDe, netDe, tauxDe } from '../../lib/saisieRetenue';
import type { LigneRetenueDto, TypeRetenueDto } from '../../types/tresorerie';

/** Ligne de retenue : saisir le taux recalcule le montant RS, et inversement. */
export default function DialogueRetenue({ initiale, types, baseInitiale, onValider, onClose }: Readonly<{
  initiale: LigneRetenueDto | null;
  types: TypeRetenueDto[];
  baseInitiale: number;
  onValider: (ligne: LigneRetenueDto) => void;
  onClose: () => void;
}>) {
  const [ligne, setLigne] = useState<LigneRetenueDto>(
    () => initiale ?? { typeRetenueId: null, base: baseInitiale, taux: 0, montantRs: 0 },
  );
  const base = ligne.base;
  const montantRs = ligne.montantRs ?? 0;

  const choisirType = (id: string | null) => {
    const taux = types.find((t) => t.id === id)?.taux ?? 0;
    setLigne((l) => ({ ...l, typeRetenueId: id, taux, montantRs: montantRsDe(l.base, taux) }));
  };
  const changerBase = (v: number | null) => {
    const b = v ?? 0;
    setLigne((l) => ({ ...l, base: b, montantRs: montantRsDe(b, l.taux ?? 0) }));
  };
  const changerTaux = (pourcent: number | null) => {
    const taux = (pourcent ?? 0) / 100;
    setLigne((l) => ({ ...l, taux, montantRs: montantRsDe(l.base, taux) }));
  };
  const changerMontantRs = (v: number | null) => {
    const m = v ?? 0;
    setLigne((l) => ({ ...l, montantRs: m, taux: tauxDe(l.base, m) }));
  };

  return (
    <Modal title={initiale ? 'Modifier la retenue' : 'Nouvelle retenue'} onClose={onClose} width={560}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ChampListe
            id="ret-type"
            libelle="Type"
            requis
            items={types.map((t) => ({ value: t.id, label: [t.code, t.libelle].filter(Boolean).join(' – ') || '—' }))}
            valeur={ligne.typeRetenueId}
            onChange={choisirType}
          />
          <Field>
            <FieldLabel htmlFor="ret-base">Base</FieldLabel>
            <ChampNombre id="ret-base" libelle="Base" valeur={base || null} onChange={changerBase} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ret-taux">Taux (%)</FieldLabel>
            <ChampNombre id="ret-taux" libelle="Taux (%)" valeur={Math.round((ligne.taux ?? 0) * 1e6) / 1e4 || null} onChange={changerTaux} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ret-rs">Montant RS</FieldLabel>
            <ChampNombre id="ret-rs" libelle="Montant RS" valeur={montantRs || null} onChange={changerMontantRs} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ret-net">Montant net</FieldLabel>
            <Input id="ret-net" readOnly value={formatCurrency(netDe(base, montantRs))} />
          </Field>
        </div>
        <ChampTexte id="ret-notes" libelle="Notes" valeur={ligne.notes ?? ''} onChange={(v) => setLigne((l) => ({ ...l, notes: v || null }))} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="button" disabled={!ligne.typeRetenueId} onClick={() => onValider(ligne)}>Valider</Button>
        </DialogFooter>
      </div>
    </Modal>
  );
}
