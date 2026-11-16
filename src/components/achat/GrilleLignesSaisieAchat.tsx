import { Plus, Trash2 } from 'lucide-react';
import SearchableSelect, { type SearchableSelectOption } from '../SearchableSelect';
import { Button } from '../ui/button';
import { FieldError } from '../ui/field';
import { Input } from '../ui/input';
import { ChampNombre } from './champsSaisieAchat';
import { formatCurrency } from '../../lib/format';
import { ligneVide, prixUnitaireTTC, totauxLigne, type LigneBrouillon } from '../../lib/saisiePieceAchat';

const ENTETES = ['Code', 'Désignation *', 'Unité', 'Qté *', 'PU HT *', 'Remise %', 'FODEC %', 'TVA % *', 'Catégorie *', 'P.U. TTC', 'Total HT', 'Total TTC', ''];

function LigneSaisie({ ligne, numero, categories, onChange, onSupprimer }: Readonly<{
  ligne: LigneBrouillon;
  numero: number;
  categories: SearchableSelectOption[];
  onChange: (ligne: LigneBrouillon) => void;
  onSupprimer: () => void;
}>) {
  const maj = <K extends keyof LigneBrouillon>(champ: K, valeur: LigneBrouillon[K]) => onChange({ ...ligne, [champ]: valeur });
  const libelle = (champ: string) => `${champ}, ligne ${numero}`;
  const totaux = totauxLigne(ligne);
  return (
    <tr className="border-b border-border">
      <td className="p-1"><Input aria-label={libelle('Code')} value={ligne.code} onChange={(e) => maj('code', e.target.value)} /></td>
      <td className="p-1"><Input aria-label={libelle('Désignation')} value={ligne.description} onChange={(e) => maj('description', e.target.value)} /></td>
      <td className="p-1"><Input aria-label={libelle('Unité')} value={ligne.unite} onChange={(e) => maj('unite', e.target.value)} /></td>
      <td className="p-1"><ChampNombre libelle={libelle('Quantité')} valeur={ligne.quantite} onChange={(v) => maj('quantite', v)} /></td>
      <td className="p-1"><ChampNombre libelle={libelle('PU HT')} valeur={ligne.prixUnitaireHT} onChange={(v) => maj('prixUnitaireHT', v)} /></td>
      <td className="p-1"><ChampNombre libelle={libelle('Remise %')} valeur={ligne.remise} onChange={(v) => maj('remise', v)} /></td>
      <td className="p-1"><ChampNombre libelle={libelle('FODEC %')} valeur={ligne.fodec} onChange={(v) => maj('fodec', v)} /></td>
      <td className="p-1"><ChampNombre libelle={libelle('TVA %')} valeur={ligne.tva} onChange={(v) => maj('tva', v)} /></td>
      <td className="p-1">
        <SearchableSelect
          label={libelle('Catégorie')}
          items={categories}
          value={ligne.categorieId}
          onValueChange={(v) => maj('categorieId', v)}
          placeholder="Choisir…"
          size="sm"
        />
      </td>
      <td className="p-1 text-right tabular-nums">{formatCurrency(prixUnitaireTTC(ligne))}</td>
      <td className="p-1 text-right tabular-nums">{formatCurrency(totaux.ht)}</td>
      <td className="p-1 text-right tabular-nums">{formatCurrency(totaux.ttc)}</td>
      <td className="p-1">
        <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la ligne ${numero}`} onClick={onSupprimer}>
          <Trash2 />
        </Button>
      </td>
    </tr>
  );
}

/** Grille éditable des lignes d'une pièce d'achat ; taux saisis en %. */
export default function GrilleLignesSaisieAchat({ lignes, onChange, categories, tvaDefaut, erreur }: Readonly<{
  lignes: LigneBrouillon[];
  onChange: (lignes: LigneBrouillon[]) => void;
  categories: SearchableSelectOption[];
  tvaDefaut: number | null;
  erreur?: string;
}>) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-label font-semibold">Lignes</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lignes, ligneVide(tvaDefaut)])}>
          <Plus /> Ajouter une ligne
        </Button>
      </div>
      {lignes.length === 0 ? (
        <p className="text-body text-muted-foreground">Aucune ligne. Ajoutez-en une pour saisir la pièce.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[72rem] text-body">
            <thead>
              <tr className="border-b border-border text-left text-micro text-muted-foreground">
                {ENTETES.map((e, i) => <th key={e || i} className="p-1 font-medium">{e}</th>)}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <LigneSaisie
                  key={l.cle}
                  ligne={l}
                  numero={i + 1}
                  categories={categories}
                  onChange={(maj) => onChange(lignes.map((x) => (x.cle === l.cle ? maj : x)))}
                  onSupprimer={() => onChange(lignes.filter((x) => x.cle !== l.cle))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FieldError>{erreur}</FieldError>
    </section>
  );
}
