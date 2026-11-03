import type { ColonneGrille } from '../components/DataGrid';
import { encaissementEtatLabel } from './domain';
import type { FamilleTiers } from '../types/administration';
import type { LienOngletTiersDto, LigneOngletTiers, OngletTiers } from '../types/tiersOnglets';

type Colonne = ColonneGrille<LigneOngletTiers>;

const c = (nom: string, libelle: string, type: Colonne['type'] = 'TEXTE', largeur?: number): Colonne => ({ nom, libelle, type, largeur });

const DATE = c('date', 'Date', 'DATE');
const CODE = c('code', 'Code', 'TEXTE', 10);
const DESCRIPTION = c('description', 'Description', 'TEXTE', 24);
const STATUT = c('statut', 'Statut');
const ARTICLE = c('article', 'Article');
const TRANCHE = c('tranche', 'Tranche');
const NOTES = c('notes', 'Notes', 'TEXTE', 24);
const ECHEANCE = c('echeance', 'Échéance', 'DATE');
const A_PAYER = c('aPayer', 'À payer', 'MONTANT');
const DOSSIER = c('dossierCode', 'Dossier');

export interface DefinitionOnglet {
  id: OngletTiers;
  libelle: string;
  aucun: string;
  colonnes: Colonne[];
}

/** Onglets de lecture d'OMRAN (`TierControl`), dans l'ordre de la fiche ; Congés pour les personnels seuls. */
const ONGLETS: DefinitionOnglet[] = [
  {
    id: 'prospections', libelle: 'Prospections', aucun: 'Aucune prospection',
    colonnes: [CODE, DATE, c('vocation', 'Vocation'), TRANCHE, c('nature', 'Nature'), ARTICLE, c('action', 'Action'),
      c('supportOrigine', "Support d'origine"), DOSSIER, c('archivee', 'Archivée', 'BOOLEEN'), NOTES],
  },
  {
    id: 'dossiers', libelle: 'Dossiers', aucun: 'Aucun dossier',
    colonnes: [c('nature', 'Nature'), CODE, DESCRIPTION, DATE, STATUT, TRANCHE, ARTICLE, c('categorie', 'Catégorie'),
      c('type', 'Type'), c('total', 'Total', 'MONTANT')],
  },
  {
    id: 'recettes', libelle: 'Recettes', aucun: 'Aucune recette',
    colonnes: [CODE, DESCRIPTION, DATE, ECHEANCE, c('reference', 'Référence'), A_PAYER, NOTES],
  },
  {
    id: 'depenses', libelle: 'Dépenses', aucun: 'Aucune dépense',
    colonnes: [CODE, DESCRIPTION, DATE, ECHEANCE, c('societe', 'Société'), STATUT, c('montantHt', 'Montant HT', 'MONTANT'),
      c('montantTva', 'TVA', 'MONTANT'), c('montantTtc', 'Montant TTC', 'MONTANT'), A_PAYER, NOTES],
  },
  {
    id: 'reglements', libelle: 'Règlements', aucun: 'Aucun règlement',
    colonnes: [DATE, c('reference', 'Référence', 'TEXTE', 10), c('libelle', 'Libellé', 'TEXTE', 24),
      c('montant', 'Montant', 'MONTANT'), c('mode', 'Mode'),
      { ...STATUT, valeur: (l) => encaissementEtatLabel('statut' in l ? (l.statut ?? undefined) : undefined) },
      c('credit', 'Encaissement', 'BOOLEEN')],
  },
  {
    id: 'conges', libelle: 'Congés', aucun: 'Aucun congé',
    colonnes: [CODE, c('type', 'Type de congé'), c('du', 'Du', 'DATE'), c('au', 'Au', 'DATE'), c('jours', 'Jours', 'NOMBRE'),
      STATUT, NOTES],
  },
  {
    id: 'historique', libelle: 'Historique', aucun: 'Aucun historique',
    colonnes: [DATE, STATUT, ARTICLE, c('detail', 'Détail', 'TEXTE', 24), DOSSIER, c('utilisateur', 'Utilisateur')],
  },
];

/** Banques et organismes : aucun onglet de lecture (comme OMRAN). */
export function ongletsLecture(famille: FamilleTiers): DefinitionOnglet[] {
  if (famille === 'banques' || famille === 'organismes') return [];
  return ONGLETS.filter((o) => o.id !== 'conges' || famille === 'personnels');
}

const CHEMINS: Record<LienOngletTiersDto['ecran'], string> = {
  dossier: '/dossiers',
  prospection: '/prospections',
  encaissement: '/encaissements',
};

/** Écran Arpent ouvert par la ligne, `null` sans lien. */
export function cheminLien(ligne: LigneOngletTiers): string | null {
  const lien = 'lien' in ligne ? ligne.lien : null;
  return lien ? `${CHEMINS[lien.ecran]}/${lien.id}` : null;
}
