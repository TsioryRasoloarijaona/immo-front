import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { Card, EmptyState } from '../../components/ui';
import type { ExtraDecompteDto, LigneDecompteDto, ReglementFactureDto, RetenueDecompteDto } from '../../types/projet';

const COLONNES_REGLEMENTS: ColonneGrille<ReglementFactureDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 6 },
  { nom: 'typeDescription', libelle: 'Type', largeur: 8, valeur: (r) => r.typeDescription ?? r.typeCode },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.annule ? null : r.montant) },
  { nom: 'annule', libelle: 'Annulé', type: 'BOOLEEN', largeur: 4 },
];

const COLONNES_LIGNES: ColonneGrille<LigneDecompteDto>[] = [
  { nom: 'ordre', libelle: 'N°', type: 'NOMBRE', largeur: 3 },
  { nom: 'designation', libelle: 'Désignation', largeur: 20 },
  { nom: 'unite', libelle: 'Unité', largeur: 4 },
  { nom: 'quantiteMarche', libelle: 'Qté marché', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 8 },
  { nom: 'quantiteAnterieure', libelle: 'Qté antérieure', type: 'NOMBRE', largeur: 6 },
  { nom: 'quantitePeriode', libelle: 'Qté période', type: 'NOMBRE', largeur: 6 },
  { nom: 'quantiteCumulee', libelle: 'Qté cumulée', type: 'NOMBRE', largeur: 6 },
  { nom: 'coefficient', libelle: 'Coefficient', type: 'NOMBRE', largeur: 5 },
  { nom: 'montantHTPeriode', libelle: 'HT période', type: 'MONTANT', largeur: 9 },
  { nom: 'avancementLignePct', libelle: 'Avancement %', type: 'NOMBRE', largeur: 5 },
];

const COLONNES_EXTRAS: ColonneGrille<ExtraDecompteDto>[] = [
  { nom: 'designation', libelle: 'Désignation', largeur: 20 },
  { nom: 'unite', libelle: 'Unité', largeur: 4 },
  { nom: 'quantite', libelle: 'Quantité', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 8 },
  { nom: 'tauxTVA', libelle: 'TVA %', type: 'NOMBRE', largeur: 4 },
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9 },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9 },
];

const COLONNES_RETENUES: ColonneGrille<RetenueDecompteDto>[] = [
  { nom: 'libelle', libelle: 'Libellé', largeur: 20 },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 9 },
];

function Tableau<T extends { id: string }>({
  titre,
  rows,
  colonnes,
  cle,
  vide,
  classeLigne,
}: Readonly<{ titre: string; rows: T[]; colonnes: ColonneGrille<T>[]; cle: string; vide?: string; classeLigne?: (r: T) => string | undefined }>) {
  if (rows.length === 0 && !vide) return null;
  return (
    <Card title={titre} padded={false}>
      {rows.length === 0 ? (
        <EmptyState title={vide ?? ''} />
      ) : (
        <DataGrid rows={rows} colonnes={colonnes} cleOrdre={cle} bandeauRegroupement={false} classeLigne={classeLigne} />
      )}
    </Card>
  );
}

export function TablesDecompte({
  reglements,
  lignes,
  extras,
  retenues,
}: Readonly<{ reglements: ReglementFactureDto[]; lignes: LigneDecompteDto[]; extras: ExtraDecompteDto[]; retenues: RetenueDecompteDto[] }>) {
  return (
    <>
      <Tableau titre="Règlements" rows={reglements} colonnes={COLONNES_REGLEMENTS} cle="projet-decompte-reglements" classeLigne={(r) => (r.annule ? 'line-through text-muted-foreground' : undefined)} />
      <Tableau titre="Lignes" rows={lignes} colonnes={COLONNES_LIGNES} cle="projet-decompte-lignes" vide="Aucune ligne — décompte saisi en travaux supplémentaires" />
      <Tableau titre="Travaux supplémentaires" rows={extras} colonnes={COLONNES_EXTRAS} cle="projet-decompte-extras" />
      <Tableau titre="Retenues" rows={retenues} colonnes={COLONNES_RETENUES} cle="projet-decompte-retenues" />
    </>
  );
}
