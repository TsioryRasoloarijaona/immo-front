import { formatNumber } from '../../lib/format';
import { useReplis } from '../../lib/useTdbProjet';
import type { ColonneBilanDto, NoeudBilanDto } from '../../types/projetTdb';
import { CelluleArbre } from './TdbCommun';

type Replis = ReturnType<typeof useReplis>;

function Lignes({ noeud, colonnes, replis }: Readonly<{ noeud: NoeudBilanDto; colonnes: ColonneBilanDto[]; replis: Replis }>) {
  const cle = noeud.categorieId;
  const replie = replis.replies.has(cle);
  return (
    <>
      <tr className={noeud.enfants.length > 0 ? 'font-medium' : undefined}>
        <CelluleArbre libelle={noeud.libelle} niveau={noeud.niveau} aEnfants={noeud.enfants.length > 0} replie={replie} onBascule={() => replis.bascule(cle)} />
        {colonnes.map((c) => (
          <td key={c.code} className="px-2 text-right tabular-nums">
            {formatNumber(noeud.valeurs[c.code] ?? 0, 2)}
          </td>
        ))}
        <td className="px-2 text-right tabular-nums">{formatNumber(noeud.ecart, 2)}</td>
      </tr>
      {!replie && noeud.enfants.map((e) => <Lignes key={e.categorieId} noeud={e} colonnes={colonnes} replis={replis} />)}
    </>
  );
}

/** `colonnes` = colonnes affichées (déjà filtrées par la page). */
export default function GrilleBilansProjet({ colonnes, lignes }: Readonly<{ colonnes: ColonneBilanDto[]; lignes: NoeudBilanDto[] }>) {
  const replis = useReplis();
  return (
    <table className="w-full border-collapse text-body [&_td]:h-6 [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border [&_th]:px-2">
      <thead>
        <tr className="bg-muted text-micro">
          <th className="text-left">Catégorie</th>
          {colonnes.map((c) => (
            <th key={c.code} className="text-right">
              {c.libelle}
            </th>
          ))}
          <th className="text-right">Écart</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((n) => (
          <Lignes key={n.categorieId} noeud={n} colonnes={colonnes} replis={replis} />
        ))}
      </tbody>
    </table>
  );
}
