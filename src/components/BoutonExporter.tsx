import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from './ui/button';
import { exporterListe } from '../lib/export';
import type { QueryValue } from '../lib/api';

/** Export Excel de la liste courante (filtres, colonnes visibles et tri compris). Générique : toute liste. */
export default function BoutonExporter({
  chemin,
  params,
  nomListe,
  disabled,
}: Readonly<{
  chemin: string;
  params: Record<string, QueryValue>;
  nomListe: string;
  disabled?: boolean;
}>) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter() {
    setEnCours(true);
    setErreur(null);
    try {
      await exporterListe(chemin, params, nomListe);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'export a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={disabled || enCours} onClick={() => void exporter()}>
        <FileSpreadsheet data-icon="inline-start" /> {enCours ? 'Export…' : 'Exporter'}
      </Button>
      {erreur && (
        <span role="alert" className="text-body text-destructive">
          {erreur}
        </span>
      )}
    </span>
  );
}
