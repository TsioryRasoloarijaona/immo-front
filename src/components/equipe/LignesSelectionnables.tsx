import LignesADistribuer from './LignesADistribuer';
import type { ProspectionListItemDto, UUID } from '../../types';

/** Liste à cocher de la fenêtre « Réaffecter », mêmes lignes que « À distribuer » ; le nom ouvre la fiche. */
export default function LignesSelectionnables({
  lignes,
  selection,
  onBasculer,
  onOuvrir,
}: Readonly<{
  lignes: readonly ProspectionListItemDto[];
  selection: ReadonlySet<string>;
  onBasculer: (id: UUID) => void;
  onOuvrir: (id: UUID) => void;
}>) {
  const cochables = lignes.map((l) => ({
    id: l.id,
    code: l.code,
    nom: l.prospectNom || l.tempDescription,
    trancheCode: l.trancheCode,
    dateDocument: l.dateDocument,
    dejaTraitee: false,
  }));
  return <LignesADistribuer lignes={cochables} selection={selection} onBasculer={onBasculer} onOuvrir={onOuvrir} />;
}
