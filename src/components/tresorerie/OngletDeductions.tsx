import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { EmptyState } from '../ui';
import { Button } from '../ui/button';
import DialogueRetenue from './DialogueRetenue';
import { formatCurrency, formatPercent } from '../../lib/format';
import { baseRestante, lignesRetenue, netDe, typesProposes } from '../../lib/saisieRetenue';
import type { LigneRetenueDto, ReferentielsDecaissementDto, SaisieDecaissementDto } from '../../types/tresorerie';

const ENTETES = ['Type', 'Taux', 'Montant brut', 'Montant RS', 'Montant net'];

/** Grille « Liste des retenues » ; `index` null = ajout dans le dialogue. */
export default function OngletDeductions({ b, referentiels, maj }: Readonly<{
  b: SaisieDecaissementDto;
  referentiels: ReferentielsDecaissementDto;
  maj: (patch: Partial<SaisieDecaissementDto>) => void;
}>) {
  const [selection, setSelection] = useState<number | null>(null);
  const [edition, setEdition] = useState<{ index: number | null } | null>(null);
  const lignes = lignesRetenue(b);
  const libelleType = (id: string | null) => {
    const t = referentiels.typesRetenue.find((x) => x.id === id);
    return t ? [t.code, t.libelle].filter(Boolean).join(' – ') : '—';
  };

  const valider = (ligne: LigneRetenueDto) => {
    const index = edition?.index ?? null;
    maj({ retenues: index === null ? [...lignes, ligne] : lignes.map((l, i) => (i === index ? ligne : l)) });
    setEdition(null);
  };
  const supprimer = () => {
    maj({ retenues: lignes.filter((_, i) => i !== selection) });
    setSelection(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEdition({ index: null })}><Plus /> Ajouter une retenue</Button>
        <Button type="button" variant="ghost" size="sm" disabled={selection === null} onClick={() => setEdition({ index: selection })}><Pencil /> Modifier la retenue</Button>
        <Button type="button" variant="ghost" size="sm" disabled={selection === null} onClick={supprimer}><Trash2 /> Supprimer la retenue</Button>
      </BarreIcones>
      {lignes.length === 0 ? (
        <EmptyState title="Aucune retenue" />
      ) : (
        <table className="w-full text-body">
          <thead>
            <tr>{ENTETES.map((e) => <th key={e} scope="col" className="px-2 py-1 text-left font-medium">{e}</th>)}</tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr
                key={l.id ?? i}
                aria-selected={selection === i}
                className={`cursor-pointer border-t border-border ${selection === i ? 'bg-accent' : ''}`}
                onClick={() => setSelection(i)}
                onDoubleClick={() => setEdition({ index: i })}
              >
                <td className="px-2 py-1">{libelleType(l.typeRetenueId)}</td>
                <td className="px-2 py-1 text-right">{formatPercent(l.taux)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(l.base)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(l.montantRs ?? 0)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(netDe(l.base, l.montantRs ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {edition && (
        <DialogueRetenue
          initiale={edition.index === null ? null : lignes[edition.index]}
          types={typesProposes(referentiels.typesRetenue, b.dateDocument)}
          baseInitiale={baseRestante(b)}
          onValider={valider}
          onClose={() => setEdition(null)}
        />
      )}
    </div>
  );
}
