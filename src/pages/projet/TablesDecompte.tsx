import type { ReactNode } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { Card, EmptyState } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { LigneSaisie } from '../../lib/saisieDecompte';
import type { ExtraDecompteDto, LigneApprovisionnementDto, ReglementFactureDto, RetenueDecompteDto } from '../../types/projet';

const COLONNES_REGLEMENTS: ColonneGrille<ReglementFactureDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 6 },
  { nom: 'typeDescription', libelle: 'Type', largeur: 8, valeur: (r) => r.typeDescription ?? r.typeCode },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.annule ? null : r.montant) },
  { nom: 'annule', libelle: 'Annulé', type: 'BOOLEEN', largeur: 4 },
];

const COLONNES_LIGNES: ColonneGrille<LigneSaisie>[] = [
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

const COLONNES_APPRO: ColonneGrille<LigneApprovisionnementDto>[] = [
  { nom: 'ordre', libelle: 'N°', type: 'NOMBRE', largeur: 3 },
  { nom: 'code', libelle: 'Code', largeur: 8 },
  { nom: 'designation', libelle: 'Désignation', largeur: 20 },
  { nom: 'unite', libelle: 'Unité', largeur: 4 },
  { nom: 'quantite', libelle: 'Quantité', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 8 },
  { nom: 'tauxTVA', libelle: 'TVA %', type: 'NOMBRE', largeur: 4 },
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9 },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9 },
];

/** La quantité saisie est le seul champ d'une ligne que l'enregistrement relit. */
function colonnesLignes(lectureSeule: boolean, onQuantite: (id: string, quantite: number | null) => void): ColonneGrille<LigneSaisie>[] {
  return [...COLONNES_LIGNES, {
    nom: 'quantiteSaisie',
    libelle: 'Qté saisie',
    type: 'NOMBRE',
    largeur: 7,
    rendu: (l) =>
      lectureSeule ? (
        l.quantiteSaisie
      ) : (
        <input
          type="number"
          step="any"
          aria-label={`Quantité saisie, ligne ${l.ordre ?? ''}`}
          className="h-5 w-24 rounded border border-border bg-background px-1 text-right"
          value={l.quantiteSaisie ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onQuantite(l.id, e.target.value === '' ? null : Number(e.target.value))}
        />
      ),
  }];
}

/** Onglets de la fiche : `totaux` est le contenu du premier (montants, facture, retenues). */
export function TablesDecompte({
  totaux,
  reglements,
  lignes,
  approvisionnements,
  extras,
  retenues,
  lectureSeule,
  onQuantite,
}: Readonly<{
  totaux: ReactNode;
  reglements: ReglementFactureDto[];
  lignes: LigneSaisie[];
  approvisionnements: LigneApprovisionnementDto[];
  extras: ExtraDecompteDto[];
  retenues: RetenueDecompteDto[];
  lectureSeule: boolean;
  onQuantite: (id: string, quantite: number | null) => void;
}>) {
  return (
    <Tabs defaultValue="totaux">
      <TabsList>
        <TabsTrigger value="totaux">Totaux</TabsTrigger>
        <TabsTrigger value="lignes">Lignes</TabsTrigger>
        <TabsTrigger value="appro">Approvisionnement</TabsTrigger>
        <TabsTrigger value="extras">Travaux supplémentaires</TabsTrigger>
        <TabsTrigger value="retenues">Retenues forfaitaires</TabsTrigger>
      </TabsList>
      <TabsContent value="totaux" className="flex flex-col gap-3">
        {totaux}
        <Tableau titre="Règlements" rows={reglements} colonnes={COLONNES_REGLEMENTS} cle="projet-decompte-reglements" classeLigne={(r) => (r.annule ? 'line-through text-muted-foreground' : undefined)} />
      </TabsContent>
      <TabsContent value="lignes">
        <Tableau titre="Lignes" rows={lignes} colonnes={colonnesLignes(lectureSeule, onQuantite)} cle="projet-decompte-lignes" vide="Aucune ligne — décompte saisi en travaux supplémentaires" />
      </TabsContent>
      <TabsContent value="appro">
        <Tableau titre="Approvisionnement" rows={approvisionnements} colonnes={COLONNES_APPRO} cle="projet-decompte-appro" vide="Aucun approvisionnement" />
      </TabsContent>
      <TabsContent value="extras">
        <Tableau titre="Travaux supplémentaires" rows={extras} colonnes={COLONNES_EXTRAS} cle="projet-decompte-extras" vide="Aucun travail supplémentaire" />
      </TabsContent>
      <TabsContent value="retenues">
        <Tableau titre="Retenues forfaitaires" rows={retenues} colonnes={COLONNES_RETENUES} cle="projet-decompte-retenues" vide="Aucune retenue forfaitaire" />
      </TabsContent>
    </Tabs>
  );
}
