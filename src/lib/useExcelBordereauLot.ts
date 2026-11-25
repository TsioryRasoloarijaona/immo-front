import { cheminExportBordereauLot, importerBordereauLot } from './apiProjet';
import { useExportListe } from './useExportListe';
import type { UUID } from '../types';
import type { ExcelBordereau } from '../components/projet/sousfenetres/BordereauModifiable';

/** Export / import Excel du bordereau d'un lot, au format attendu par `BordereauModifiable`. */
export function useExcelBordereauLot(lotId: UUID, type: 'DEFINITIF' | 'ESTIMATIF'): ExcelBordereau {
  const exportation = useExportListe(cheminExportBordereauLot(lotId), { type }, 'bordereau-lot');
  return {
    exporter: () => exportation.exporter('xlsx'),
    importer: (fichier) => importerBordereauLot(lotId, type, fichier),
    exportEnCours: exportation.enCours || exportation.refuse,
    erreurExport: exportation.erreur,
  };
}
