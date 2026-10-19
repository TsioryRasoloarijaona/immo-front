import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import PrixArticleSaisie from '../../components/patrimoine/PrixArticleSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { getArticle } from '../../lib/api';
import { createArticle, createSousArticle, getPresentationsTranche, updateArticle } from '../../lib/apiPatrimoine';
import {
  referentielItems,
  useCategoriesArticle,
  useCategoriesSousArticle,
  useEtages,
  useImmeubles,
  useTranchesFiltre,
  useTypesArticle,
  useTypesSousArticle,
  useVocationsArticle,
} from '../../lib/referentiels';
import {
  brouillonArticle, champsArticle, CHAMPS_PROTEGES, corpsArticle, sectionsArticle, useListesFicheArticle,
} from '../../lib/saisieArticle';
import { useSaisie, type Brouillon } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { ArticleDetailDto } from '../../types';

/**
 * `/articles/nouveau?trancheId=`, `/articles/:id/modifier` (article ou sous-article) et, avec `sousArticle`,
 * `/articles/:id/sous-articles/nouveau` (`:id` = l'article parent).
 */
export default function ArticleForm({ sousArticle = false }: Readonly<{ sousArticle?: boolean }>) {
  const { id } = useParams();
  let titre = 'Nouvel article';
  if (sousArticle) titre = 'Nouveau sous-article';
  else if (id) titre = "Modifier l'article";
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles', to: '/articles' }, { label: titre }]}
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {id ? <ArticleCharge key={id} id={id} sousArticle={sousArticle} /> : <CreationArticle />}
    </AdminGuard>
  );
}

function CreationArticle() {
  const [params] = useSearchParams();
  return <SaisieArticle sousArticle={false} depart={{ ...brouillonArticle(false), trancheId: params.get('trancheId') ?? '' }} />;
}

/** Charge l'article : à modifier, ou parent du sous-article à créer (immeuble repris du parent). */
function ArticleCharge({ id, sousArticle }: Readonly<{ id: string; sousArticle: boolean }>) {
  const { data, error } = useApi(() => getArticle(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  if (sousArticle) {
    return <SaisieArticle sousArticle parent={data} depart={{ ...brouillonArticle(true), immeubleId: data.immeubleId ?? '' }} />;
  }
  const estSous = data.estSousArticle === true;
  return <SaisieArticle sousArticle={estSous} article={data} depart={brouillonArticle(estSous, data)} />;
}

function SaisieArticle({ sousArticle, article, parent, depart }: Readonly<{
  sousArticle: boolean;
  article?: ArticleDetailDto;
  parent?: ArticleDetailDto;
  depart: Brouillon;
}>) {
  const navigate = useNavigate();
  const saisie = useSaisie(champsArticle(sousArticle), depart);
  const choisie = saisie.brouillon.trancheId;
  const trancheId = article?.trancheId ?? parent?.trancheId ?? (typeof choisie === 'string' ? choisie : '');
  const listes = { ...useListesArticle(sousArticle, trancheId), ...useListesFicheArticle() };
  const occupe = article?.occupe === true;
  const verrouilles = [...(article ? ['trancheId'] : []), ...(occupe ? CHAMPS_PROTEGES : [])];
  // Les présentations sont propres à la tranche : en changer vide le choix.
  const modifierIdentite = (nom: string, valeur: string | boolean) => {
    if (nom === 'trancheId') saisie.setBrouillon((b) => ({ ...b, trancheId: valeur, presentationId: '' }));
    else saisie.modifier(nom, valeur);
  };

  function enregistrer() {
    const corps = corpsArticle(sousArticle, saisie.brouillon, article ? depart : undefined);
    let action: () => Promise<ArticleDetailDto> = () => createArticle(corps);
    if (article) action = () => updateArticle(article.id, corps);
    else if (parent) action = () => createSousArticle(parent.id, corps);
    void saisie.envoyer(action, (a) => void navigate(`/articles/${parent ? parent.id : a.id}`));
  }

  return (
    <div className="flex max-w-240 flex-col gap-3">
      {parent && (
        <p className="text-body text-muted-foreground">
          Sous-article de <span className="font-medium text-foreground">{parent.code}</span> — même tranche et vocation.
        </p>
      )}
      {article?.occupe && (
        <p role="note" className="text-body text-muted-foreground">
          Article affecté au dossier <span className="font-medium text-foreground">{article.dossierCode ?? 'de son article'}</span> :
          prix, surfaces, classification et titre foncier ne se modifient plus.
        </p>
      )}
      <SectionsSaisie
        sections={sectionsArticle(sousArticle, !article).slice(0, 1)}
        brouillon={saisie.brouillon}
        onChange={modifierIdentite}
        listes={listes}
        verrouilles={verrouilles}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PrixArticleSaisie brouillon={saisie.brouillon} onChange={saisie.modifier} verrouille={occupe} />
      <SectionsSaisie
        sections={sectionsArticle(sousArticle, !article).slice(1)}
        brouillon={saisie.brouillon}
        onChange={saisie.modifier}
        listes={listes}
        verrouilles={verrouilles}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer}
        libelle={article ? 'Enregistrer' : 'Créer'} />
    </div>
  );
}

function useListesArticle(sousArticle: boolean, trancheId: string) {
  const presentations = useApi(() => (trancheId ? getPresentationsTranche(trancheId) : Promise.resolve([])), [trancheId]);
  const tranches = useTranchesFiltre();
  const vocations = useVocationsArticle();
  const categoriesArticle = useCategoriesArticle();
  const categoriesSous = useCategoriesSousArticle();
  const typesArticle = useTypesArticle();
  const typesSous = useTypesSousArticle();
  const immeubles = useImmeubles();
  const etages = useEtages();
  return {
    tranches: tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id })),
    vocations: referentielItems(vocations.data),
    categories: referentielItems(sousArticle ? categoriesSous.data : categoriesArticle.data),
    types: referentielItems(sousArticle ? typesSous.data : typesArticle.data),
    immeubles: referentielItems(immeubles.data),
    etages: referentielItems(etages.data),
    presentations: referentielItems(presentations.data ?? []),
  };
}
