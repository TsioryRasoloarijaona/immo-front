import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui';
import { formatNumber, formatPercent } from '../../lib/format';
import {
  libelleStatutVente,
  lignesSynthese,
  toneStatutVente,
  type ChoixSynthese,
  type LigneSyntheseAffichee,
} from '../../lib/etatVentes';
import { cn } from '../../lib/utils';
import type { SyntheseEtatVentesDto } from '../../types';

const CLASSE_NIVEAU: Record<LigneSyntheseAffichee['niveau'], string> = {
  ligne: '',
  'sous-total': 'bg-muted/40 font-medium',
  total: 'bg-muted/70 font-semibold',
};

function Cellule({
  nombre,
  total,
  libelle,
  onChoisir,
}: Readonly<{ nombre: number; total?: number; libelle: string; onChoisir: () => void }>) {
  if (nombre === 0) return <span className="text-muted-foreground">0</span>;
  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-label={`Afficher dans la liste : ${libelle}`}
      title="Afficher ces articles dans la liste"
      className="inline-flex items-baseline gap-1 rounded px-1 tabular-nums hover:bg-muted hover:text-(--brand)"
    >
      {formatNumber(nombre)}
      {total !== undefined && <span className="text-micro text-muted-foreground">{formatPercent(nombre / total)}</span>}
    </button>
  );
}

/** Tranche × catégorie × statut ; un clic sur un nombre applique tranche, catégorie et statut à la liste. */
export default function SyntheseEtatVentes({
  synthese,
  onChoisir,
}: Readonly<{ synthese: SyntheseEtatVentesDto; onChoisir: (choix: ChoixSynthese) => void }>) {
  const lignes = lignesSynthese(synthese);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tranche</TableHead>
          <TableHead>Catégorie</TableHead>
          {synthese.statuts.map((s) => (
            <TableHead key={s.code} className="text-right">
              <Badge tone={toneStatutVente(s.code, s.libelle)}>{libelleStatutVente(synthese.statuts, s.code)}</Badge>
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes.map((l) => {
          const contexte = [l.tranche, l.categorie].filter(Boolean).join(' · ');
          return (
            <TableRow key={l.cle} className={CLASSE_NIVEAU[l.niveau]}>
              <TableCell>{l.tranche}</TableCell>
              <TableCell className={cn(l.niveau === 'ligne' && 'text-muted-foreground')}>{l.categorie}</TableCell>
              {synthese.statuts.map((s) => (
                <TableCell key={s.code} className="text-right">
                  <Cellule
                    nombre={l.parStatut[s.code] ?? 0}
                    total={l.total}
                    libelle={`${contexte}, ${libelleStatutVente(synthese.statuts, s.code)}`}
                    onChoisir={() => onChoisir({ ...l.choix, statut: s.code })}
                  />
                </TableCell>
              ))}
              <TableCell className="text-right">
                <Cellule nombre={l.total} libelle={contexte} onChoisir={() => onChoisir(l.choix)} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
