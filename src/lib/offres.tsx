import { Link } from 'react-router-dom';
import { Badge, Field, FieldGrid } from '../components/ui';
import FicheOffreActions from '../components/offres/FicheOffreActions';
import type { ColonneGrille } from '../components/DataGrid';
import type { ValeursEditionDevis } from '../components/DevisFormSection';
import type { DispositionColonnes } from './colonnes';
import { formatMontantOptionnel, formatPercent, formatPercentValue, formatSurface } from './format';
import type { ColonneDto, CreerDevisRequest, DevisDto, FicheDevisDto, GroupeColonne, ModifierDevisRequest } from '../types';

const montant = formatMontantOptionnel;
const TIRET_MUET = <span className="text-muted-foreground">-</span>;

/** Panneau dépliable d'une ligne de `/offres` : le détail HT/TTC de l'offre. */
export function detailOffre(o: DevisDto) {
  const m = o.montants;
  if (!m) return <p className="text-body text-muted-foreground">Aucun détail de montants pour cette offre.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1.5 text-micro font-medium text-muted-foreground">Avant remise</div>
        <FieldGrid>
          <Field label="TVA" value={m.tvaRatio == null ? undefined : formatPercent(m.tvaRatio, 0)} />
          <Field label="Prix m² HT" value={montant(m.prixM2HT)} />
          <Field label="Prix m² TTC" value={montant(m.prixM2TTC)} />
          <Field label="Article HT" value={montant(m.prixArticleHT)} />
          <Field label="Article TTC" value={montant(m.prixArticleTTC)} />
          <Field label="Sous-articles HT" value={montant(m.prixSousArticlesHT)} />
          <Field label="Sous-articles TTC" value={montant(m.prixSousArticlesTTC)} />
          <Field label="Total HT" value={montant(m.totalHT)} />
          <Field label="Total TTC" value={montant(m.totalTTC)} />
        </FieldGrid>
      </div>

      {(m.remisePercent ?? 0) > 0 && (
        <div>
          <div className="mb-1.5 text-micro font-medium text-muted-foreground">Remise</div>
          <FieldGrid>
            <Field label="Taux" value={m.remisePercent == null ? undefined : formatPercentValue(m.remisePercent)} />
            <Field label="Remise HT" value={montant(m.remiseHT)} />
            <Field label="Remise TTC" value={montant(m.remiseTTC)} />
            <Field label="Prix m² après remise HT" value={montant(m.prixM2ApresRemiseHT)} />
            <Field label="Prix m² après remise TTC" value={montant(m.prixM2ApresRemiseTTC)} />
            <Field label="Article après remise HT" value={montant(m.prixArticleApresRemiseHT)} />
            <Field label="Article après remise TTC" value={montant(m.prixArticleApresRemiseTTC)} />
            <Field label="Sous-articles après remise HT" value={montant(m.prixSousArticlesApresRemiseHT)} />
            <Field label="Sous-articles après remise TTC" value={montant(m.prixSousArticlesApresRemiseTTC)} />
          </FieldGrid>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-2.5">
        <span className="text-micro font-medium text-muted-foreground">Prix de vente final</span>
        <span className="text-label font-semibold text-foreground">HT {montant(m.prixVenteHT) ?? '-'}</span>
        <span className="text-label font-semibold text-foreground">TTC {montant(m.prixVenteTTC) ?? '-'}</span>
      </div>

      {o.notes && <p className="whitespace-pre-wrap text-body text-foreground">{o.notes}</p>}
    </div>
  );
}

type ColonneOffre = ColonneGrille<DevisDto> & { groupe: GroupeColonne; masqueeParDefaut?: boolean };

function colonneMontant(
  nom: string,
  libelle: string,
  valeur: (o: DevisDto) => number | undefined,
  masqueeParDefaut = true,
): ColonneOffre {
  return { nom, libelle, type: 'MONTANT', largeur: 10, classe: 'text-muted-foreground', valeur, groupe: 'PRIX', masqueeParDefaut };
}

/** Colonnes de `/offres` : celles de la grille OMRAN « Offres vente » (`QuoteList.cs`), montants hors défaut sauf
 * Surface et Prix m² TTC. Toutes viennent de `DevisDto` : le sélecteur ne change pas la requête. */
export const COLONNES_OFFRES: ColonneOffre[] = [
  {
    nom: 'code',
    libelle: 'Code',
    largeur: 8,
    groupe: 'IDENTITE',
    titre: (o) => o.code,
    rendu: (o) => (
      <Link to={`/offres/${o.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
        <Badge tone="progress" className="font-mono">{o.code ?? '-'}</Badge>
      </Link>
    ),
  },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7, classe: 'text-muted-foreground', groupe: 'IDENTITE' },
  {
    nom: 'trancheDescription',
    libelle: 'Tranche',
    largeur: 13,
    groupe: 'PATRIMOINE',
    valeur: (o) => o.trancheDescription || o.tranche,
    titre: (o) => o.trancheDescription || o.tranche,
    rendu: (o) =>
      o.trancheDescription || o.tranche ? <Badge tone="neutral">{o.trancheDescription || o.tranche}</Badge> : TIRET_MUET,
  },
  {
    nom: 'articleDescription',
    libelle: 'Article',
    largeur: 6,
    classe: 'text-muted-foreground',
    groupe: 'ARTICLE',
    valeur: (o) => o.articleDescription || o.article,
  },
  {
    nom: 'articleSuperficie',
    libelle: 'Surface',
    type: 'NOMBRE',
    largeur: 7,
    classe: 'tabular-nums text-muted-foreground',
    groupe: 'ARTICLE',
    sansSomme: true,
    rendu: (o) => (o.articleSuperficie == null ? TIRET_MUET : formatSurface(o.articleSuperficie)),
  },
  { nom: 'commercial', libelle: 'Commercial', largeur: 11, classe: 'text-muted-foreground', groupe: 'ACTEURS', titre: (o) => o.commercial },
  { nom: 'prospect', libelle: 'Prospect', largeur: 11, classe: 'font-medium text-foreground', groupe: 'ACTEURS', titre: (o) => o.prospect },
  {
    nom: 'prospectionCode',
    libelle: 'Prospection',
    largeur: 8,
    groupe: 'IDENTITE',
    rendu: (o) => (o.prospectionCode ? <Badge tone="info">{o.prospectionCode}</Badge> : TIRET_MUET),
  },
  { nom: 'modePaiement', libelle: 'Mode de paiement', largeur: 10, classe: 'text-muted-foreground', groupe: 'FINANCIER' },
  colonneMontant('prixM2HT', 'Prix m² HT', (o) => o.montants?.prixM2HT),
  colonneMontant('prixM2TTC', 'Prix m² TTC', (o) => o.montants?.prixM2TTC, false),
  colonneMontant('prixArticleHT', 'Article HT', (o) => o.montants?.prixArticleHT),
  colonneMontant('prixArticleTTC', 'Article TTC', (o) => o.montants?.prixArticleTTC),
  colonneMontant('prixSousArticlesHT', 'Sous-articles HT', (o) => o.montants?.prixSousArticlesHT),
  colonneMontant('prixSousArticlesTTC', 'Sous-articles TTC', (o) => o.montants?.prixSousArticlesTTC),
  colonneMontant('totalHT', 'Avant remise HT', (o) => o.montants?.totalHT),
  colonneMontant('totalTTC', 'Avant remise TTC', (o) => o.montants?.totalTTC),
  colonneMontant('remiseTTC', 'Remise (montant TTC)', (o) => o.montants?.remiseTTC),
  {
    nom: 'remisePercent',
    libelle: 'Remise',
    type: 'NOMBRE',
    largeur: 6,
    groupe: 'PRIX',
    sansSomme: true,
    // La remise vit dans `montants`, pas à la racine : sans `valeur` tri et filtre seraient inertes.
    valeur: (o) => o.montants?.remisePercent ?? 0,
    rendu: (o) =>
      (o.montants?.remisePercent ?? 0) > 0 ? (
        <Badge tone="amber">{formatPercentValue(o.montants?.remisePercent)}</Badge>
      ) : (
        <span className="text-muted-foreground">0 %</span>
      ),
  },
  colonneMontant('prixVenteHT', 'Après remise HT', (o) => o.montants?.prixVenteHT),
  {
    nom: 'prixVenteTTC',
    libelle: 'Prix TTC après remise',
    type: 'MONTANT',
    largeur: 12,
    classe: 'font-semibold text-(--success)',
    groupe: 'PRIX',
    valeur: (o) => o.montants?.prixVenteTTC,
  },
  { nom: 'creePar', libelle: 'Créé par', largeur: 10, classe: 'text-muted-foreground', groupe: 'AUDIT', masqueeParDefaut: true },
  {
    nom: 'fiche',
    libelle: 'Fiche',
    largeur: 9,
    groupe: 'IDENTITE',
    rendu: (o) => <FicheOffreActions offre={o} />,
  },
];

/** Catalogue local du sélecteur : `/api/devis` n'a pas de `?colonnes=`, chaque ligne porte déjà tout. */
export const CATALOGUE_OFFRES: ColonneDto[] = COLONNES_OFFRES.map((c) => ({
  nom: c.nom,
  libelle: c.libelle,
  groupe: c.groupe,
  type: c.type ?? 'TEXTE',
  parDefaut: !c.masqueeParDefaut,
  groupable: false,
  agregeable: false,
}));

export const DISPOSITION_OFFRES: DispositionColonnes = {
  ordre: COLONNES_OFFRES.map((c) => c.nom),
  poids: Object.fromEntries(COLONNES_OFFRES.map((c) => [c.nom, c.largeur ?? 10])),
};

function memesIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const triA = [...a].sort((x, y) => x.localeCompare(y));
  const triB = [...b].sort((x, y) => x.localeCompare(y));
  return triA.every((v, i) => v === triB[i]);
}

/**
 * Valeurs de la modale « Modifier » : l'article et les sous-articles actuels sont fournis tels quels, car le
 * référentiel ne renvoie que les articles libres et l'article d'une offre est souvent occupé (par son dossier).
 */
export function valeursEditionOffre(fiche: FicheDevisDto): ValeursEditionDevis {
  const o = fiche.offre;
  const sousArticles = fiche.sousArticles.flatMap((s) =>
    s.articleId ? [{ id: s.articleId, code: s.code, description: s.description, area: s.superficie }] : [],
  );
  return {
    sousArticleIds: sousArticles.map((s) => s.id),
    remisePercent: o.montants?.remisePercent,
    modePaiementId: o.modePaiementId,
    notes: o.notes,
    article: o.articleId
      ? {
          id: o.articleId,
          code: o.article,
          description: o.articleDescription,
          area: o.articleSuperficie,
          categorieLibelle: o.articleCategorie,
          typeLibelle: o.articleType,
        }
      : undefined,
    sousArticles,
  };
}

/** Corps du `PATCH` : seulement ce que le formulaire a changé, pour que le serveur ne recalcule pas un prix qu'on
 * n'a pas touché. Le formulaire envoie `undefined` pour un champ vidé : notes vides = effacer. */
export function modificationOffre(fiche: FicheDevisDto, saisie: CreerDevisRequest): ModifierDevisRequest {
  const o = fiche.offre;
  const corps: ModifierDevisRequest = {};
  if (saisie.trancheId && saisie.trancheId !== o.trancheId) corps.trancheId = saisie.trancheId;
  if (saisie.articleId && saisie.articleId !== o.articleId) corps.articleId = saisie.articleId;
  const sousArticles = saisie.sousArticleIds ?? [];
  const actuels = fiche.sousArticles.map((s) => s.articleId).filter((id): id is string => !!id);
  if (!memesIds(sousArticles, actuels)) corps.sousArticleIds = sousArticles;
  if (saisie.prix != null) corps.prix = saisie.prix;
  const remise = saisie.remisePercent ?? 0;
  if (remise !== (o.montants?.remisePercent ?? 0)) corps.remisePercent = remise;
  if (saisie.modePaiementId && saisie.modePaiementId !== o.modePaiementId) corps.modePaiementId = saisie.modePaiementId;
  const notes = saisie.notes ?? '';
  if (notes !== (o.notes ?? '')) corps.notes = notes;
  return corps;
}
