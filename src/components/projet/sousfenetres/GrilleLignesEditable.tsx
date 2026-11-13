import type { DragEvent } from 'react';
import { formatCurrency } from '../../../lib/format';
import { prixUnitaireTTC, totalHTLigne, totalTTCLigne, type Depot, type Glisse, type LigneEditee } from '../../../lib/saisieBordereau';
import { cn } from '../../../lib/utils';
import type { ReferentielItemDto } from '../../../types';
import { TYPE_GLISSE } from './ArbreBordereau';

const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-body hover:border-border focus:border-ring focus:outline-none';
const CHAMP_NOMBRE = `${CHAMP} text-right`;
const ENTETE = 'px-1 py-1 text-left text-micro font-medium text-muted-foreground';

function nombre(valeur: string): number | null {
  return valeur === '' ? null : Number(valeur);
}

function CelluleNombre({ valeur, libelle, onChange }: Readonly<{ valeur: number | null; libelle: string; onChange: (v: number | null) => void }>) {
  return (
    <td>
      <input type="number" step="any" aria-label={libelle} className={CHAMP_NOMBRE} value={valeur ?? ''} onChange={(e) => onChange(nombre(e.target.value))} />
    </td>
  );
}

function CelluleTexte({ valeur, libelle, onChange }: Readonly<{ valeur: string | null; libelle: string; onChange: (v: string) => void }>) {
  return (
    <td>
      <input type="text" aria-label={libelle} className={CHAMP} value={valeur ?? ''} onChange={(e) => onChange(e.target.value)} />
    </td>
  );
}

/** Lignes d'un bordereau en saisie : PU TTC et totaux sont calculés en direct, jamais saisis. */
export default function GrilleLignesEditable({
  lignes,
  categories,
  selection,
  onSelection,
  onChanger,
  onDeposer,
}: Readonly<{
  lignes: LigneEditee[];
  categories: ReferentielItemDto[];
  selection: string | null;
  onSelection: (id: string) => void;
  onChanger: (id: string, patch: Partial<LigneEditee>) => void;
  onDeposer: (source: Glisse, depot: Depot) => void;
}>) {
  function deposer(e: DragEvent<HTMLTableRowElement>, id: string) {
    e.preventDefault();
    const brut = e.dataTransfer.getData(TYPE_GLISSE);
    if (brut) onDeposer(JSON.parse(brut) as Glisse, { type: 'ligne', id });
  }

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full min-w-[62rem] border-collapse text-body">
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
            <th className={cn(ENTETE, 'min-w-24')}>Pondération</th>
            <th className={ENTETE}>Total HT</th>
            <th className={ENTETE}>Total TTC</th>
            <th className={ENTETE} />
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr
              key={l.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData(TYPE_GLISSE, JSON.stringify({ type: 'ligne', id: l.id } satisfies Glisse))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => deposer(e, l.id)}
              onClick={() => onSelection(l.id)}
              className={cn('border-b last:border-b-0', selection === l.id && 'bg-muted')}
            >
              <CelluleTexte valeur={l.code} libelle="Code" onChange={(v) => onChanger(l.id, { code: v })} />
              <CelluleTexte valeur={l.designation} libelle="Désignation" onChange={(v) => onChanger(l.id, { designation: v })} />
              <CelluleTexte valeur={l.unite} libelle="Unité" onChange={(v) => onChanger(l.id, { unite: v })} />
              <CelluleNombre valeur={l.quantite} libelle="Quantité" onChange={(v) => onChanger(l.id, { quantite: v })} />
              <CelluleNombre valeur={l.prixUnitaireHT} libelle="Prix unitaire HT" onChange={(v) => onChanger(l.id, { prixUnitaireHT: v })} />
              <CelluleNombre valeur={l.tauxTVA} libelle="TVA %" onChange={(v) => onChanger(l.id, { tauxTVA: v })} />
              <CelluleNombre valeur={l.tauxFODEC ?? 0} libelle="FODEC %" onChange={(v) => onChanger(l.id, { tauxFODEC: v ?? 0 })} />
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(prixUnitaireTTC(l))}</td>
              <td>
                <select aria-label="Catégorie" className={CHAMP} value={l.categorieId ?? ''} onChange={(e) => onChanger(l.id, { categorieId: e.target.value || null })}>
                  <option value="" />
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.description ?? c.code}
                    </option>
                  ))}
                </select>
              </td>
              <CelluleNombre valeur={l.ponderation} libelle="Pondération" onChange={(v) => onChanger(l.id, { ponderation: v })} />
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(totalHTLigne(l))}</td>
              <td className="px-1 text-right whitespace-nowrap">{formatCurrency(totalTTCLigne(l))}</td>
              <td className="px-1 text-micro text-muted-foreground">{l.decomptee ? 'Décomptée' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
