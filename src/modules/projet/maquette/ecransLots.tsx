import { FilePlus2, Layers } from 'lucide-react';
import { arrondi, date, decaler, montant, nombre, pct, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { FOURNISSEURS } from '../../../components/maquette/communes';
import TableauRecap from '../../../components/maquette/TableauRecap';
import type { ConfigEcran, Ligne, OngletStatique } from '../../../components/maquette/types';
import { DECOMPTES_CALCULES, LOTS_DEF, TAUX, lignesDecompte, montantMarche, netAPayer, recapDecompte, type DecompteCalcule, type DefLot } from './calcul';

const periode = (c: number, p: number): number => arrondi(c - p);

const ligneDecompte = (d: DecompteCalcule): Ligne => ({
  id: d.id,
  numero: d.numero,
  date: d.saisie.date,
  lot: d.lot.code,
  fournisseur: d.lot.fournisseur,
  cumulHT: d.cumul.ht,
  precedentHT: d.precedent.ht,
  periodeHT: periode(d.cumul.ht, d.precedent.ht),
  tva: periode(d.cumul.tva, d.precedent.tva),
  ttc: periode(d.cumul.ttc, d.precedent.ttc),
  avance: periode(d.cumul.avance, d.precedent.avance),
  garantie: periode(d.cumul.garantie, d.precedent.garantie),
  revision: periode(d.cumul.revision, d.precedent.revision),
  net: netAPayer(d),
  facture: d.saisie.facture,
  statut: d.saisie.statut,
});

export const DECOMPTES: Ligne[] = DECOMPTES_CALCULES.map(ligneDecompte);

export const LOTS: Ligne[] = LOTS_DEF.map((d, i) => {
  const marche = montantMarche(d);
  const cumule = DECOMPTES_CALCULES.filter((x) => x.lot === d).at(-1)?.cumul.ht ?? 0;
  return {
    id: String(i + 1),
    code: d.code,
    libelle: d.libelle,
    projet: d.projet,
    tranche: d.tranche,
    type: d.type,
    fournisseur: d.fournisseur,
    estime: arrondi(marche * 1.04),
    marche,
    decompte: cumule,
    avancement: marche ? cumule / marche : 0,
    reste: arrondi(marche - cumule),
    statut: d.statut,
    debut: d.debut,
    fin: d.fin,
  };
});

const COLONNES_BORDEREAU = [texte('code', 'Code', 8), texte('designation', 'Désignation', 24), texte('unite', 'Unité', 6), nombre('qte', 'Quantité'), montant('pu', 'PU HT'), montant('montant', 'Montant HT')];
const COLONNES_DECOMPTE_LOT = [nombre('numero', 'N°', 5), date('date', 'Date'), montant('cumulHT', 'Cumul HT'), montant('net', 'Net à payer'), texte('facture', 'Facture liée'), texte('statut', 'Statut')];

const onglet = (id: string, libelle: string, colonnes: OngletStatique['colonnes'], lignes: Ligne[]): OngletStatique => ({ id, libelle, colonnes, lignes });

function bordereau(lot: DefLot, coef: number): Ligne[] {
  return lot.lignes.map((b) => {
    const pu = arrondi(b.pu * coef);
    return { id: b.code, code: b.code, designation: b.designation, unite: b.unite, qte: b.qte, pu, montant: arrondi(pu * b.qte) };
  });
}

function ongletsLot(l: Ligne): OngletStatique[] {
  const lot = LOTS_DEF.find((d) => d.code === l.code);
  if (!lot) return [];
  const marche = montantMarche(lot);
  const decomptes = DECOMPTES_CALCULES.filter((d) => d.lot === lot);
  const lignesDecomptes = DECOMPTES.filter((d) => d.lot === lot.code);
  const avanceMax = arrondi(Math.min(TAUX.avance * marche, TAUX.plafondAvance));
  return [
    onglet('previsions', 'Prévisions', [date('mois', 'Mois'), montant('prevu', 'Paiement prévu'), montant('cumul', 'Cumul prévu')],
      [1, 2, 3, 4].map((k) => ({ id: String(k), mois: decaler(lot.debut, 30 * k), prevu: arrondi(marche / 4), cumul: arrondi((marche / 4) * k) }))),
    onglet('estimatif', 'Bordereau estimatif', COLONNES_BORDEREAU, bordereau(lot, 1.04)),
    onglet('appel', "Appel d'offre", [texte('etape', 'Étape', 20), date('date', 'Date')], [
      { id: '1', etape: "Lancement de l'appel d'offre", date: decaler(lot.debut, -75) },
      { id: '2', etape: 'Échéance de remise des offres', date: decaler(lot.debut, -50) },
      { id: '3', etape: 'Ouverture des plis', date: decaler(lot.debut, -46) },
      { id: '4', etape: 'Adjudication', date: decaler(lot.debut, -20) },
    ]),
    onglet('offres', 'Offres des entreprises', [texte('fournisseur', 'Entreprise', 20), montant('montant', 'Offre HT'), nombre('delai', 'Délai (mois)'), nombre('rang', 'Rang')],
      [FOURNISSEURS[0], FOURNISSEURS[3], FOURNISSEURS[1]].map((f, k) => ({ id: String(k + 1), fournisseur: k === 0 && lot.fournisseur ? lot.fournisseur : f, montant: arrondi(marche * [1, 1.06, 1.12][k]), delai: 8 + k, rang: k + 1 }))),
    onglet('definitif', 'Bordereau définitif', COLONNES_BORDEREAU, bordereau(lot, 1)),
    onglet('decomposition', 'Décomposition', [texte('tache', 'Tâche', 24), pct('poids', 'Poids')], []),
    onglet('avances', 'Avances', [date('date', 'Date'), texte('libelle', 'Libellé', 20), montant('montant', 'Montant')],
      decomptes.length > 0 ? [{ id: '1', date: lot.debut, libelle: 'Avance de démarrage', montant: avanceMax }] : []),
    onglet('decomptes', 'Décomptes', COLONNES_DECOMPTE_LOT, lignesDecomptes),
    onglet('avenants', 'Avenants', [texte('objet', 'Objet', 24), date('date', 'Date'), montant('montant', 'Montant HT')], []),
    onglet('retenues', 'Retenues de garantie', [nombre('numero', 'Décompte', 8), date('date', 'Date'), montant('retenue', 'Retenue du décompte'), montant('cumul', 'Cumul retenu')],
      decomptes.map((d) => ({ id: d.id, numero: d.numero, date: d.saisie.date, retenue: periode(d.cumul.garantie, d.precedent.garantie), cumul: d.cumul.garantie }))),
    onglet('avoirs', 'Avoirs', [texte('numero', 'N°'), date('date', 'Date'), montant('montant', 'Montant TTC')], []),
  ];
}

export const configLots: ConfigEcran = configListe({
  titre: 'Lots',
  unite: 'lot',
  nature: 'Lot',
  recherche: 'Code, libellé, fournisseur…',
  colonnes: [
    texte('code', 'Code', 8), texte('libelle', 'Libellé', 20), texte('projet', 'Projet', 9), texte('tranche', 'Tranche', 9), texte('type', 'Type', 11), texte('fournisseur', 'Fournisseur', 18),
    montant('estime', 'Montant estimé HT'), montant('marche', 'Montant marché HT'), montant('decompte', 'Décompté cumulé HT'), pct('avancement', '% avancement', 8), montant('reste', 'Reste à décompter'),
    texte('statut', 'Statut', 12), date('debut', 'Début'), date('fin', 'Fin'),
  ],
  lignes: LOTS,
  filtres: ['projet', 'tranche', 'type', 'statut', 'fournisseur'],
  onglets: ongletsLot,
  propres: [{ id: 'multi', libelle: 'Nouveau lot multi-fournisseur', icone: Layers }],
});

export const configDecomptes: ConfigEcran = configListe({
  titre: 'Décomptes',
  unite: 'décompte',
  nature: 'Décompte',
  recherche: 'Lot, fournisseur, facture…',
  colonnes: [
    nombre('numero', 'N°', 5), date('date', 'Date'), texte('lot', 'Lot', 8), texte('fournisseur', 'Fournisseur', 18), montant('cumulHT', 'Cumul HT'), montant('precedentHT', 'Précédent HT'), montant('periodeHT', 'Période HT'),
    montant('tva', 'TVA'), montant('ttc', 'TTC'), montant('avance', 'Avance'), montant('garantie', 'Retenue de garantie'), montant('revision', 'Révision'), montant('net', 'Net à payer'),
    texte('facture', 'Facture liée', 12), texte('statut', 'Statut', 9),
  ],
  lignes: DECOMPTES,
  filtres: ['lot', 'fournisseur', 'statut'],
  colonneDate: 'date',
  titreFiche: (l) => `Décompte n° ${l.numero} — ${l.lot}`,
  onglets: (l) => [
    {
      id: 'lignes',
      libelle: 'Lignes du décompte',
      colonnes: [
        texte('code', 'Code', 8), texte('designation', 'Désignation', 22), nombre('qteMarche', 'Qté marché'), nombre('qtePrec', 'Qté précédente'), nombre('qtePeriode', 'Qté période'), nombre('qteCum', 'Qté cumulée'),
        montant('mntPrec', 'Montant précédent'), montant('mntPeriode', 'Montant période'), montant('mntCum', 'Montant cumulé'),
      ],
      lignes: lignesDecompte(l.id),
    },
  ],
  extra: (l) => <TableauRecap titre="Récapitulatif de calcul du net à payer" entetes={['Cumul', 'Précédent', 'Ce décompte']} lignes={recapDecompte(l.id)} />,
  propres: [{ id: 'facture', libelle: 'Générer la facture', icone: FilePlus2 }],
});
