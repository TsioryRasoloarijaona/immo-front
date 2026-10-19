import { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, EmptyState, ErrorState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { listActionnaires } from '../../lib/apiEntites';
import { formatNumber, formatPercent } from '../../lib/format';
import { valeurFil, type ChampLigne, type RangeeActionnaire } from '../../lib/lignesActionnaires';
import { useApi } from '../../lib/useApi';

/** Lignes d'actionnaires d'une entité ou d'un groupe ; saisissables quand `onChange` est fourni. */
export default function LignesActionnaires({ titre, champ, rangees, onChange }: Readonly<{
  titre: string;
  champ: ChampLigne;
  rangees: RangeeActionnaire[];
  onChange?: (rangees: RangeeActionnaire[]) => void;
}>) {
  const edition = onChange !== undefined;
  const actionnaires = useApi(() => (edition ? listActionnaires() : Promise.resolve([])), [edition]);
  const items = (actionnaires.data ?? []).map((a) => ({ label: `${a.code ?? ''} — ${a.description ?? ''}`, value: a.id }));
  const compteur = useRef(0);
  const afficher = (n: number) => (champ === 'pourcentage' ? formatPercent(n, 2) : formatNumber(n));
  const total = rangees.reduce((s, r) => s + valeurFil(r, champ), 0);

  function changer(cle: string, modif: Partial<RangeeActionnaire>) {
    onChange?.(rangees.map((r) => (r.cle === cle ? { ...r, ...modif } : r)));
  }

  function ajouter() {
    compteur.current += 1;
    onChange?.([...rangees, { cle: `n${compteur.current}`, actionnaireId: '', libelle: '', saisie: '' }]);
  }

  const libelleValeur = champ === 'pourcentage' ? 'Pourcentage (%)' : 'Nombre de parts';
  return (
    <Card title={titre} action={edition && (
      <Button type="button" size="sm" variant="outline" onClick={ajouter}><Plus data-icon="inline-start" /> Ajouter</Button>
    )}>
      {actionnaires.error && <ErrorState message={actionnaires.error} />}
      {rangees.length === 0 ? <EmptyState title="Aucun actionnaire" /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actionnaire</TableHead>
              <TableHead className="text-right">{libelleValeur}</TableHead>
              {edition && <TableHead><span className="sr-only">Retirer</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rangees.map((r) => (
              <TableRow key={r.cle}>
                <TableCell>
                  {edition ? (
                    <Select items={items} value={r.actionnaireId || null} onValueChange={(v) => changer(r.cle, { actionnaireId: v ?? '' })}>
                      <SelectTrigger aria-label="Actionnaire" className="h-7 min-w-56"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : r.libelle}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {edition ? (
                    <Input type="number" inputMode="decimal" step={champ === 'pourcentage' ? 'any' : 1} min={0} aria-label={libelleValeur} value={r.saisie}
                      className="ml-auto h-7 w-32" onChange={(e) => changer(r.cle, { saisie: e.target.value })} />
                  ) : afficher(valeurFil(r, champ))}
                </TableCell>
                {edition && (
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer la ligne"
                      onClick={() => onChange(rangees.filter((x) => x.cle !== r.cle))}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{afficher(total)}</TableCell>
              {edition && <TableCell />}
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </Card>
  );
}
