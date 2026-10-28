import { useState } from 'react';
import { exporterListe } from './export';
import type { QueryValue } from './api';
import type { FormatExport } from '../types';

/** Export de la liste courante (filtres, colonnes visibles et tri compris) ; `erreur` jusqu'au prochain essai. */
export function useExportListe(chemin: string, params: Record<string, QueryValue>, nomListe: string) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter(format: FormatExport = 'xlsx') {
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

  return { exporter, enCours, erreur };
}
