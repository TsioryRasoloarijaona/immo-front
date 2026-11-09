import { Play } from 'lucide-react';
import { arrondi, construire, date, decaler, montant, nombre, pct, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { PROJETS } from '../../../components/maquette/communes';
import type { ConfigBord, ConfigEcran, Ligne } from '../../../components/maquette/types';
import { formatCurrency, formatDate, formatPercent } from '../../../lib/format';
import { DECOMPTES_CALCULES, LOTS_DEF, netAPayer } from './calcul';
import { LOTS } from './ecransLots';

const somme = (lignes: Ligne[], nom: string): number => arrondi(lignes.reduce((s, l) => s + Number(l[nom]), 0));
const netTotal = arrondi(DECOMPTES_CALCULES.reduce((s, d) => s + netAPayer(d), 0));

export const bordBilans: ConfigBord = {
  titre: 'Bilans',
  cartes: [
    { libelle: 'Marchés signés HT', valeur: formatCurrency(somme(LOTS, 'marche')) },
    { libelle: 'Décompté cumulé HT', valeur: formatCurrency(somme(LOTS, 'decompte')), tone: 'progress' },
    { libelle: 'Net à payer cumulé', valeur: formatCurrency(netTotal), sous: `${DECOMPTES_CALCULES.length} décomptes`, tone: 'success' },
    { libelle: 'Reste à décompter HT', valeur: formatCurrency(somme(LOTS, 'reste')), tone: 'amber' },
  ],
  sections: [
    {
      titre: 'Bilan par projet',
      colonnes: [texte('projet', 'Projet', 20), nombre('lots', 'Lots', 6), montant('marche', 'Marchés HT'), montant('decompte', 'Décompté HT'), pct('avancement', '% avancement', 8), montant('reste', 'Reste HT')],
      lignes: PROJETS.map((p, i) => {
        const lots = LOTS.filter((l) => l.projet === p.code);
        const marche = somme(lots, 'marche');
        const decompte = somme(lots, 'decompte');
        return { id: String(i + 1), projet: `${p.code} — ${p.libelle}`, lots: lots.length, marche, decompte, avancement: marche ? decompte / marche : 0, reste: arrondi(marche - decompte) };
      }),
    },
  ],
};

function previsionsParMois(): Ligne[] {
  const parMois = new Map<string, number>();
  for (const lot of LOTS) {
    const def = LOTS_DEF.find((d) => d.code === lot.code);
    if (!def) continue;
    for (const k of [1, 2, 3, 4]) {
      const mois = decaler(def.debut, 30 * k).slice(0, 7);
      parMois.set(mois, arrondi((parMois.get(mois) ?? 0) + Number(lot.marche) / 4));
    }
  }
  let cumul = 0;
  return [...parMois.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mois, prevu], i) => {
    cumul = arrondi(cumul + prevu);
    return { id: String(i + 1), mois: `${mois}-01`, prevu, cumul };
  });
}

const PREVISIONS = previsionsParMois();

export const bordTresorerie: ConfigBord = {
  titre: 'Trésorerie',
  cartes: [
    { libelle: 'Paiements prévus', valeur: formatCurrency(somme(PREVISIONS, 'prevu')) },
    { libelle: 'Réglé sur décomptes', valeur: formatCurrency(netTotal), tone: 'success' },
    { libelle: 'Mois les plus chargés', valeur: formatDate(String(PREVISIONS.reduce((m, l) => (Number(l.prevu) > Number(m.prevu) ? l : m), PREVISIONS[0]).mois)).slice(3), tone: 'amber' },
  ],
  sections: [{ titre: 'Échéancier des paiements prévus', colonnes: [date('mois', 'Mois'), montant('prevu', 'Paiements prévus'), montant('cumul', 'Cumul prévu')], lignes: PREVISIONS }],
};

export const bordSuiviLots: ConfigBord = {
  titre: 'Suivi des lots',
  cartes: [
    { libelle: 'Lots suivis', valeur: String(LOTS.length) },
    { libelle: 'En exécution', valeur: String(LOTS.filter((l) => l.statut === 'EXCECUTION').length), tone: 'progress' },
    { libelle: 'Avancement moyen des lots engagés', valeur: formatPercent(somme(LOTS, 'avancement') / Math.max(1, LOTS.filter((l) => Number(l.avancement) > 0).length), 1), tone: 'success' },
    { libelle: 'Sans fournisseur', valeur: String(LOTS.filter((l) => l.fournisseur === '').length), tone: 'amber' },
  ],
  sections: [
    {
      titre: 'Avancement par lot',
      colonnes: [texte('code', 'Code', 8), texte('libelle', 'Libellé', 22), texte('fournisseur', 'Fournisseur', 18), pct('avancement', '% avancement', 8), montant('reste', 'Reste HT'), texte('statut', 'Statut', 12)],
      lignes: LOTS,
    },
  ],
};

export const configRapports: ConfigEcran = configListe({
  titre: 'Rapports',
  unite: 'rapport',
  nature: 'Rapport',
  colonnes: [texte('code', 'Code', 8), texte('titre', 'Rapport', 26), texte('famille', 'Famille', 14), date('dernier', 'Dernier lancement')],
  lignes: construire(
    ['code', 'titre', 'famille', 'dernier'],
    [
      ['R-001', 'État des marchés', 'Marchés', '2026-10-30'], ['R-002', 'Situation des décomptes par lot', 'Décomptes', '2026-10-28'], ['R-003', 'Retenues de garantie', 'Décomptes', '2026-09-30'],
      ['R-004', 'Échéancier de paiement des lots', 'Trésorerie', '2026-10-15'], ['R-005', 'Récapitulatif des réunions de chantier', 'Chantier', '2026-09-12'],
    ],
  ),
  filtres: ['famille'],
  outils: ['imprimer', 'exporter', 'rafraichir'],
  actionLigne: { id: 'lancer', libelle: 'Lancer', icone: Play },
});
