import Modal from '../Modal';
import PiedSaisie from './PiedSaisie';
import SectionsSaisie from './SectionsSaisie';
import { createSousArticle, listLignesArticles, updateSousArticle } from '../../lib/apiSousArticles';
import { useListesArticle } from '../../lib/saisieArticle';
import { brouillonDepuis, corpsDepuis, useSaisie, type ChampDef } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { ArticleDetailDto, ArticleEcritureDto } from '../../types';

const PARENT: ChampDef = { nom: 'parentId', libelle: 'Article parent (même tranche et vocation)', type: 'liste', liste: 'parents' };
const TOUJOURS_AFFECTE: ChampDef = { nom: 'toujoursAffecte', libelle: 'Toujours affecté', type: 'booleen' };

/** Création libre : le serveur applique la vocation Vente par défaut et refuse un parent d'une autre tranche. */
const CHAMPS_CREATION: ChampDef[] = [
  { nom: 'trancheId', libelle: 'Tranche', type: 'liste', liste: 'tranches', obligatoire: true },
  { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
  { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
  { nom: 'vocationId', libelle: 'Vocation (Vente par défaut)', type: 'liste', liste: 'vocations' },
  { nom: 'categorieId', libelle: 'Catégorie de sous-article', type: 'liste', liste: 'categories', obligatoire: true },
  { nom: 'typeId', libelle: 'Type de sous-article', type: 'liste', liste: 'types', obligatoire: true },
  { nom: 'immeubleId', libelle: 'Immeuble', type: 'liste', liste: 'immeubles', obligatoire: true },
  { nom: 'etageId', libelle: 'Étage', type: 'liste', liste: 'etages', obligatoire: true },
  { nom: 'surfaceProvisoire', libelle: 'Surface provisoire', type: 'surface' },
  { nom: 'surfaceDefinitive', libelle: 'Surface définitive', type: 'surface' },
  PARENT,
  TOUJOURS_AFFECTE,
];

/** Sans `article` : création d'un sous-article libre ; avec : rattachement d'un sous-article libre (parent, « Toujours affecté »). */
export default function SousArticleDialog({ article, onClose, onSaved }: Readonly<{
  article?: ArticleDetailDto;
  onClose: () => void;
  onSaved: (a: ArticleDetailDto) => void;
}>) {
  const champs = article ? [PARENT, TOUJOURS_AFFECTE] : CHAMPS_CREATION;
  const saisie = useSaisie(champs, brouillonDepuis(champs, article ? { toujoursAffecte: article.toujoursAffecte } : {}));
  const choisie = saisie.brouillon.trancheId;
  const trancheId = article?.trancheId ?? (typeof choisie === 'string' ? choisie : '');
  const listes = useListesArticle(true, trancheId);
  const parents = useApi(
    () => (trancheId
      ? listLignesArticles('articles', { trancheId: [trancheId], statut: 'DISPONIBLE', colonnes: ['id', 'code', 'description', 'estSousArticle'] },
        { page: 0, size: 200 })
      : Promise.resolve(null)),
    [trancheId],
  );
  const choixParents = (parents.data?.content ?? [])
    .filter((p) => p.estSousArticle !== true)
    .map((p) => ({ label: [p.code, p.description].filter(Boolean).join(' — '), value: p.id }));

  function enregistrer() {
    const corps = corpsDepuis(champs, saisie.brouillon) as ArticleEcritureDto;
    const action = article ? () => updateSousArticle(article.id, corps) : () => createSousArticle(corps);
    void saisie.envoyer(action, (a) => {
      onSaved(a);
      onClose();
    });
  }

  return (
    <Modal title={article ? 'Rattacher le sous-article' : 'Nouveau sous-article'} onClose={onClose} width={760}>
      <SectionsSaisie
        sections={[{ titre: article ? 'Rattachement' : 'Sous-article libre', champs }]}
        brouillon={saisie.brouillon}
        onChange={(nom, valeur) => (nom === 'trancheId' ? saisie.setBrouillon((b) => ({ ...b, trancheId: valeur, parentId: '' })) : saisie.modifier(nom, valeur))}
        listes={{ ...listes, parents: trancheId ? choixParents : [] }}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer} libelle={article ? 'Enregistrer' : 'Créer'} />
    </Modal>
  );
}
