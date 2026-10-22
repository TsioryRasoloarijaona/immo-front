import FicheSections from '../patrimoine/FicheSections';
import { SECTIONS_BILAN } from '../../lib/faisabilite';
import type { EtudeFaisabiliteDto } from '../../types/faisabilite';

/** Bilan stocké par OMRAN : lecture seule, rendu vivant avec les prévisions (P8b). */
export default function BilanEtude({ fiche }: Readonly<{ fiche: EtudeFaisabiliteDto }>) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-muted-foreground">Valeurs enregistrées par OMRAN, sans saisie dans cet écran.</p>
      <FicheSections sections={SECTIONS_BILAN} source={fiche.bilan} />
    </div>
  );
}
