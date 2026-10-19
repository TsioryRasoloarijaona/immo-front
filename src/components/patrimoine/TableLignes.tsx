import { Trash2 } from 'lucide-react';
import { EmptyState } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import SaisieOnglet from './SaisieOnglet';
import { afficherValeur, type ColonneOnglet, type Rangee, type Valeur } from '../../lib/ongletsTranche';

/** Table de lignes saisies en place (onglets de tranche, prévisions de base) ; lecture seule si `!editable`. */
export default function TableLignes<L>({ colonnes, rangees, editable, version, onChange, onRetirer }: Readonly<{
  colonnes: ColonneOnglet<L>[];
  rangees: Rangee<L>[];
  editable: boolean;
  /** Change à chaque rechargement : remonte les saisies non contrôlées. */
  version: number;
  onChange: (cle: string, nom: keyof L, valeur: Valeur) => void;
  onRetirer: (cle: string) => void;
}>) {
  if (rangees.length === 0) return <EmptyState title="Aucune ligne" />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {colonnes.map((c) => <TableHead key={c.nom}>{c.libelle}</TableHead>)}
          {editable && <TableHead><span className="sr-only">Retirer</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rangees.map((r) => (
          <TableRow key={`${r.cle}-${version}`}>
            {colonnes.map((c) => (
              <TableCell key={c.nom}>
                {editable && !c.calcule?.(r.ligne)
                  ? <SaisieOnglet colonne={c} ligne={r.ligne} onChange={(v) => onChange(r.cle, c.nom, v)} />
                  : afficherValeur(c, r.ligne)}
              </TableCell>
            ))}
            {editable && (
              <TableCell>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer la ligne" onClick={() => onRetirer(r.cle)}>
                  <Trash2 />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
