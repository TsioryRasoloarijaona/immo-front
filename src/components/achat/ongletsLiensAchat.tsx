import { Badge } from '../ui';
import { TableCell, TableRow } from '../ui/table';
import { Grille } from './ongletsDocumentAchat';
import { toneStatut } from '../../lib/faisabilite';
import { formatCurrency, formatDate, formatNumber, formatPercentValue } from '../../lib/format';
import type { UUID } from '../../types';
import type { AvoirAchatDto, PieceLieeAchatDto } from '../../types/achat';

const DROITE = 'text-right tabular-nums';

/** Code d'une pièce liée : bouton qui l'ouvre dans la même fenêtre ; texte seul si hors périmètre (id null). */
export function LienPiece({ id, code, onOuvrir }: Readonly<{ id: UUID | null; code: string | null; onOuvrir: (id: UUID) => void }>) {
  if (!id) return <>{code}</>;
  return (
    <button type="button" className="text-(--info) hover:underline" onClick={() => onOuvrir(id)}>
      {code ?? 'Ouvrir'}
    </button>
  );
}

const ENTETES_PIECES = [
  { libelle: 'Statut' },
  { libelle: 'Code' },
  { libelle: 'Date' },
  { libelle: 'Réf. interne' },
  { libelle: 'Total HT', droite: true },
  { libelle: 'Total TVA', droite: true },
  { libelle: 'Total TTC', droite: true },
  { libelle: 'Projet' },
  { libelle: 'Lot' },
];

/** Bons de livraison ou factures d'un bon de commande. */
export function PiecesLieesAchat({ pieces, onOuvrir }: Readonly<{ pieces: PieceLieeAchatDto[]; onOuvrir: (id: UUID) => void }>) {
  return (
    <Grille entetes={ENTETES_PIECES} vide={pieces.length === 0}>
      {pieces.map((p, i) => (
        <TableRow key={p.id ?? `hors-${i}`}>
          <TableCell>{p.statutDescription ? <Badge tone={toneStatut(p.statutCouleur)}>{p.statutDescription}</Badge> : null}</TableCell>
          <TableCell>
            <LienPiece id={p.id} code={p.code} onOuvrir={onOuvrir} />
          </TableCell>
          <TableCell>{formatDate(p.dateDocument)}</TableCell>
          <TableCell className="text-muted-foreground">{p.reference}</TableCell>
          <TableCell className={DROITE}>{formatCurrency(p.montantHT)}</TableCell>
          <TableCell className={DROITE}>{formatCurrency(p.montantTVA)}</TableCell>
          <TableCell className={DROITE}>{formatCurrency(p.montantTTC)}</TableCell>
          <TableCell>{p.projetCode}</TableCell>
          <TableCell>{p.lotCode}</TableCell>
        </TableRow>
      ))}
    </Grille>
  );
}

const ENTETES_AVOIR = [
  { libelle: 'Avoir' },
  { libelle: 'Code' },
  { libelle: 'Désignation' },
  { libelle: 'Unité' },
  { libelle: 'Qté', droite: true },
  { libelle: 'PU HT', droite: true },
  { libelle: 'Remise %', droite: true },
  { libelle: 'TVA %', droite: true },
  { libelle: 'Total HT', droite: true },
];

/** Avoirs d'une facture : une ligne par ligne d'avoir, précédée du code et de la date de l'avoir. */
export function AvoirsAchat({ avoirs, onOuvrir }: Readonly<{ avoirs: AvoirAchatDto[]; onOuvrir: (id: UUID) => void }>) {
  return (
    <Grille entetes={ENTETES_AVOIR} vide={avoirs.length === 0}>
      {avoirs.flatMap((a) =>
        a.lignes.map((l) => (
          <TableRow key={`${a.id}-${l.id}`}>
            <TableCell>
              <LienPiece id={a.id} code={a.code} onOuvrir={onOuvrir} /> <span className="text-muted-foreground">{formatDate(a.dateDocument)}</span>
            </TableCell>
            <TableCell className="text-muted-foreground">{l.code}</TableCell>
            <TableCell>{l.designation}</TableCell>
            <TableCell className="text-muted-foreground">{l.unite}</TableCell>
            <TableCell className={DROITE}>{formatNumber(l.quantite, 2)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.prixUnitaireHT)}</TableCell>
            <TableCell className={DROITE}>{formatPercentValue(l.remisePourcent)}</TableCell>
            <TableCell className={DROITE}>{formatPercentValue(l.tauxTVA)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.totalHT)}</TableCell>
          </TableRow>
        )),
      )}
    </Grille>
  );
}
