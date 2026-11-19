import { CircleDot } from 'lucide-react';
import type { StatutJourTravailleDto } from '../../../types/travauxChantier';

/** Pastille de statut : glyphe teinté par la couleur du statut, puis son libellé (jamais la couleur seule). */
export default function StatutPastille({ statut }: Readonly<{ statut: StatutJourTravailleDto | null }>) {
  if (!statut) return <span>—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <CircleDot aria-hidden className="size-3 shrink-0" style={statut.couleur ? { color: statut.couleur } : undefined} />
      {statut.libelle ?? '—'}
    </span>
  );
}
