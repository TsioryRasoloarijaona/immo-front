import { Badge } from '../../ui';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { echeanceCategorieTone } from '../../../lib/domain';
import { formatCurrency, formatDate } from '../../../lib/format';
import { erreurLigne, repartir, resteARepartir, totalAffecte, type Saisies } from '../../../lib/repartitionReglement';
import type { EcheanceDto } from '../../../types';

function LigneAffectation({
  echeance,
  saisie,
  onSaisie,
}: Readonly<{
  echeance: EcheanceDto;
  /** `undefined` = ligne décochée. */
  saisie: string | undefined;
  onSaisie: (saisie: string | undefined) => void;
}>) {
  const cochee = saisie !== undefined;
  const erreur = cochee ? erreurLigne(saisie, echeance.reste) : null;
  const libelle = echeance.categorie || echeance.description || 'Échéance';
  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          aria-label={`Affecter à ${libelle} du ${formatDate(echeance.dateEcheance)}`}
          checked={cochee}
          onChange={(e) => onSaisie(e.target.checked ? String(echeance.reste ?? '') : undefined)}
        />
      </TableCell>
      <TableCell>
        <Badge tone={echeanceCategorieTone(echeance.categorie)}>{libelle}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(echeance.dateEcheance)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(echeance.reste)}</TableCell>
      <TableCell className="w-36">
        <Input
          type="number"
          min={0}
          step="0.01"
          aria-label={`Montant affecté à ${libelle}`}
          aria-invalid={erreur !== null}
          disabled={!cochee}
          value={saisie ?? ''}
          onChange={(e) => onSaisie(e.target.value)}
          className="h-6 text-right tabular-nums"
        />
        {erreur && <p className="mt-0.5 text-micro text-destructive">{erreur}</p>}
      </TableCell>
    </TableRow>
  );
}

/**
 * Tableau « cases + montants » d'OMRAN : cocher préremplit le reste dû, « Répartir » remplit les plus anciennes
 * d'abord. `montant` = ce qu'il y a à répartir (montant du règlement, ou son reste à affecter).
 */
export default function TableauAffectations({
  echeances,
  saisies,
  onChange,
  montant,
  libelleMontant,
}: Readonly<{
  echeances: readonly EcheanceDto[];
  saisies: Saisies;
  onChange: (saisies: Saisies) => void;
  montant: number | null;
  libelleMontant: string;
}>) {
  const reste = resteARepartir(montant, saisies);

  function saisir(echeanceId: string, saisie: string | undefined) {
    const autres = Object.entries(saisies).filter(([id]) => id !== echeanceId);
    onChange(Object.fromEntries(saisie === undefined ? autres : [...autres, [echeanceId, saisie]]));
  }

  if (echeances.length === 0) {
    return <p className="text-body text-muted-foreground">Aucune échéance restant due sur ce dossier.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-muted-foreground">Échéances restant dues</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={montant === null || montant <= 0}
          onClick={() => onChange(repartir(echeances, montant ?? 0))}
        >
          Répartir
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-6" />
              <TableHead>Catégorie</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Reste dû</TableHead>
              <TableHead className="text-right">Montant affecté</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {echeances.map((e) => (
              <LigneAffectation key={e.id} echeance={e} saisie={saisies[e.id]} onSaisie={(s) => saisir(e.id, s)} />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-body tabular-nums text-muted-foreground">
        {libelleMontant} {formatCurrency(montant ?? 0)} · Affecté {formatCurrency(totalAffecte(saisies))} · Reste à affecter{' '}
        <span className={reste < 0 ? 'font-semibold text-destructive' : 'font-semibold text-foreground'}>
          {formatCurrency(reste)}
        </span>
      </p>
    </div>
  );
}
