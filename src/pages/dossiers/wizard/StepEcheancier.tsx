import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Badge, Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency } from '../../../lib/format';
import {
  FINANCING_CATEGORIES,
  FINANCING_STATE_LABEL,
  FINANCING_STATE_TONE,
  financingLinesTotal,
  financingValidationState,
  isCoreFinancingCategory,
  lineRemaining,
  lineSettled,
  newPayment,
} from '../../../lib/financing';
import { cn } from '../../../lib/utils';
import type { EcheancierLine } from '../../../types';

// Merged "Plan de financement" + "Échéancier" step — each category line
// carries its own montant/réglé/reste settlement tracking, an invoice
// reference, and expandable payment sub-lines. See
// instructions/FIX-dossier-vente-corrections.md §3.
export default function StepEcheancier({
  lines,
  target,
  touched,
  onChange,
  onRegenerate,
}: {
  lines: EcheancierLine[];
  target: number;
  touched: boolean;
  onChange: (lines: EcheancierLine[]) => void;
  /** Recomputes the default plan from scratch (signal + syndic rule). */
  onRegenerate: () => void;
}) {
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const total = financingLinesTotal(lines);
  const state = financingValidationState(total, target);
  const coreCount = lines.filter((l) => isCoreFinancingCategory(l.categorie)).length;
  const categoryItems = FINANCING_CATEGORIES.map((c) => ({ label: c.label, value: c.code }));

  function updateLine(id: string, patch: Partial<EcheancierLine>) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    onChange([
      ...lines,
      { id: crypto.randomUUID(), categorie: FINANCING_CATEGORIES[0].code, montant: 0, date: null, invoiceRef: '', notes: '', payments: [] },
    ]);
  }

  function removeLine(id: string) {
    onChange(lines.filter((l) => l.id !== id));
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addPayment(line: EcheancierLine) {
    updateLine(line.id, { payments: [...line.payments, newPayment()] });
  }

  function updatePayment(line: EcheancierLine, paymentId: string, patch: Partial<EcheancierLine['payments'][number]>) {
    updateLine(line.id, { payments: line.payments.map((p) => (p.id === paymentId ? { ...p, ...patch } : p)) });
  }

  function removePayment(line: EcheancierLine, paymentId: string) {
    updateLine(line.id, { payments: line.payments.filter((p) => p.id !== paymentId) });
  }

  async function handleRegenerate() {
    if (touched) {
      const ok = await confirm({
        title: 'Régénérer la répartition par défaut',
        message: 'Cette action remplace toutes les lignes actuelles de l\'échéancier par la répartition par défaut. Les modifications manuelles seront perdues. Continuer ?',
      });
      if (!ok) return;
    }
    onRegenerate();
  }

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-[14.5px] font-semibold text-foreground">Échéancier</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Répartition du prix entre les sources de financement et suivi de règlement, ligne par ligne.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRegenerate}>
          <RefreshCcw data-icon="inline-start" /> Régénérer la répartition par défaut
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Réglé</TableHead>
            <TableHead className="text-right">Reste</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Réf. facture</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const isLastCore = isCoreFinancingCategory(line.categorie) && coreCount <= 1;
            const regle = lineSettled(line);
            const reste = lineRemaining(line);
            const isOpen = Boolean(expanded[line.id]);
            return (
              <Fragment key={line.id}>
                <TableRow>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => toggleExpanded(line.id)} aria-label="Voir les paiements">
                      {isOpen ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select items={categoryItems} value={line.categorie} onValueChange={(v) => updateLine(line.id, { categorie: v as string })}>
                      <SelectTrigger size="sm" className="w-full min-w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categoryItems.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      className="ml-auto w-[130px] text-right tabular-nums"
                      value={line.montant || ''}
                      onChange={(e) => updateLine(line.id, { montant: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(regle)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums font-medium', reste > 0 ? 'text-foreground' : 'text-[var(--success)]')}>
                    {formatCurrency(reste)}
                  </TableCell>
                  <TableCell>
                    <Input type="date" className="w-[145px]" value={line.date ?? ''} onChange={(e) => updateLine(line.id, { date: e.target.value || null })} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="N° facture" className="w-[120px]" value={line.invoiceRef ?? ''} onChange={(e) => updateLine(line.id, { invoiceRef: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Optionnel" value={line.notes} onChange={(e) => updateLine(line.id, { notes: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLine(line.id)}
                      disabled={isLastCore}
                      title={isLastCore ? 'Au moins une ligne de financement doit rester' : 'Supprimer'}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="bg-muted/30 py-3">
                      <div className="flex flex-col gap-2 pl-8">
                        <div className="text-[11.5px] font-medium text-muted-foreground">Paiements de cette ligne</div>
                        {line.payments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Aucun paiement enregistré.</p>
                        ) : (
                          line.payments.map((p) => (
                            <div key={p.id} className="flex flex-wrap items-center gap-2">
                              <Input type="date" className="w-[145px]" value={p.date ?? ''} onChange={(e) => updatePayment(line, p.id, { date: e.target.value || null })} />
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                className="w-[130px] text-right tabular-nums"
                                value={p.montant || ''}
                                onChange={(e) => updatePayment(line, p.id, { montant: Number(e.target.value) || 0 })}
                              />
                              <Input
                                placeholder="Notes (optionnel)"
                                className="min-w-[160px] flex-1"
                                value={p.notes ?? ''}
                                onChange={(e) => updatePayment(line, p.id, { notes: e.target.value })}
                              />
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removePayment(line, p.id)} aria-label="Supprimer le paiement">
                                <Trash2 className="text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => addPayment(line)}>
                          <Plus data-icon="inline-start" /> Ajouter un paiement
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <div className="p-3.5">
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus data-icon="inline-start" /> Ajouter une ligne
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-4">
        <div className="text-[12.5px] text-muted-foreground">
          Total financement (Avance/Autofinancement/Crédit) — cible : <span className="font-medium text-foreground">{formatCurrency(target)}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold tabular-nums text-foreground">{formatCurrency(total)}</span>
          <Badge tone={FINANCING_STATE_TONE[state]}>{FINANCING_STATE_LABEL[state]}</Badge>
        </div>
      </div>
    </Card>
  );
}
