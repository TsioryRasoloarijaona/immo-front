import { useState } from 'react';
import { ChevronDown, FileSpreadsheet } from 'lucide-react';
import { Button, buttonVariants } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { exporterListe } from '../lib/export';
import type { QueryValue } from '../lib/api';
import type { FormatExport } from '../types';

/**
 * Export de la liste courante (filtres, colonnes visibles et tri compris). Générique : toute liste.
 * `pdf` ajoute le choix XLSX / PDF, pour les listes dont l'export sait produire un PDF ; sinon un seul clic, en XLSX.
 */
export default function BoutonExporter({
  chemin,
  params,
  nomListe,
  disabled,
  pdf = false,
}: Readonly<{
  chemin: string;
  params: Record<string, QueryValue>;
  nomListe: string;
  disabled?: boolean;
  pdf?: boolean;
}>) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter(format: FormatExport) {
    setEnCours(true);
    setErreur(null);
    try {
      await exporterListe(chemin, params, nomListe, format);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'export a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  const inactif = disabled || enCours;
  const libelle = enCours ? 'Export…' : 'Exporter';

  return (
    <span className="inline-flex items-center gap-2">
      {pdf ? (
        <DropdownMenu>
          <DropdownMenuTrigger disabled={inactif} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <FileSpreadsheet data-icon="inline-start" /> {libelle} <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => void exporter('xlsx')}>Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void exporter('pdf')}>PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={inactif} onClick={() => void exporter('xlsx')}>
          <FileSpreadsheet data-icon="inline-start" /> {libelle}
        </Button>
      )}
      {erreur && (
        <span role="alert" className="text-body text-destructive">
          {erreur}
        </span>
      )}
    </span>
  );
}
