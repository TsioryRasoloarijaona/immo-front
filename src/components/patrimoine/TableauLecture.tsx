import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export interface ColonneLecture<T> {
  titre: string;
  rendu: (ligne: T) => ReactNode;
  /** Montants : alignés à droite. */
  droite?: boolean;
}

/** Tableau simple d'une fiche (sous-table en lecture, hors DataGrid). */
export default function TableauLecture<T>({ lignes, colonnes, cle }: Readonly<{
  lignes: readonly T[];
  colonnes: readonly ColonneLecture<T>[];
  cle: (ligne: T, index: number) => string;
}>) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {colonnes.map((c) => (
              <TableHead key={c.titre} className={c.droite ? 'text-right' : undefined}>{c.titre}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l, i) => (
            <TableRow key={cle(l, i)}>
              {colonnes.map((c) => (
                <TableCell key={c.titre} className={c.droite ? 'text-right tabular-nums' : 'whitespace-nowrap'}>
                  {c.rendu(l)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
