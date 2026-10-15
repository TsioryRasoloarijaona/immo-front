import { useMemo, type ReactNode } from 'react';
import { Lock, TriangleAlert } from 'lucide-react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { encaissementCompteDansLesTotaux, encaissementEtatLabel, encaissementEtatTone, encaissementSignal } from '../lib/domain';
import { jourISO } from '../lib/format';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_ENCAISSEMENTS } from '../lib/dispositions';
import type { ColonneDto, EncaissementDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

const SIGNAUX = {
  pointe: { Icone: Lock, titre: 'Pointé : règlement verrouillé', classe: 'text-muted-foreground' },
  echu: { Icone: TriangleAlert, titre: 'Échéance passée et règlement non pointé', classe: 'text-(--warning)' },
} as const;

function CelluleEtat({ r }: Readonly<{ r: EncaissementDto }>) {
  const signal = encaissementSignal(r.etat, r.dateEcheance, jourISO(new Date()));
  const s = signal ? SIGNAUX[signal] : null;
  return (
    <span className="inline-flex items-center gap-1">
      {s && (
        <span role="img" aria-label={s.titre} title={s.titre} className="inline-flex">
          <s.Icone aria-hidden className={`size-3 shrink-0 ${s.classe}`} />
        </span>
      )}
      <Badge tone={encaissementEtatTone(r.etat)}>{encaissementEtatLabel(r.etat)}</Badge>
    </span>
  );
}

const RENDUS: Record<string, (r: EncaissementDto) => ReactNode> = {
  etat: (r) => <CelluleEtat r={r} />,
  comptabilise: (r) => <Badge tone={r.comptabilise ? 'success' : 'neutral'}>{r.comptabilise ? 'Oui' : 'Non'}</Badge>,
  remisAuCentre: (r) =>
    r.remisAuCentre === undefined ? TIRET : (
      <Badge tone={r.remisAuCentre ? 'success' : 'neutral'}>{r.remisAuCentre ? 'Oui' : 'Non'}</Badge>
    ),
};

// Sans elles, tri et filtre comparent le code brut (`IN_WORK`) et non le libellé affiché (« Pointé »).
const VALEURS: Record<string, (r: EncaissementDto) => unknown> = {
  etat: (r) => encaissementEtatLabel(r.etat),
};

const CLASSES: Record<string, string> = {
  dateDocument: 'text-muted-foreground',
  dateReglement: 'text-muted-foreground',
  pointagePrevu: 'text-muted-foreground',
  dateEcheance: 'text-muted-foreground',
  tierNom: 'font-medium text-foreground',
  dossierCode: 'text-muted-foreground',
  typeLibelle: 'text-muted-foreground',
  typeCode: 'tabular-nums text-muted-foreground',
  montantBrut: 'text-foreground',
  montantBrutRestant: 'text-muted-foreground',
  montantNet: 'text-muted-foreground',
  montantBase: 'text-muted-foreground',
  reference: 'text-muted-foreground',
  description: 'text-muted-foreground',
  entiteCode: 'tabular-nums text-muted-foreground',
  entiteLibelle: 'text-muted-foreground',
  banqueNom: 'text-muted-foreground',
  tierPayeurNom: 'text-muted-foreground',
  notes: 'text-muted-foreground',
  recuCode: 'tabular-nums text-muted-foreground',
  bordereauCode: 'tabular-nums text-muted-foreground',
  dateRemiseAuCentre: 'text-muted-foreground',
  dateBordereau: 'text-muted-foreground',
  compteCode: 'tabular-nums text-muted-foreground',
  depotCode: 'tabular-nums text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

const TITRES: Record<string, (r: EncaissementDto) => string | undefined> = {
  tierNom: (r) => r.tierNom || undefined,
  dossierCode: (r) => r.dossierCode || undefined,
  typeLibelle: (r) => r.typeLibelle || undefined,
  reference: (r) => r.reference || undefined,
  description: (r) => r.description || undefined,
  entiteLibelle: (r) => r.entiteLibelle || undefined,
  banqueNom: (r) => r.banqueNom || undefined,
  tierPayeurNom: (r) => r.tierPayeurNom || undefined,
  notes: (r) => r.notes || undefined,
};

export default function EncaissementTable({
  rows,
  colonnes,
  onOuvrir,
  cleOrdre,
  bandeauRegroupement,
  groupes,
}: Readonly<{
  rows: EncaissementDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  cleOrdre?: string;
  bandeauRegroupement?: boolean;
  groupes?: GroupementGrille<EncaissementDto>;
}>) {
  const grille = useMemo<ColonneGrille<EncaissementDto>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_ENCAISSEMENTS.poids),
        rendu: RENDUS[c.nom],
        valeur: VALEURS[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
        // Un règlement annulé reste visible mais sort du Σ des montants, comme des totaux serveur.
        valeurSomme:
          c.type === 'MONTANT'
            ? (r: EncaissementDto) =>
                encaissementCompteDansLesTotaux(r.etat) ? (r as unknown as Record<string, unknown>)[c.nom] : null
            : undefined,
      })),
    [colonnes],
  );

  return (
    <DataGrid
      cleOrdre={cleOrdre}
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* `reference` est décochable : sans repli, un lecteur d'écran
         annoncerait « Ouvrir le règlement » sans rien derrière. */
      libelleLigne={(r) => `Ouvrir le règlement ${r.reference || r.description || r.id}`}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
