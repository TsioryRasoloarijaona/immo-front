import { Play } from 'lucide-react';
import { arrondi, construire, date, decaler, montant, nombre, pct, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { FOURNISSEURS } from '../../../components/maquette/communes';
import type { ConfigBord, ConfigEcran, Ligne, OngletStatique } from '../../../components/maquette/types';
import { formatCurrency } from '../../../lib/format';
import { LOTS_DEF, montantMarche } from '../../projet/maquette/calcul';
import { AFFECTATIONS, AUJOURDHUI, DOCUMENTS, REGLEMENTS } from './donnees';

const somme = (lignes: Ligne[], nom: string): number => arrondi(lignes.reduce((s, l) => s + Number(l[nom]), 0));
const factures = DOCUMENTS.filter((d) => d.type === 'FACTURE' && d.statut !== 'ANNULATION');
const joursEcoules = (depuis: string): number => Math.floor((Date.parse(AUJOURDHUI) - Date.parse(depuis)) / 86_400_000);

export const configReglements: ConfigEcran = configListe({
  titre: 'Règlements',
  unite: 'règlement',
  nature: 'Règlement',
  recherche: 'N°, fournisseur, banque…',
  colonnes: [texte('numero', 'N°', 13), date('date', 'Date'), texte('fournisseur', 'Fournisseur', 18), texte('type', 'Mode', 10), texte('banque', 'Banque', 22), montant('montant', 'Montant'), texte('statut', 'Statut', 10)],
  lignes: REGLEMENTS,
  filtres: ['type', 'banque', 'statut', 'fournisseur'],
  colonneDate: 'date',
  titreFiche: (l) => `Règlement ${l.numero}`,
  onglets: (l) => [
    {
      id: 'affectations',
      libelle: 'Affectation aux factures',
      colonnes: [texte('facture', 'Facture', 14), texte('fournisseur', 'Fournisseur', 18), montant('ttc', 'Montant TTC'), montant('montant', 'Montant affecté')],
      lignes: AFFECTATIONS.filter((a) => a.reglement === l.numero).map((a) => {
        const f = DOCUMENTS.find((d) => d.numero === a.facture) as Ligne;
        return { id: a.id, facture: a.facture, fournisseur: f.fournisseur, ttc: f.ttc, montant: a.montant };
      }),
    },
  ],
});

const PRETS = construire(
  ['numero', 'type', 'banque', 'date', 'montant', 'taux', 'duree'],
  [
    ['PR-2024-01', "Crédit d'investissement", 'Banque Atlantique du Maroc', '2024-09-15', 3000000, 0.058, 48],
    ['PR-2025-02', 'Crédit de trésorerie', 'Banque Centrale Populaire', '2025-11-03', 1200000, 0.052, 12],
  ],
);

const payees = (p: Ligne): number => Math.min(Number(p.duree), Math.max(0, Math.floor(joursEcoules(String(p.date)) / 30)));

export const configPrets: ConfigEcran = configListe({
  titre: 'Gestion des prêts',
  unite: 'prêt',
  nature: 'Prêt',
  colonnes: [
    texte('numero', 'N°', 12), texte('type', 'Type de crédit', 20), texte('banque', 'Banque', 22), date('date', 'Déblocage'), montant('montant', 'Montant'), pct('taux', 'Taux annuel', 8), nombre('duree', 'Durée (mois)', 8), montant('solde', 'Capital restant dû'),
  ],
  lignes: PRETS.map((p) => ({ ...p, solde: arrondi(Number(p.montant) - payees(p) * (Number(p.montant) / Number(p.duree))) })),
  filtres: ['type', 'banque'],
});

const ECHEANCES: Ligne[] = PRETS.flatMap((p) => {
  const capital = arrondi(Number(p.montant) / Number(p.duree));
  const debut = Math.max(1, payees(p) - 1);
  return [0, 1, 2, 3].map((k) => {
    const rang = debut + k;
    const interets = arrondi((Number(p.montant) - capital * (rang - 1)) * (Number(p.taux) / 12));
    const jour = decaler(String(p.date), 30 * rang);
    return { id: `${p.numero}-${rang}`, pret: p.numero, rang, date: jour, capital, interets, total: arrondi(capital + interets), statut: jour <= AUJOURDHUI ? 'Payée' : 'À venir' };
  });
});

export const configEcheances: ConfigEcran = configListe({
  titre: 'Échéances crédits',
  unite: 'échéance',
  nature: 'Échéance de crédit',
  colonnes: [texte('pret', 'Prêt', 12), nombre('rang', 'N°', 5), date('date', 'Date'), montant('capital', 'Capital'), montant('interets', 'Intérêts'), montant('total', 'Échéance'), texte('statut', 'Statut', 10)],
  lignes: ECHEANCES,
  filtres: ['pret', 'statut'],
  colonneDate: 'date',
  titreFiche: (l) => `Échéance ${l.rang} — ${l.pret}`,
  outils: ['imprimer', 'exporter', 'rafraichir'],
});

const SOLDES: Ligne[] = FOURNISSEURS.map((f, i) => {
  const siennes = factures.filter((d) => d.fournisseur === f);
  const avoirs = DOCUMENTS.filter((d) => d.type === 'AVOIR' && d.fournisseur === f && d.statut !== 'ANNULATION');
  return {
    id: String(i + 1),
    fournisseur: f,
    nb: siennes.length,
    facture: somme(siennes, 'ttc'),
    regle: somme(siennes, 'regle'),
    avoirs: somme(avoirs, 'ttc'),
    solde: arrondi(somme(siennes, 'reste') - somme(avoirs, 'ttc')),
  };
}).filter((s) => Number(s.nb) > 0);

export const configSoldes: ConfigEcran = configListe({
  titre: 'Solde fournisseurs',
  unite: 'fournisseur',
  nature: 'Solde fournisseur',
  recherche: 'Fournisseur…',
  colonnes: [texte('fournisseur', 'Fournisseur', 22), nombre('nb', 'Factures', 7), montant('facture', 'Facturé TTC'), montant('regle', 'Réglé'), montant('avoirs', 'Avoirs'), montant('solde', 'Solde dû')],
  lignes: SOLDES,
  titreFiche: (l) => `Solde de ${l.fournisseur}`,
  outils: ['imprimer', 'exporter', 'rafraichir'],
  onglets: (l) => [
    {
      id: 'factures',
      libelle: 'Factures du fournisseur',
      colonnes: [texte('numero', 'Facture', 13), date('date', 'Date'), montant('ttc', 'Montant TTC'), montant('regle', 'Réglé'), montant('reste', 'Reste à payer'), texte('statut', 'Statut', 14)],
      lignes: factures.filter((d) => d.fournisseur === l.fournisseur),
    },
  ],
});

const COMPTABILISEES = factures.filter((d) => d.statut === 'VALIDE POUR PAIEMENT' || d.statut === 'CLOTURÉ');
const parMois = [...new Set(COMPTABILISEES.map((d) => String(d.date).slice(0, 7)))].sort((a, b) => a.localeCompare(b));

export const bordTva: ConfigBord = {
  titre: 'État de la TVA déductible',
  cartes: [
    { libelle: 'TVA déductible', valeur: formatCurrency(somme(COMPTABILISEES, 'tva')), tone: 'success' },
    { libelle: 'Factures comptabilisées', valeur: String(COMPTABILISEES.length) },
    { libelle: 'TVA en attente de validation', valeur: formatCurrency(somme(factures.filter((d) => !COMPTABILISEES.includes(d)), 'tva')), tone: 'amber' },
  ],
  sections: [
    {
      titre: 'TVA déductible par mois',
      colonnes: [date('mois', 'Mois'), nombre('nb', 'Factures'), montant('ht', 'Base HT'), montant('tva', 'TVA déductible')],
      lignes: parMois.map((m, i) => {
        const du = COMPTABILISEES.filter((d) => String(d.date).startsWith(m));
        return { id: String(i + 1), mois: `${m}-01`, nb: du.length, ht: somme(du, 'ht'), tva: somme(du, 'tva') };
      }),
    },
  ],
};

export const bordRs: ConfigBord = {
  titre: 'État de la RS',
  cartes: [
    { libelle: 'Retenues à la source', valeur: formatCurrency(0) },
    { libelle: 'Règlements fournisseurs concernés', valeur: '0', sous: `sur ${REGLEMENTS.length} règlements` },
  ],
  sections: [{ titre: 'Fiches de RS', colonnes: [texte('fiche', 'Fiche RS', 14), date('date', 'Date'), texte('fournisseur', 'Fournisseur', 20), montant('montant', 'Montant RS')], lignes: [] }],
};

export const configRapportsAchat: ConfigEcran = configListe({
  titre: 'Rapports',
  unite: 'rapport',
  nature: 'Rapport',
  colonnes: [texte('code', 'Code', 10), texte('titre', 'Rapport', 28), texte('famille', 'Famille', 14), date('dernier', 'Dernier lancement')],
  lignes: construire(
    ['code', 'titre', 'famille', 'dernier'],
    [['R-ACH-01', 'Suivi des dépenses par projet', 'Dépenses', '2026-10-31'], ['R-ACH-02', 'Retenues de garantie des fournisseurs', 'Retenues', '2026-09-30'], ['R-ACH-03', 'Échéancier des paiements', 'Trésorerie', '2026-10-20']],
  ),
  filtres: ['famille'],
  outils: ['imprimer', 'exporter', 'rafraichir'],
  actionLigne: { id: 'lancer', libelle: 'Lancer', icone: Play },
});

const CONSULTATIONS = ['LOT-04', 'LOT-05', 'LOT-06', 'LOT-07'].map((code, i) => {
  const lot = LOTS_DEF.find((d) => d.code === code) as (typeof LOTS_DEF)[number];
  const offres = DOCUMENTS.filter((d) => d.type === 'DEVIS' && d.lot === code);
  return {
    ligne: { id: String(i + 1), numero: `CS-2026-0${i + 1}`, date: decaler(lot.debut, -75), objet: lot.libelle, projet: lot.projet, lot: code, type: i % 2 === 0 ? "Appel d'offres ouvert" : 'Consultation restreinte', offres: offres.length, statut: lot.statut === 'ADJUDICATION' || lot.statut === 'Commandes' ? 'TERMINÉ' : 'EN COURS' } satisfies Ligne,
    lot,
    offres,
  };
});

function ongletsConsultation(l: Ligne): OngletStatique[] {
  const c = CONSULTATIONS.find((x) => x.ligne.id === l.id);
  if (!c) return [];
  const colBord = [texte('code', 'Code', 8), texte('designation', 'Désignation', 24), texte('unite', 'Unité', 6), nombre('qte', 'Quantité'), montant('pu', 'PU HT')];
  const bord = (coef: number): Ligne[] => c.lot.lignes.map((b) => ({ id: b.code, code: b.code, designation: b.designation, unite: b.unite, qte: b.qte, pu: arrondi(b.pu * coef) }));
  const echelle = montantMarche(c.lot);
  return [
    { id: 'estimatif', libelle: 'Bordereau estimatif', colonnes: colBord, lignes: bord(1.04) },
    {
      id: 'appel',
      libelle: "Appel d'offre",
      colonnes: [texte('etape', 'Étape', 24), date('date', 'Date')],
      lignes: [["Lancement de l'appel d'offre", -75], ['Remise des offres', -50], ['Ouverture des plis', -46]].map(([etape, jours], k) => ({ id: String(k), etape: String(etape), date: decaler(c.lot.debut, Number(jours)) })),
    },
    { id: 'offres', libelle: 'Offres des entreprises', colonnes: [texte('numero', 'Devis', 12), texte('fournisseur', 'Entreprise', 20), date('date', 'Date'), montant('ht', 'Offre HT')], lignes: c.offres },
    { id: 'definitif', libelle: 'Bordereau définitif', colonnes: colBord, lignes: bord(1) },
    {
      id: 'comparatif',
      libelle: 'Comparatif des offres',
      colonnes: [texte('code', 'Code', 8), texte('designation', 'Désignation', 22), ...c.offres.map((o, k) => montant(`o${k}`, String(o.fournisseur)))],
      lignes: c.lot.lignes.map((b) => ({ id: b.code, code: b.code, designation: b.designation, ...Object.fromEntries(c.offres.map((o, k) => [`o${k}`, arrondi(b.pu * (Number(o.ht) / echelle))])) })),
    },
  ];
}

export const configConsultations: ConfigEcran = configListe({
  titre: 'Consultations',
  unite: 'consultation',
  nature: 'Consultation',
  colonnes: [
    texte('numero', 'N°', 11), date('date', 'Date'), texte('objet', 'Objet', 24), texte('projet', 'Projet', 9), texte('lot', 'Lot', 8), texte('type', 'Type de consultation', 20), nombre('offres', 'Offres', 7), texte('statut', 'Statut', 10),
  ],
  lignes: CONSULTATIONS.map((c) => c.ligne),
  filtres: ['projet', 'type', 'statut'],
  colonneDate: 'date',
  titreFiche: (l) => `Consultation ${l.numero}`,
  onglets: ongletsConsultation,
});
