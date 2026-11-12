import type { AgregatsBonCommandeDto, NatureDocumentAchat } from '../types/achat';

/** Colonnes agrégées d'un BC : la clé est le nom wire de `agregats` (et la clé de tri serveur). */
export type CleAgregatAchat = Exclude<keyof AgregatsBonCommandeDto, 'factureTVA'>;

export type CleColonneAchat =
  | 'aCloturer' | 'statut' | 'code' | 'dateAlerte' | 'dateDocument' | 'dateEcheance' | 'societeNom' | 'moduleLibelle'
  | 'fournisseurNom' | 'personneAContacter' | 'typeLotLibelle' | 'reference' | 'referenceBureauOrdre' | 'categories'
  | 'montantHT' | 'montantTVA' | 'montantTTC' | 'montantAPayer' | 'montantRegle' | 'resteARegler' | 'deviseCode'
  | 'projetCode' | 'lotCode' | 'dossierGroupement' | 'archive' | 'description' | CleAgregatAchat;

/** Un écran de pièces d'achat : natures forcées, colonnes (ordre OMRAN), filtres visibles et ligne de totaux. */
export interface VueAchat {
  cle: string;
  titre: string;
  chemin: string;
  /** Absent : les natures viennent de l'URL ou des cases de nature. */
  natures?: NatureDocumentAchat[];
  filtres: { statut: boolean; nature: boolean; projet: boolean; lot: boolean };
  totaux: 'devis' | 'depenses' | 'simple' | 'commande';
  colonnes: CleColonneAchat[];
  /** Colonnes de `colonnes` décochées à l'ouverture (cochables dans le sélecteur). */
  masquees?: CleColonneAchat[];
}

const DEPENSES_COLONNES: CleColonneAchat[] = [
  'statut', 'code', 'dateDocument', 'dateEcheance', 'dateAlerte', 'fournisseurNom', 'typeLotLibelle', 'categories',
  'montantAPayer', 'montantRegle', 'resteARegler', 'deviseCode', 'projetCode',
];
const DEPENSES = { filtres: { statut: true, nature: false, projet: true, lot: false }, totaux: 'depenses', colonnes: DEPENSES_COLONNES } as const;

export const VUES_ACHAT: VueAchat[] = [
  {
    cle: 'devis',
    titre: 'Devis',
    chemin: '/achat/devis',
    natures: ['QUOTE'],
    filtres: { statut: true, nature: false, projet: false, lot: false },
    totaux: 'devis',
    colonnes: ['code', 'dateDocument', 'societeNom', 'moduleLibelle', 'fournisseurNom', 'typeLotLibelle', 'reference', 'categories', 'montantHT', 'montantTVA', 'montantTTC', 'montantAPayer'],
  },
  {
    cle: 'bons-de-commande',
    titre: 'Bons de commande',
    chemin: '/achat/bons-de-commande',
    natures: ['ORDER'],
    filtres: { statut: true, nature: false, projet: false, lot: false },
    totaux: 'commande',
    colonnes: [
      'aCloturer', 'statut', 'code', 'dateAlerte', 'dateDocument', 'dateEcheance', 'societeNom', 'moduleLibelle', 'fournisseurNom', 'personneAContacter', 'typeLotLibelle', 'reference',
      'factureTTC', 'livreTTC', 'resteALivrerTTC', 'avanceTauxPrevu', 'avanceTauxEffectif', 'avance', 'avanceAmortie', 'avanceResteAAmortir', 'avanceRegle', 'avanceReste',
      'garantieRetenue', 'garantieRestituee', 'garantieReste',
      'factureHT', 'factureNetAPayer', 'livreHT', 'livreNetAPayer', 'resteALivrerHT', 'resteALivrerNetAPayer', 'regle', 'resteAPayerSurFacture', 'resteAPayerTotal',
      'bonsLivraisonCodes', 'facturesCodes', 'devisCode', 'projetCode', 'lotCode', 'dossierGroupement', 'description',
    ],
    masquees: [
      'factureHT', 'factureNetAPayer', 'livreHT', 'livreNetAPayer', 'resteALivrerHT', 'resteALivrerNetAPayer', 'regle', 'resteAPayerSurFacture', 'resteAPayerTotal',
      'bonsLivraisonCodes', 'facturesCodes', 'devisCode', 'projetCode', 'lotCode', 'dossierGroupement', 'description',
    ],
  },
  {
    cle: 'bons-de-livraison',
    titre: 'Bons de livraison',
    chemin: '/achat/bons-de-livraison',
    natures: ['DELIVRY'],
    filtres: { statut: true, nature: false, projet: false, lot: false },
    totaux: 'simple',
    colonnes: ['dateEcheance', 'statut', 'code', 'dateDocument', 'societeNom', 'moduleLibelle', 'fournisseurNom', 'typeLotLibelle', 'reference', 'referenceBureauOrdre', 'categories', 'montantAPayer'],
  },
  {
    cle: 'documents',
    titre: 'Documents Achats',
    chemin: '/achat/documents',
    filtres: { statut: false, nature: true, projet: false, lot: true },
    totaux: 'simple',
    colonnes: ['code', 'dateDocument', 'typeLotLibelle', 'fournisseurNom', 'montantAPayer', 'projetCode', 'lotCode', 'dossierGroupement', 'archive', 'statut', 'moduleLibelle'],
  },
  { cle: 'factures', titre: 'Factures', chemin: '/achat/depenses/factures', natures: ['INVOICE'], ...DEPENSES },
  { cle: 'documents-a-regler', titre: 'Documents à régler', chemin: '/achat/depenses/documents-a-regler', natures: ['DOCUMENT_TO_PAY'], ...DEPENSES },
  { cle: 'avoirs', titre: 'Avoirs', chemin: '/achat/depenses/avoirs', natures: ['REFUND'], ...DEPENSES },
];
