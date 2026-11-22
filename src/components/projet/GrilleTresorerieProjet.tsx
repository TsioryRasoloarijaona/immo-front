import { useReplis } from '../../lib/useTdbProjet';
import { formatNumber } from '../../lib/format';
import type { NoeudTresorerieDto } from '../../types/projetTdb';
import { CelluleArbre } from './TdbCommun';

export interface CelluleChoisie {
  noeud: NoeudTresorerieDto;
  mois: number;
}

const montant = (v: number) => (v === 0 ? '' : formatNumber(v, 2));

type Replis = ReturnType<typeof useReplis>;

function Lignes({ noeud, replis, onCellule }: Readonly<{
  noeud: NoeudTresorerieDto;
  replis: Replis;
  onCellule: (c: CelluleChoisie) => void;
}>) {
  const replie = replis.replies.has(noeud.cle);
  return (
    <>
      <tr className={noeud.enfants.length > 0 ? 'font-medium' : undefined}>
        <CelluleArbre libelle={noeud.libelle} niveau={noeud.niveau} aEnfants={noeud.enfants.length > 0} replie={replie} onBascule={() => replis.bascule(noeud.cle)} />
        {noeud.montants.map((v, i) => (
          <td key={i} className="cursor-pointer px-2 text-right tabular-nums" onDoubleClick={() => onCellule({ noeud, mois: i + 1 })}>
            {montant(v)}
          </td>
        ))}
        <td className="px-2 text-right font-medium tabular-nums">{montant(noeud.total)}</td>
        <td className="px-2 text-right tabular-nums">{montant(noeud.regle)}</td>
      </tr>
      {!replie &&
        noeud.enfants.map((e) => <Lignes key={e.cle} noeud={e} replis={replis} onCellule={onCellule} />)}
    </>
  );
}

export default function GrilleTresorerieProjet({ mois, noeuds, onCellule }: Readonly<{
  mois: string[];
  noeuds: NoeudTresorerieDto[];
  onCellule: (c: CelluleChoisie) => void;
}>) {
  const replis = useReplis();
  return (
    <table className="w-full border-collapse text-body [&_td]:h-6 [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border [&_th]:px-2">
      <thead>
        <tr className="bg-muted text-micro">
          <th className="text-left">Libellé</th>
          {mois.map((m) => (
            <th key={m} className="text-right">
              {m}
            </th>
          ))}
          <th className="text-right">Total</th>
          <th className="text-right">Réglé</th>
        </tr>
      </thead>
      <tbody>
        {noeuds.map((n) => (
          <Lignes key={n.cle} noeud={n} replis={replis} onCellule={onCellule} />
        ))}
      </tbody>
    </table>
  );
}
