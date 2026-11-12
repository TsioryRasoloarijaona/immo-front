import { TriangleAlert } from 'lucide-react';
import type { ColonneGrille } from '../DataGrid';
import { Badge } from '../ui';
import { libelleStatutAchat, tonStatutAchat } from '../../lib/documentsAchat';
import { toneStatut } from '../../lib/faisabilite';
import { formatCurrency } from '../../lib/format';
import type { CleColonneAchat } from '../../lib/vuesAchat';
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
  archive: {
    nom: 'archive',
    libelle: 'Archivé',
    type: 'BOOLEEN',
    largeur: 5,
    rendu: (d) => caseLecture(d.archive, 'Archivé'),
  },
};
