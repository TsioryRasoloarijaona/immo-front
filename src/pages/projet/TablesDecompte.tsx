import { useState, type ReactNode } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import BarreExtrasDecompte from '../../components/projet/BarreExtrasDecompte';
import DialogueLigneBordereauExtra from '../../components/projet/DialogueLigneBordereauExtra';
import { Card, EmptyState } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { LigneSaisie } from '../../lib/saisieDecompte';
import { extraDepuisBordereau, extraVide, retenueVide, type ExtraSaisie, type RetenueSaisie } from '../../lib/saisieExtrasDecompte';
import type { UUID } from '../../types';
import type { LigneApprovisionnementDto, ReglementFactureDto } from '../../types/projet';

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
];

type ChampExtra = 'code' | 'designation' | 'unite' | 'quantite' | 'prixUnitaireHT' | 'tauxTVA' | 'tauxFODEC' | 'notes';

const CHAMPS_EXTRAS: { nom: ChampExtra; libelle: string; texte?: boolean; type?: 'NOMBRE' | 'MONTANT'; largeur: number }[] = [
  { nom: 'code', libelle: 'Code', texte: true, largeur: 8 },
  { nom: 'designation', libelle: 'Désignation', texte: true, largeur: 20 },
  { nom: 'unite', libelle: 'Unité', texte: true, largeur: 4 },
  { nom: 'quantite', libelle: 'Quantité', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 8 },
  { nom: 'tauxTVA', libelle: 'TVA %', type: 'NOMBRE', largeur: 4 },
  { nom: 'tauxFODEC', libelle: 'FODEC %', type: 'NOMBRE', largeur: 4 },
  { nom: 'notes', libelle: 'Notes', texte: true, largeur: 12 },
];

function Cellule({ texte, valeur, label, maxLength, onChange }: Readonly<{ texte: boolean; valeur: string | number | null; label: string; maxLength?: number; onChange: (v: string | number | null) => void }>) {
  if (texte) {
    return (
      <input
        aria-label={label}
        maxLength={maxLength}
        className="h-5 w-full min-w-20 rounded border border-border bg-background px-1"
        value={valeur ?? ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type="number"
      step="any"
      aria-label={label}
      className="h-5 w-24 rounded border border-border bg-background px-1 text-right"
      value={valeur ?? ''}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

function colonnesExtras(
  extras: ExtraSaisie[],
  lectureSeule: boolean,
  maj: (id: string, patch: Partial<ExtraSaisie>) => void,
): ColonneGrille<ExtraSaisie>[] {
  const champs = CHAMPS_EXTRAS.map((c): ColonneGrille<ExtraSaisie> => ({
    nom: c.nom,
    libelle: c.libelle,
    type: c.type,
    largeur: c.largeur,
    rendu: lectureSeule
      ? undefined
      : (e) => (
          <Cellule
            texte={c.texte === true}
            valeur={e[c.nom]}
            label={`${c.libelle}, extra ${extras.findIndex((x) => x.id === e.id) + 1}`}
            onChange={(v) => maj(e.id, { [c.nom]: v })}
          />
        ),
  }));
  return [...champs, { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9 }, { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9 }];
}

function colonnesRetenues(retenues: RetenueSaisie[], lectureSeule: boolean, maj: (id: string, patch: Partial<RetenueSaisie>) => void): ColonneGrille<RetenueSaisie>[] {
  const rang = (r: RetenueSaisie) => retenues.findIndex((x) => x.id === r.id) + 1;
  return [
    {
      nom: 'libelle',
      libelle: 'Libellé',
      largeur: 20,
      rendu: lectureSeule ? undefined : (r) => <Cellule texte valeur={r.libelle} maxLength={500} label={`Libellé, retenue ${rang(r)}`} onChange={(v) => maj(r.id, { libelle: String(v ?? '') })} />,
    },
    {
      nom: 'montant',
      libelle: 'Montant',
      type: 'MONTANT',
      largeur: 9,
      rendu: lectureSeule ? undefined : (r) => <Cellule texte={false} valeur={r.montant} label={`Montant, retenue ${rang(r)}`} onChange={(v) => maj(r.id, { montant: v === null ? null : Number(v) })} />,
    },
  ];
}

function Tableau<T extends { id: string }>({
  titre,
  rows,
  colonnes,
  cle,
  vide,
  classeLigne,
  selection,
  barre,
}: Readonly<{
  titre: string;
  rows: T[];
  colonnes: ColonneGrille<T>[];
  cle: string;
  vide?: string;
  classeLigne?: (r: T) => string | undefined;
  selection?: { ids: Set<string>; onToggle: (id: string) => void; onToggleAll: (ids: string[]) => void };
  barre?: ReactNode;
}>) {
  if (rows.length === 0 && !vide) return null;
  return (
    <Card title={titre} padded={false}>
      {barre}
      {rows.length === 0 ? (
        <EmptyState title={vide ?? ''} />
      ) : (
        <DataGrid rows={rows} colonnes={colonnes} cleOrdre={cle} bandeauRegroupement={false} classeLigne={classeLigne} selection={selection} />
      )}
    </Card>
  );
}

/** Grille éditable (extras ou retenues) : cases cochées = lignes visées par « Supprimer ». */
function OngletEditable<T extends { id: string }>({
  titre,
  rows,
  colonnes,
  cle,
  vide,
  lectureSeule,
  onAjouter,
  onAjouterBdp,
  onSupprimer,
}: Readonly<{
  titre: string;
  rows: T[];
  colonnes: ColonneGrille<T>[];
  cle: string;
  vide: string;
  lectureSeule: boolean;
  onAjouter: () => void;
  onAjouterBdp?: () => void;
  onSupprimer: (ids: Set<string>) => void;
}>) {
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const selection = {
    ids: cochees,
    onToggle: (id: string) =>
      setCochees((c) => {
        const suivant = new Set(c);
        if (!suivant.delete(id)) suivant.add(id);
        return suivant;
      }),
    onToggleAll: (ids: string[]) => setCochees(new Set(ids)),
  };
  const barre = lectureSeule ? undefined : (
    <BarreExtrasDecompte
      nbCochees={rows.filter((r) => cochees.has(r.id)).length}
      onAjouter={onAjouter}
      onAjouterBdp={onAjouterBdp}
      onSupprimer={() => {
        onSupprimer(cochees);
        setCochees(new Set());
      }}
    />
  );
  return <Tableau titre={titre} rows={rows} colonnes={colonnes} cle={cle} vide={vide} selection={lectureSeule ? undefined : selection} barre={barre} />;
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
function colonnesLignes(
  lectureSeule: boolean,
  onQuantite: (id: string, quantite: number | null) => void,
  onAvancement: (id: string, avancement: number | null) => void,
): ColonneGrille<LigneSaisie>[] {
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
  }, {
    nom: 'avancementLignePct',
    libelle: 'Avancement %',
    type: 'NOMBRE',
    largeur: 6,
    rendu: (l) =>
      lectureSeule ? (
        l.avancementLignePct
      ) : (
        <input
          type="number"
          step="any"
          aria-label={`Avancement, ligne ${l.ordre ?? ''}`}
          className="h-5 w-20 rounded border border-border bg-background px-1 text-right"
          value={l.avancementSaisi ?? l.avancementLignePct ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onAvancement(l.id, e.target.value === '' ? null : Number(e.target.value))}
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
  lotId,
  extras,
  retenues,
  lectureSeule,
  onQuantite,
  onAvancement,
  onExtras,
  onRetenues,
}: Readonly<{
  totaux: ReactNode;
  reglements: ReglementFactureDto[];
  lignes: LigneSaisie[];
  approvisionnements: LigneApprovisionnementDto[];
  lotId: UUID;
  extras: ExtraSaisie[];
  retenues: RetenueSaisie[];
  lectureSeule: boolean;
  onQuantite: (id: string, quantite: number | null) => void;
  onAvancement: (id: string, avancement: number | null) => void;
  onExtras: (suivantes: ExtraSaisie[]) => void;
  onRetenues: (suivantes: RetenueSaisie[]) => void;
}>) {
  const [bdp, setBdp] = useState(false);
  const majExtra = (id: string, patch: Partial<ExtraSaisie>) => onExtras(extras.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const majRetenue = (id: string, patch: Partial<RetenueSaisie>) => onRetenues(retenues.map((r) => (r.id === id ? { ...r, ...patch } : r)));
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
        <Tableau titre="Lignes" rows={lignes} colonnes={colonnesLignes(lectureSeule, onQuantite, onAvancement)} cle="projet-decompte-lignes" vide="Aucune ligne — décompte saisi en travaux supplémentaires" />
      </TabsContent>
      <TabsContent value="appro">
        <Tableau titre="Approvisionnement" rows={approvisionnements} colonnes={COLONNES_APPRO} cle="projet-decompte-appro" vide="Aucun approvisionnement" />
      </TabsContent>
      <TabsContent value="extras">
        <OngletEditable
          titre="Travaux supplémentaires"
          rows={extras}
          colonnes={colonnesExtras(extras, lectureSeule, majExtra)}
          cle="projet-decompte-extras"
          vide="Aucun travail supplémentaire"
          lectureSeule={lectureSeule}
          onAjouter={() => onExtras([...extras, extraVide()])}
          onAjouterBdp={() => setBdp(true)}
          onSupprimer={(ids) => onExtras(extras.filter((e) => !ids.has(e.id)))}
        />
        {bdp && <DialogueLigneBordereauExtra lotId={lotId} onChoisir={(choisies) => onExtras([...extras, ...choisies.map(extraDepuisBordereau)])} onFermer={() => setBdp(false)} />}
      </TabsContent>
      <TabsContent value="retenues">
        <OngletEditable
          titre="Retenues forfaitaires"
          rows={retenues}
          colonnes={colonnesRetenues(retenues, lectureSeule, majRetenue)}
          cle="projet-decompte-retenues"
          vide="Aucune retenue forfaitaire"
          lectureSeule={lectureSeule}
          onAjouter={() => onRetenues([...retenues, retenueVide()])}
          onSupprimer={(ids) => onRetenues(retenues.filter((r) => !ids.has(r.id)))}
        />
      </TabsContent>
    </Tabs>
  );
}
