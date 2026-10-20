import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui';
import { formatNumber, formatPercentValue } from '../../lib/format';
import { lignesVendusLibres, type ChoixSynthese, type LigneVendusLibres } from '../../lib/etatVentes';
import { cn } from '../../lib/utils';
import type { BadgeTone, CompteVendusLibres, EtatVente, SyntheseVendusLibresDto } from '../../types';

const COLONNES: { etat: EtatVente; libelle: string; tone: BadgeTone; nombre: (c: CompteVendusLibres) => number; pct: (c: CompteVendusLibres) => number }[] = [
  { etat: 'LIBRE', libelle: 'Libres', tone: 'info', nombre: (c) => c.libres, pct: (c) => c.pctLibres },
  { etat: 'RESERVE', libelle: 'Réservés', tone: 'amber', nombre: (c) => c.reserves, pct: (c) => c.pctReserves },
  { etat: 'VENDU', libelle: 'Vendus', tone: 'success', nombre: (c) => c.vendus, pct: (c) => c.pctVendus },
];

const CLASSE_NIVEAU: Record<LigneVendusLibres['niveau'], string> = {
  ligne: '',
  'sous-total': 'bg-muted/40 font-semibold',
  total: 'bg-muted/70 font-semibold',
};

function Cellule({
  nombre,
  pct,
  libelle,
  infobulle,
  onChoisir,
}: Readonly<{ nombre: number; pct?: number; libelle: string; infobulle?: string; onChoisir: () => void }>) {
  if (nombre === 0) return <span className="text-muted-foreground">0</span>;
  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-label={`Afficher dans la liste : ${libelle}`}
      title={infobulle ?? 'Afficher ces articles dans la liste'}
      className="inline-flex items-baseline gap-1 rounded px-1 tabular-nums hover:bg-muted hover:text-(--brand)"
    >
      {formatNumber(nombre)}
      {pct !== undefined && <span className="text-micro text-muted-foreground">{formatPercentValue(pct, 1)}</span>}
    </button>
  );
}

function infobulleReserves(c: CompteVendusLibres): string | undefined {
  return c.sansStatut > 0 ? `Dont ${formatNumber(c.sansStatut)} sans statut. Afficher ces articles dans la liste` : undefined;
}

function LigneTableau({ l, onChoisir }: Readonly<{ l: LigneVendusLibres; onChoisir: (choix: ChoixSynthese) => void }> ) {
  const contexte = [l.tranche, l.famille].filter(Boolean).join(' · ');
  return (
    <TableRow className={CLASSE_NIVEAU[l.niveau]}>
      <TableCell>{l.tranche}</TableCell>
      <TableCell className={cn(l.niveau === 'ligne' && 'text-muted-foreground')}>{l.famille}</TableCell>
      {COLONNES.map((c) => (
        <TableCell key={c.etat} className="text-right">
          <Cellule
            nombre={c.nombre(l.compte)}
            pct={c.pct(l.compte)}
            libelle={`${contexte}, ${c.libelle}`}
            infobulle={c.etat === 'RESERVE' ? infobulleReserves(l.compte) : undefined}
            onChoisir={() => onChoisir({ ...l.choix, etat: c.etat })}
          />
        </TableCell>
      ))}
      <TableCell className="text-right">
        <Cellule nombre={l.compte.total} libelle={contexte} onChoisir={() => onChoisir(l.choix)} />
      </TableCell>
    </TableRow>
  );
}

/** Tranche × famille × Libres / Réservés / Vendus ; un clic sur un nombre applique tranche, famille et état à la liste. */
export default function SyntheseVendusLibres({
  synthese,
  onChoisir,
}: Readonly<{ synthese: SyntheseVendusLibresDto; onChoisir: (choix: ChoixSynthese) => void }>) {
  const lignes = lignesVendusLibres(synthese);
  const pied = lignes.filter((l) => l.niveau === 'total');
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tranche</TableHead>
          <TableHead>Famille</TableHead>
          {COLONNES.map((c) => (
            <TableHead key={c.etat} className="text-right">
              <Badge tone={c.tone}>{c.libelle}</Badge>
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes
          .filter((l) => l.niveau !== 'total')
          .map((l) => (
            <LigneTableau key={l.cle} l={l} onChoisir={onChoisir} />
          ))}
      </TableBody>
      <TableFooter>
        {pied.map((l) => (
          <LigneTableau key={l.cle} l={l} onChoisir={onChoisir} />
        ))}
      </TableFooter>
    </Table>
  );
}
