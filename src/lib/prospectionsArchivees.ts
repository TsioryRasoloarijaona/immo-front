/**
 * Message de succès quand l'enregistrement du dossier a archivé d'autres prospections ouvertes du client
 * (« Création dossier de vente », comme OMRAN) ; null s'il n'en a archivé aucune.
 */
export function messageProspectionsArchivees(codes: readonly string[] | null | undefined): string | null {
  if (!codes || codes.length === 0) return null;
  const libelle = codes.length > 1 ? 'Prospections du client archivées' : 'Prospection du client archivée';
  return `${libelle} : ${codes.join(', ')}.`;
}
