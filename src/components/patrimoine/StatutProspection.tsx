import { Badge } from '../ui';
import { couleurStatut, toneStatut } from '../../lib/saisieProspectionTerrain';
import type { ProspectionTerrainListeDto } from '../../types/prospectionsTerrain';

/** Statut de workflow : pastille de la couleur du statut, glyphe et teinte selon son type. */
export default function StatutProspection({ prospection: p }: Readonly<{
  prospection: Pick<ProspectionTerrainListeDto, 'statut' | 'statutCouleur' | 'statutType'>;
}>) {
  if (!p.statut) return <span className="text-muted-foreground">—</span>;
  const couleur = couleurStatut(p.statutCouleur);
  return (
    <Badge tone={toneStatut(p.statutType)}>
      {couleur && <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: couleur }} />}
      {p.statut.description || p.statut.code}
    </Badge>
  );
}
