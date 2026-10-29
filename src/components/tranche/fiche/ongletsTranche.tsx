import ArticlesTranche from '../../patrimoine/ArticlesTranche';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../patrimoine/FicheSections';
import PiecesJointesBloc from '../../patrimoine/PiecesJointesBloc';
import ChampsDe, { PageChamps, PageTrace } from '../../patrimoine/fiche/ChampsDe';
import ChampFiche from '../../fiche/ChampFiche';
import type { OngletEntete } from '../../fiche/ClasseurEntete';
import type { OngletFiche } from '../../FicheShell';
import { ongletsTransverses } from '../../../lib/ongletsTransverses';
import { SECTIONS_TRANCHE } from '../../../lib/saisieTranche';
import type { TrancheDetailDto } from '../../../types';

const [GENERAL, ...AUTRES_SECTIONS] = SECTIONS_TRANCHE;
const VISIBILITE = AUTRES_SECTIONS[AUTRES_SECTIONS.length - 1];
const SECTIONS_BAS = AUTRES_SECTIONS.slice(0, -1);
const NOMS_BANDE = [
  'code', 'description', 'projetId', 'standingId', 'niveauTerrainId', 'rubriqueId', 'plancherCouvert', 'responsableSavId',
  'tribunalCommerce', 'dateDebutTravaux', 'dateFinTravaux',
];

export function bandeTranche(t: TrancheDetailDto) {
  return (
    <>
      <ChampsDe sections={[GENERAL]} source={t} noms={NOMS_BANDE} />
      <ChampFiche libelle="Entité" valeur={t.entiteCode} />
    </>
  );
}

export function enteteTranche(t: TrancheDetailDto): OngletEntete[] {
  return [
    { id: 'visibilite', titre: VISIBILITE.titre, contenu: <PageChamps sections={[VISIBILITE]} source={t} /> },
    { id: 'trace', titre: 'Traçabilité', contenu: <PageTrace source={t} enPlus={<ChampFiche libelle="Entité" valeur={t.entiteCode} />} /> },
  ];
}

/** `grilles` : Terrains, Étages, Plancher couvert, Frais de vente, Finalisations, Commission vendeur (`useOngletsTranche`). */
export function basTranche(t: TrancheDetailDto, id: string, grilles: OngletFiche[]): OngletFiche[] {
  return [
    ...SECTIONS_BAS.map((section) => ({ id: section.titre, libelle: section.titre, contenu: <SectionFiche section={section} source={t} /> })),
    { id: 'articles', libelle: 'Articles', contenu: <ArticlesTranche trancheId={id} /> },
    ...grilles,
    { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="tranches" id={id} /> },
    { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="tranche" id={id} /> },
    ...ongletsTransverses('tranche', id),
  ];
}
