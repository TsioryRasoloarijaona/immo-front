import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/format';
import { totalHTAvenant } from '../../../lib/saisieAvenant';
import { prixUnitaireTTC, totalTTCLigne } from '../../../lib/saisieBordereau';
import { cn } from '../../../lib/utils';
import type { ReferentielItemDto } from '../../../types';
import type { LigneAvenantSaisieDto } from '../../../types/projet';

const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-body hover:border-border focus:border-ring focus:outline-none disabled:opacity-100 disabled:hover:border-transparent';
const ENTETE = 'px-1 py-1 text-left text-micro font-medium text-muted-foreground';

type Cle = 'code' | 'designation' | 'unite';
type CleNombre = 'quantite' | 'prixUnitaireHT' | 'tauxTVA' | 'tauxFODEC';

/** Lignes d'un avenant : PU TTC et totaux calculés en direct ; `lectureSeule` pour un avenant facturé. */
export default function GrilleLignesAvenant({
  lignes,
  categories,
  lectureSeule,
  onChanger,
  onSupprimer,
}: Readonly<{
  lignes: LigneAvenantSaisieDto[];
  categories: ReferentielItemDto[];
  lectureSeule: boolean;
  onChanger: (id: string, patch: Partial<LigneAvenantSaisieDto>) => void;
  onSupprimer: (id: string) => void;
}>) {
  const texte = (l: LigneAvenantSaisieDto, cle: Cle, libelle: string) => (
    <td>
      <input type="text" aria-label={libelle} disabled={lectureSeule} className={CHAMP} value={l[cle] ?? ''} onChange={(e) => onChanger(l.id ?? '', { [cle]: e.target.value })} />
    </td>
  );
  const nombre = (l: LigneAvenantSaisieDto, cle: CleNombre, libelle: string) => (
    <td>
      <input
        type="number"
        step="any"
        aria-label={libelle}
        disabled={lectureSeule}
        className={cn(CHAMP, 'text-right')}
        value={l[cle] ?? ''}
        onChange={(e) => onChanger(l.id ?? '', { [cle]: e.target.value === '' ? null : Number(e.target.value) })}
      />
    </td>
  );

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full min-w-[60rem] border-collapse text-body">
        <thead>
          <tr className="border-b">
            <th className={ENTETE}>Code</th>
            <th className={cn(ENTETE, 'min-w-56')}>Désignation</th>
            <th className={ENTETE}>Unité</th>
            <th className={ENTETE}>Qté</th>
            <th className={cn(ENTETE, 'min-w-28')}>PU HT</th>
            <th className={ENTETE}>TVA %</th>
            <th className={ENTETE}>FODEC %</th>
            <th className={ENTETE}>PU TTC</th>
            <th className={ENTETE}>Catégorie</th>
            <th className={ENTETE}>Total HT</th>
            <th className={ENTETE}>Total TTC</th>
            <th className={ENTETE} />
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.id} className="border-b last:border-b-0">
              {texte(l, 'code', 'Code')}
              {texte(l, 'designation', 'Désignation')}
              {texte(l, 'unite', 'Unité')}
              {nombre(l, 'quantite', 'Quantité')}
              {nombre(l, 'prixUnitaireHT', 'Prix unitaire HT')}
              {nombre(l, 'tauxTVA', 'TVA %')}
              {nombre(l, 'tauxFODEC', 'FODEC %')}
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(prixUnitaireTTC(l))}</td>
              <td>
                <select aria-label="Catégorie" disabled={lectureSeule} className={CHAMP} value={l.categorieId ?? ''} onChange={(e) => onChanger(l.id ?? '', { categorieId: e.target.value || null })}>
                  <option value="" />
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.description ?? c.code}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(totalHTAvenant(l))}</td>
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(totalTTCLigne(l))}</td>
              <td className="px-1">
                {!lectureSeule && (
                  <button type="button" aria-label="Supprimer la ligne" title="Supprimer la ligne" className="text-muted-foreground hover:text-destructive" onClick={() => onSupprimer(l.id ?? '')}>
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
