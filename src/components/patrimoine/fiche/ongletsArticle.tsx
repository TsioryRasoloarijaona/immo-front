import ChampFiche from '../../fiche/ChampFiche';
import type { OngletEntete } from '../../fiche/ClasseurEntete';
import type { OngletFiche } from '../../FicheShell';
import { ErrorState } from '../../ui';
import ChampsSpecifiques from '../ChampsSpecifiques';
import { SectionFiche } from '../FicheSections';
import GrilleOnglet from '../GrilleOnglet';
import OngletPlanArticle from '../OngletPlanArticle';
import { DossierVenteArticle, IdentiteArticle } from '../OngletsArticle';
import PiecesJointesBloc from '../PiecesJointesBloc';
import PrixArticleFiche from '../PrixArticleFiche';
import SousArticlesArticle from '../SousArticlesArticle';
import { grilleContenances, sourceContenances } from '../../../lib/ongletsArticle';
import { ongletsTransverses } from '../../../lib/ongletsTransverses';
import { sectionsArticle } from '../../../lib/saisieArticle';
import type { useContenances } from '../../../lib/referentiels';
import type { Choix } from '../../../lib/saisiePatrimoine';
import type { ApiState } from '../../../lib/useApi';
import type { ArticleDetailDto, DossierDetailDto } from '../../../types';

export function bandeArticle(a: ArticleDetailDto) {
  return (
    <>
      <ChampFiche libelle="Code" valeur={a.code} />
      <ChampFiche libelle="Description" valeur={a.description} />
      <ChampFiche libelle="Tranche" valeur={a.trancheDescription || a.trancheCode} lien={a.trancheId ? `/tranches/${a.trancheId}` : undefined} />
      <ChampFiche libelle="Catégorie" valeur={a.categorieLibelle} />
      <ChampFiche libelle="Type" valeur={a.typeLibelle} />
      <ChampFiche libelle="Nature" valeur={a.natureLibelle} />
      <ChampFiche libelle="Immeuble" valeur={a.immeubleLibelle} />
      <ChampFiche libelle="Étage" valeur={a.etageLibelle} />
      <ChampFiche libelle="Adresse" valeur={a.adresse} />
      {a.estSousArticle && <ChampFiche libelle="Article parent" valeur={a.lotParentCode || a.lotParentDescription} />}
      {a.estSousArticle && <ChampFiche libelle="Toujours affecté" type="case" valeur={a.toujoursAffecte === true} />}
    </>
  );
}

export function enteteArticle(a: ArticleDetailDto): OngletEntete[] {
  return [{ id: 'prix', titre: 'Prix', contenu: <PrixArticleFiche article={a} /> }];
}

interface Entrees {
  article: ArticleDetailDto;
  dossier: ApiState<DossierDetailDto | null>;
  listes: Record<string, Choix>;
  contenances: ReturnType<typeof useContenances>;
  relire: () => void;
  ouvrirArticle: (id: string) => void;
  ouvrirDossier: (id: string) => void;
}

export function basArticle({ article: a, dossier, listes, contenances, relire, ouvrirArticle, ouvrirDossier }: Entrees): OngletFiche[] {
  const dossierId = a.dossierId;
  return [
    { id: 'identite', libelle: 'Identité', contenu: <IdentiteArticle article={a} /> },
    ...sectionsArticle(a.estSousArticle === true, false).slice(1).map((section) => ({
      id: section.titre,
      libelle: section.titre,
      contenu: <SectionFiche section={section} source={a} listes={listes} />,
    })),
    ...(dossierId
      ? [{ id: 'dossier', libelle: 'Dossier de vente', contenu: <DossierVenteArticle dossier={dossier} onOuvrir={() => ouvrirDossier(dossierId)} /> }]
      : []),
    { id: 'sous-articles', libelle: 'Sous-articles', compteur: a.sousLots?.length ?? 0, contenu: <SousArticlesArticle article={a} onModifie={relire} onOuvrir={ouvrirArticle} /> },
    {
      id: 'contenances',
      libelle: 'Contenances',
      contenu: (
        <>
          {contenances.error && <ErrorState message={contenances.error} />}
          <GrilleOnglet source={sourceContenances(a.id, a.presentationTypeId)} nouvelle={{ nombre: 1 }} {...grilleContenances(contenances.data)} />
        </>
      ),
    },
    { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={a.id} /> },
    { id: 'plan', libelle: 'Plan', contenu: <OngletPlanArticle articleId={a.id} /> },
    { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="article" id={a.id} /> },
    ...ongletsTransverses('article', a.id),
  ];
}
