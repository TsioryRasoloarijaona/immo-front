import { TriangleAlert } from 'lucide-react';
import type { ColonneGrille } from '../DataGrid';
import { Badge } from '../ui';
import { libelleStatutAchat, tonStatutAchat } from '../../lib/documentsAchat';
import { toneStatut } from '../../lib/faisabilite';
import { formatCurrency } from '../../lib/format';
import type { CleAgregatAchat, CleColonneAchat } from '../../lib/vuesAchat';
import type { DocumentAchatListItemDto } from '../../types/achat';

type Colonne = ColonneGrille<DocumentAchatListItemDto>;

function caseLecture(vrai: boolean, libelle: string) {
  return <input type="checkbox" checked={vrai} readOnly disabled aria-label={libelle} className="m-0 accent-(--brand)" />;
}

function rendreMontant(d: DocumentAchatListItemDto, valeur: number, reste = false) {
  return (
    <span className="inline-flex items-center gap-1">
      {d.aDeduire && <Badge tone="amber">Avance à déduire</Badge>}
      {reste && d.tropRegle && <Badge tone="amber">Trop réglé</Badge>}
      <span className={reste && valeur > 0 ? 'font-semibold text-destructive' : undefined}>{formatCurrency(valeur)}</span>
    </span>
  );
}

const montant = (nom: keyof DocumentAchatListItemDto, libelle: string): Colonne => ({ nom, libelle, type: 'MONTANT', largeur: 8 });
const texte = (nom: keyof DocumentAchatListItemDto, libelle: string, largeur = 9): Colonne => ({ nom, libelle, largeur });
const lireAgregat = (d: DocumentAchatListItemDto, cle: CleAgregatAchat) => d.agregats?.[cle] ?? null;
const agregat = (cle: CleAgregatAchat, libelle: string, type: 'MONTANT' | 'POURCENTAGE' | 'TEXTE' = 'MONTANT'): Colonne => ({
  nom: cle,
  libelle,
  type,
  largeur: type === 'TEXTE' ? 10 : 8,
  valeur: (d) => lireAgregat(d, cle),
  sansSomme: type === 'POURCENTAGE',
});

export const COLONNES_ACHAT: Record<CleColonneAchat, Colonne> = {
  aCloturer: {
    nom: 'aCloturer',
    libelle: 'À clôturer',
    type: 'BOOLEEN',
    largeur: 5,
    rendu: (d) => (d.aCloturer ? <TriangleAlert role="img" aria-label="À clôturer" className="size-3.5 text-destructive" /> : null),
  },
  statut: {
    nom: 'statutDescription',
    libelle: 'Statut',
    largeur: 10,
    valeur: libelleStatutAchat,
    rendu: (d) => <Badge tone={d.statutCouleur ? toneStatut(d.statutCouleur) : tonStatutAchat(d)}>{libelleStatutAchat(d)}</Badge>,
  },
  code: { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  dateAlerte: { nom: 'dateAlerte', libelle: 'Date alerte', type: 'DATE', largeur: 7 },
  dateDocument: { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7 },
  dateEcheance: { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
  societeNom: texte('societeNom', 'Entité'),
  moduleLibelle: texte('moduleLibelle', 'Module', 7),
  fournisseurNom: texte('fournisseurNom', 'Fournisseur', 12),
  personneAContacter: texte('personneAContacter', 'Personne à contacter'),
  typeLotLibelle: texte('typeLotLibelle', 'Type'),
  reference: texte('reference', 'Réf. Interne'),
  referenceBureauOrdre: texte('referenceBureauOrdre', "Réf. bureau d'ordre"),
  categories: texte('categories', 'Catégorie', 12),
  montantHT: montant('montantHT', 'Montant HT'),
  montantTVA: montant('montantTVA', 'TVA'),
  montantTTC: montant('montantTTC', 'TTC'),
  montantAPayer: { ...montant('montantAPayer', 'Net à payer'), rendu: (d) => rendreMontant(d, d.montantAPayer) },
  montantRegle: montant('montantRegle', 'Réglé'),
  resteARegler: { ...montant('resteARegler', 'Reste'), rendu: (d) => rendreMontant(d, d.resteARegler, true) },
  deviseCode: texte('deviseCode', 'Devise', 5),
  projetCode: texte('projetCode', 'Projet', 7),
  lotCode: texte('lotCode', 'Lot', 6),
  dossierGroupement: texte('dossierGroupement', 'Dossier de groupement'),
  description: texte('description', 'Description', 14),
  factureTTC: agregat('factureTTC', 'Montant facturé TTC'),
  livreTTC: agregat('livreTTC', 'Montant livré TTC'),
  resteALivrerTTC: agregat('resteALivrerTTC', 'Reste à livrer TTC'),
  avanceTauxPrevu: agregat('avanceTauxPrevu', 'Avance ratio', 'POURCENTAGE'),
  avanceTauxEffectif: agregat('avanceTauxEffectif', "Pourcentage effectif d'avance", 'POURCENTAGE'),
  avance: agregat('avance', 'Avance'),
  avanceAmortie: agregat('avanceAmortie', 'Avance amortie'),
  avanceResteAAmortir: agregat('avanceResteAAmortir', 'Avance reste à amortir'),
  avanceRegle: agregat('avanceRegle', 'Avance réglé'),
  avanceReste: agregat('avanceReste', 'Avance reste'),
  garantieRetenue: agregat('garantieRetenue', 'Retenue de garantie retenue'),
  garantieRestituee: agregat('garantieRestituee', 'Retenue de garantie restituée'),
  garantieReste: agregat('garantieReste', 'Retenue de garantie reste'),
  factureHT: agregat('factureHT', 'Montant Facturé HT'),
  factureNetAPayer: agregat('factureNetAPayer', 'Montant facturé Net à payer'),
  livreHT: agregat('livreHT', 'Montant livré HT'),
  livreNetAPayer: agregat('livreNetAPayer', 'Montant livré Net à payer'),
  resteALivrerHT: agregat('resteALivrerHT', 'Reste à livrer HT'),
  resteALivrerNetAPayer: agregat('resteALivrerNetAPayer', 'Reste à livrer Net à payer'),
  regle: agregat('regle', 'Montant réglé'),
  resteAPayerSurFacture: agregat('resteAPayerSurFacture', 'Reste à payer sur facturé'),
  resteAPayerTotal: agregat('resteAPayerTotal', 'Reste à payer total'),
  bonsLivraisonCodes: agregat('bonsLivraisonCodes', 'Bons de livraison', 'TEXTE'),
  facturesCodes: agregat('facturesCodes', 'Factures', 'TEXTE'),
  devisCode: agregat('devisCode', 'Devis', 'TEXTE'),
  archive: {
    nom: 'archive',
    libelle: 'Archivé',
    type: 'BOOLEEN',
    largeur: 5,
    rendu: (d) => caseLecture(d.archive, 'Archivé'),
  },
};
