import { Send } from 'lucide-react';
import { arrondi, date, montant, nombre, pct, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import type { ConfigEcran, Ligne, OngletStatique } from '../../../components/maquette/types';
import CircuitFacture from './CircuitFacture';
import { AFFECTATIONS, AUJOURDHUI, DOCUMENTS, HISTORIQUE, REGLEMENTS } from './donnees';

interface OptionsDocument {
  titre: string;
  unite: string;
  nature: string;
  type: string;
  /** Colonnes réglé / reste à payer, échéance et statut. */
  paiement?: boolean;
  statut?: boolean;
  filtre?: (l: Ligne) => boolean;
  onglets?: (l: Ligne) => OngletStatique[];
  extra?: ConfigEcran['extra'];
  propres?: ConfigEcran['propres'];
}

const onglet = (id: string, libelle: string, colonnes: OngletStatique['colonnes'], lignes: Ligne[]): OngletStatique => ({ id, libelle, colonnes, lignes });

const COLONNES_HISTORIQUE = [texte('document', 'Document', 14), date('date', 'Date'), texte('de', 'De', 18), texte('a', 'Vers', 18), texte('utilisateur', 'Utilisateur', 14), texte('note', 'Note', 18)];

function lignesDocument(l: Ligne): Ligne[] {
  const principal = arrondi(Number(l.ht) * 0.7);
  return [
    { id: '1', designation: String(l.objet), qte: 1, pu: principal, ht: principal },
    { id: '2', designation: 'Prestations annexes et sujétions', qte: 1, pu: arrondi(Number(l.ht) - principal), ht: arrondi(Number(l.ht) - principal) },
  ];
}

const ongletLignes = (l: Ligne) =>
  onglet('lignes', 'Lignes', [texte('designation', 'Désignation', 28), nombre('qte', 'Quantité'), montant('pu', 'PU HT'), montant('ht', 'Montant HT')], lignesDocument(l));

const liees = (l: Ligne, type: string): Ligne[] => DOCUMENTS.filter((d) => d.type === type && d.lot !== '' && d.lot === l.lot);

function ongletsFacture(l: Ligne): OngletStatique[] {
  const reglements = AFFECTATIONS.filter((a) => a.facture === l.numero).map((a) => {
    const r = REGLEMENTS.find((x) => x.numero === a.reglement) as Ligne;
    return { id: a.id, numero: r.numero, date: r.date, type: r.type, statut: r.statut, montant: a.montant };
  });
  return [
    ongletLignes(l),
    onglet('ventilation', 'Ventilation', [texte('categorie', 'Catégorie de trésorerie', 26), montant('ht', 'Montant HT'), pct('part', 'Part', 8)], [
      { id: '1', categorie: l.lot ? 'Travaux — marchés de chantier' : 'Frais de chantier', ht: l.ht, part: 1 },
    ]),
    onglet('pieces', 'Pièces jointes', [texte('nom', 'Fichier', 28), texte('nature', 'Nature', 14), date('date', 'Ajouté le')], [
      { id: '1', nom: `${l.numero}.pdf`, nature: 'Facture', date: l.date },
      ...(l.lot ? [{ id: '2', nom: `Decompte-${l.lot}.pdf`, nature: 'Décompte signé', date: l.date }] : []),
    ]),
    onglet('historique', 'Historique des statuts', COLONNES_HISTORIQUE, HISTORIQUE.filter((h) => h.document === l.numero)),
    onglet('reglements', 'Règlements', [texte('numero', 'Règlement', 14), date('date', 'Date'), texte('type', 'Mode', 10), texte('statut', 'Statut', 10), montant('montant', 'Montant affecté')], reglements),
  ];
}

function ongletsCommande(l: Ligne): OngletStatique[] {
  return [
    ongletLignes(l),
    onglet('avances', 'Avances', [texte('numero', 'Document', 14), date('date', 'Date'), texte('objet', 'Objet', 22), montant('ttc', 'Montant TTC')], liees(l, 'DOCUMENT À RÉGLER')),
    onglet('retenues', 'Retenues', [texte('libelle', 'Retenue', 24), pct('taux', 'Taux', 8), montant('montant', 'Montant')], [
      { id: '1', libelle: 'Retenue de garantie', taux: 0.1, montant: arrondi(Number(l.ht) * 0.1) },
    ]),
    onglet('factures', 'Factures liées', [texte('numero', 'Facture', 14), date('date', 'Date'), montant('ttc', 'Montant TTC'), texte('statut', 'Statut', 14)], liees(l, 'FACTURE')),
  ];
}

function configDocuments(o: OptionsDocument): ConfigEcran {
  const lignes = DOCUMENTS.filter((d) => d.type === o.type && (o.filtre?.(d) ?? true));
  return configListe({
    titre: o.titre,
    unite: o.unite,
    nature: o.nature,
    recherche: 'N°, fournisseur, objet…',
    colonnes: [
      texte('numero', 'N°', 12), date('date', 'Date'), texte('fournisseur', 'Fournisseur', 18), texte('projet', 'Projet', 9), texte('lot', 'Lot', 8), texte('objet', 'Objet', 26),
      montant('ht', 'Montant HT'), montant('tva', 'TVA'), montant('ttc', 'Montant TTC'),
      ...(o.paiement ? [montant('regle', 'Réglé'), montant('reste', 'Reste à payer'), date('echeance', 'Échéance')] : []),
      ...(o.statut ? [texte('statut', 'Statut', 14)] : []),
    ],
    lignes,
    filtres: ['fournisseur', 'projet', ...(o.statut ? ['statut'] : [])],
    colonneDate: 'date',
    titreFiche: (l) => `${o.nature} ${l.numero}`,
    onglets: o.onglets ?? ((l) => [ongletLignes(l)]),
    extra: o.extra,
    propres: o.propres,
  });
}

const OPTIONS_FACTURE = { type: 'FACTURE', paiement: true, statut: true, onglets: ongletsFacture, extra: (l: Ligne) => <CircuitFacture facture={l} /> };

export const configFactures = configDocuments({ ...OPTIONS_FACTURE, titre: 'Factures', unite: 'facture', nature: 'Facture' });

export const configVirements = configDocuments({
  ...OPTIONS_FACTURE,
  titre: 'Virements à émettre',
  unite: 'facture à virer',
  nature: 'Facture',
  filtre: (l) => l.statut === 'VALIDE POUR PAIEMENT' && Number(l.reste) > 0,
  propres: [{ id: 'virement', libelle: 'Envoyer en virement', icone: Send }],
});

export const configDevis = configDocuments({ type: 'DEVIS', titre: 'Devis', unite: 'devis', nature: 'Devis' });
export const configCommandes = configDocuments({ type: 'BON DE COMMANDE', titre: 'Bons de commande', unite: 'bon de commande', nature: 'Bon de commande', statut: true, onglets: ongletsCommande });
export const configLivraisons = configDocuments({ type: 'BON DE LIVRAISON', titre: 'Bons de livraison', unite: 'bon de livraison', nature: 'Bon de livraison', statut: true });
export const configAvoirs = configDocuments({ type: 'AVOIR', titre: 'Avoirs', unite: 'avoir', nature: 'Avoir', paiement: true, statut: true });
export const configARegler = configDocuments({ type: 'DOCUMENT À RÉGLER', titre: 'Documents à régler', unite: 'document à régler', nature: 'Document à régler', paiement: true, statut: true });

export const configImpayes: ConfigEcran = configListe({
  titre: 'Liste des impayés',
  unite: 'facture impayée',
  nature: 'Facture impayée',
  recherche: 'N°, fournisseur…',
  colonnes: [
    texte('numero', 'N°', 12), texte('fournisseur', 'Fournisseur', 18), texte('projet', 'Projet', 9), date('echeance', 'Échéance'), montant('ttc', 'Montant TTC'), montant('regle', 'Réglé'), montant('reste', 'Reste à payer'),
    nombre('retard', 'Retard (jours)', 8), texte('statut', 'Statut', 14),
  ],
  lignes: DOCUMENTS.filter((d) => d.type === 'FACTURE' && Number(d.reste) > 0 && d.statut !== 'ANNULATION').map((d) => ({
    ...d,
    retard: Math.max(0, Math.round((Date.parse(AUJOURDHUI) - Date.parse(String(d.echeance))) / 86_400_000)),
  })),
  filtres: ['fournisseur', 'projet', 'statut'],
  outils: ['imprimer', 'exporter', 'rafraichir'],
});

export const configHistorique: ConfigEcran = configListe({
  titre: 'Documents',
  unite: 'changement de statut',
  nature: 'Changement de statut',
  recherche: 'Document, utilisateur…',
  colonnes: COLONNES_HISTORIQUE,
  lignes: HISTORIQUE,
  filtres: ['de', 'a', 'utilisateur'],
  colonneDate: 'date',
  titreFiche: (l) => `${l.document} : ${l.de} → ${l.a}`,
  outils: ['imprimer', 'exporter', 'rafraichir'],
});
