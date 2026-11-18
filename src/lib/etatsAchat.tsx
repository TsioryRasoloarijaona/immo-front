import { useState } from 'react';
import type { ColonneGrille } from '../components/DataGrid';
import { Badge } from '../components/ui';
import { getSuiviAvances, getSuiviRetenues, type EtatAchat } from './apiEtatsAchat';
import { formatDate, formatPercentValue } from './format';
import { cleFiltresFermes, useBooleenMemorise } from './outilsListe';
import { plagePeriode } from './periodes';
import { useDebouncedValue } from './useApi';
import type {
  FiltresEtatsAchat, LigneSuiviAvance, LigneSuiviRetenue, LigneTvaDeductible, MoisTvaDeductible, TotauxSuiviAvances,
  TotauxSuiviRetenues,
} from '../types/etatsAchat';

// « Toutes les dates » vide la période ; le serveur exige des bornes (400 sinon).
const TOUS_DU = '1900-01-01';
const TOUS_AU = '2099-12-31';

/** Filtres communs des états Achat ; période par défaut : l'année en cours. */
export function useFiltresEtatsAchat(cle: string) {
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [societe, setSociete] = useState<string | null>(null);
  const [periode, setPeriode] = useState(() => plagePeriode('annee'));
  const [tiers, setTiers] = useState('');
  const [projet, setProjet] = useState('');
  const [lot, setLot] = useState('');
  const [ferme, basculer] = useBooleenMemorise(cleFiltresFermes(cle));
  const tiersDiffere = useDebouncedValue(tiers.trim());
  const projetDiffere = useDebouncedValue(projet.trim());
  const lotDiffere = useDebouncedValue(lot.trim());

  const filtres: FiltresEtatsAchat = {
    du: periode.debut || TOUS_DU,
    au: periode.fin || TOUS_AU,
    societeId: societe ?? undefined,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    tiers: tiersDiffere || undefined,
    projet: projetDiffere || undefined,
    lot: lotDiffere || undefined,
  };

  function reinitialiser() {
    setProjetIds([]);
    setSociete(null);
    setPeriode(plagePeriode('annee'));
    setTiers('');
    setProjet('');
    setLot('');
  }

  return {
    filtres, projetIds, setProjetIds, societe, setSociete, periode, setPeriode,
    textes: { tiers, setTiers, projet, setProjet, lot, setLot }, ferme, basculer, reinitialiser,
  };
}

export type EtatFiltresAchat = ReturnType<typeof useFiltresEtatsAchat>;

const MONTANT = 'whitespace-nowrap';

/** Ligne annulée : listée, barrée, hors totaux. */
export const classeAnnulee = (r: { annulee: boolean }) => (r.annulee ? 'text-muted-foreground line-through' : undefined);

export type LigneTvaGrille = LigneTvaDeductible & { id: string };
export type MoisTvaGrille = MoisTvaDeductible & { id: string };

const libelleMois = (m: MoisTvaDeductible) => formatDate(m.mois).slice(3);

export const COLONNES_MOIS_TVA: ColonneGrille<MoisTvaGrille>[] = [
  { nom: 'mois', libelle: 'Mois', largeur: 8, valeur: libelleMois, rendu: libelleMois },
  { nom: 'factures', libelle: 'Factures', type: 'NOMBRE', largeur: 6 },
  { nom: 'montantHT', libelle: 'Base HT', type: 'MONTANT', largeur: 10, classe: MONTANT },
  { nom: 'montantTva', libelle: 'TVA déductible', type: 'MONTANT', largeur: 10, classe: MONTANT },
];

const montantHorsAnnulee = <T extends { annulee: boolean }>(champ: (r: T) => number) => (r: T) => (r.annulee ? null : champ(r));

export const COLONNES_LIGNES_TVA: ColonneGrille<LigneTvaGrille>[] = [
  { nom: 'factureCode', libelle: 'Facture', largeur: 9, classe: 'font-medium text-foreground' },
  { nom: 'dateFacture', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'fournisseur', libelle: 'Fournisseur', largeur: 14 },
  {
    nom: 'description',
    libelle: 'Description',
    largeur: 18,
    rendu: (l) => (
      <span className="flex items-center gap-1.5">
        {l.sansLignes && <Badge tone="amber">Sans lignes</Badge>}
        {l.annulee && <Badge tone="warning">Annulée</Badge>}
        {l.description ?? '—'}
      </span>
    ),
  },
  { nom: 'montantHT', libelle: 'Montant HT', type: 'MONTANT', largeur: 10, classe: MONTANT, valeurSomme: montantHorsAnnulee((l) => l.montantHT) },
  { nom: 'tauxTvaPct', libelle: 'TVA %', type: 'NOMBRE', largeur: 5, sansSomme: true, valeur: (l) => l.tauxTvaPct, rendu: (l) => formatPercentValue(l.tauxTvaPct) },
  { nom: 'montantTva', libelle: 'Montant TVA', type: 'MONTANT', largeur: 10, classe: MONTANT, valeurSomme: montantHorsAnnulee((l) => l.montantTva) },
];

type PieceSuivi = LigneSuiviAvance | LigneSuiviRetenue;

/** Les trois montants d'un suivi, dans l'ordre des colonnes OMRAN ; les totaux viennent du serveur. */
export interface ConfigSuiviAchat<L extends PieceSuivi, T> {
  titre: string;
  etat: EtatAchat;
  charger: (f: FiltresEtatsAchat) => Promise<{ lignes: L[]; totaux: T }>;
  montants: { nom: string; libelle: string; ligne: (r: L) => number; total: (t: T) => number }[];
}

export const SUIVI_AVANCES: ConfigSuiviAchat<LigneSuiviAvance, TotauxSuiviAvances> = {
  titre: 'Suivi des avances',
  etat: 'avances',
  charger: getSuiviAvances,
  montants: [
    { nom: 'avance', libelle: 'Avance', ligne: (r) => r.avance, total: (t) => t.avance },
    { nom: 'ajustement', libelle: 'Ajustement', ligne: (r) => r.ajustement, total: (t) => t.ajustement },
    { nom: 'amortissement', libelle: 'Amortissement', ligne: (r) => r.amortissement, total: (t) => t.amortissement },
  ],
};

export const SUIVI_RETENUES: ConfigSuiviAchat<LigneSuiviRetenue, TotauxSuiviRetenues> = {
  titre: 'Suivi des retenues de garantie',
  etat: 'retenues-garantie',
  charger: getSuiviRetenues,
  montants: [
    { nom: 'retenue', libelle: 'Retenue', ligne: (r) => r.retenue, total: (t) => t.retenue },
    { nom: 'penalite', libelle: 'Pénalité', ligne: (r) => r.penalite, total: (t) => t.penalite },
    { nom: 'rembourse', libelle: 'Remboursé', ligne: (r) => r.rembourse, total: (t) => t.rembourse },
  ],
};

export function colonnesSuivi<L extends PieceSuivi, T>(config: ConfigSuiviAchat<L, T>): ColonneGrille<L & { id: string }>[] {
  return [
    { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 7 },
    { nom: 'code', libelle: 'Code', largeur: 9, classe: 'font-medium text-foreground' },
    { nom: 'description', libelle: 'Description', largeur: 16 },
    { nom: 'nature', libelle: 'Entité fonctionnelle', largeur: 12 },
    ...config.montants.map(({ nom, libelle, ligne }): ColonneGrille<L & { id: string }> => ({
      nom,
      libelle,
      type: 'MONTANT',
      largeur: 9,
      classe: MONTANT,
      valeurSomme: montantHorsAnnulee(ligne),
    })),
    { nom: 'fournisseur', libelle: 'Tier', largeur: 12 },
    { nom: 'projet', libelle: 'Projet', largeur: 9 },
    { nom: 'societe', libelle: 'Entité', largeur: 7 },
    { nom: 'lot', libelle: 'Lot', largeur: 7 },
    { nom: 'statut', libelle: 'Statut', largeur: 9 },
  ];
}
