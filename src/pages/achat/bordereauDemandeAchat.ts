import type { SourceBordereau } from '../../components/projet/sousfenetres/BordereauModifiable';
import { totalHTLigne, totalTTCLigne, totauxEtat } from '../../lib/saisieBordereau';
import type { BordereauSaisieDto } from '../../types/projet';

/** Bordereau de saisie renvoyé par le serveur vers la forme lue par l'arbre du lot (totaux recalculés ici). */
export function versSource(dto: BordereauSaisieDto, tvaDefaut: number | null): SourceBordereau {
  const noms = new Map(dto.groupes.map((g) => [g.id, g.description]));
  const lignes = dto.lignes.map((l) => ({
    ...l,
    groupe: (l.groupeId && noms.get(l.groupeId)) || null,
    totalHT: totalHTLigne(l),
    totalTTC: totalTTCLigne(l),
    decomptee: false,
  }));
  return {
    groupes: dto.groupes.map((g) => ({ ...g, stock: false })),
    lignes,
    totaux: totauxEtat(lignes),
    tvaParDefaut: tvaDefaut,
    categorieParDefautId: null,
  };
}
