import { useMemo, useState } from 'react';
import { Ban, FileText, Pencil, Wallet } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion, StatCard } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatCurrency, formatNumber } from '../../../lib/format';
import { lienRecuSyndic, listerPaiementsSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { ChoixSimple } from '../virements/CadreVirements';
import { useNotification } from '../virements/useNotification';
import ActionPaiementDialog, { type ActionPaiement } from './ActionPaiementDialog';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import { MODE_ITEMS, MODE_PAIEMENT } from './donnees';
import type { ModePaiement, PaiementListe } from './types';
import { useExercice } from './useExercice';

const PAR_PAGE = 50;
type FiltreMode = ModePaiement | 'tous';
const MODES: { value: FiltreMode; label: string }[] = [{ value: 'tous', label: 'Tous les modes' }, ...MODE_ITEMS];

export default function PaiementsSyndic() {
  return (
    <CadreSyndic ecran="Paiements" fullHeight>
      {(ctx) => <Liste ctx={ctx} />}
    </CadreSyndic>
  );
}

function Liste({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const toasts = useNotification();
  const { exercice, setExercice, items } = useExercice(ctx.revision);
  const [mode, setMode] = useState<FiltreMode>('tous');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ paiement: PaiementListe; action: ActionPaiement } | null>(null);
  const { data, loading, error } = useApi(
    () => listerPaiementsSyndic({ exercice: exercice ?? undefined, mode: mode === 'tous' ? undefined : mode, page, par_page: PAR_PAGE }),
    [exercice, mode, page, ctx.revision],
  );
  const lignes = useMemo(() => data?.paiements ?? [], [data]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.par_page)) : 1;

  const colonnes: ColonneGrille<PaiementListe>[] = [
    { nom: 'numero', libelle: 'N°', largeur: 10, classe: 'font-mono font-medium text-foreground' },
    { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 8 },
    { nom: 'appartement', libelle: 'Appartement', largeur: 9, classe: 'font-mono' },
    { nom: 'proprietaires', libelle: 'Propriétaire(s)', largeur: 18, valeur: (p) => p.payeur ?? p.proprietaires },
    { nom: 'mode', libelle: 'Mode', largeur: 8, valeur: (p) => MODE_PAIEMENT[p.mode] },
    { nom: 'montant_utile', libelle: 'Compte pour', type: 'MONTANT', largeur: 10, sansSomme: true },
    {
      nom: 'statut',
      libelle: 'Statut',
      largeur: 11,
      valeur: (p) => (p.annule ? 'Annulé' : 'Encaissé'),
      titre: (p) => p.motif_annulation ?? undefined,
      rendu: (p) => (
        <span className="flex flex-wrap gap-1">
          {p.annule ? <Badge tone="warning">Annulé</Badge> : <Badge tone="success">Encaissé</Badge>}
          {p.corrections !== 0 && <Badge tone="info">Corrigé</Badge>}
          {p.recu_groupe && <Badge tone="neutral">Reçu groupé</Badge>}
        </span>
      ),
    },
    {
      nom: 'actions',
      libelle: '',
      largeur: 9,
      rendu: (p) => (
        <div role="presentation" className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {p.recu_numero && (
            <a href={lienRecuSyndic(p.recu_numero)} target="_blank" rel="noreferrer" title={`Reçu ${p.recu_numero}`} aria-label={`Reçu ${p.recu_numero}`} className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
              <FileText className="size-3.5" />
            </a>
          )}
          {ctx.admin && !p.annule && (
            <>
              <Button type="button" variant="ghost" size="icon-xs" title="Corriger" aria-label={`Corriger ${p.numero}`} onClick={() => setAction({ paiement: p, action: 'corriger' })}>
                <Pencil />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" title="Annuler" aria-label={`Annuler ${p.numero}`} className="text-destructive hover:text-destructive" onClick={() => setAction({ paiement: p, action: 'annuler' })}>
                <Ban />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {exercice && items.length > 0 && (
          <ChoixSimple items={items} value={exercice} onChange={(v) => { setExercice(v); setPage(1); }} className="w-52" />
        )}
        <ChoixSimple items={MODES} value={mode} onChange={(v) => { setMode(v); setPage(1); }} className="w-44" />
      </div>

      {!data && (error ? <ErrorState message={error} /> : <LoadingState />)}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="grid shrink-0 gap-3 sm:grid-cols-2">
            <StatCard label={data.total > 1 ? 'Paiements' : 'Paiement'} value={formatNumber(data.total)} icon={<FileText />} />
            <StatCard label="Ce qu’ils comptent, annulations déduites" value={formatCurrency(data.total_utile)} icon={<Wallet />} />
          </div>
          {lignes.length === 0 ? (
            <EmptyState title="Aucun paiement pour ces critères" />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid rows={lignes} colonnes={colonnes} cleOrdre="outils-syndic-paiements" />
            </div>
          )}
          {pages > 1 && (
            <div className="flex shrink-0 items-center justify-end gap-2 text-body">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
                Précédents
              </Button>
              <span className="text-muted-foreground">Page {page} sur {pages}</span>
              <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>
                Suivants
              </Button>
            </div>
          )}
        </ResultsRegion>
      )}

      {action && <ActionPaiementDialog paiement={action.paiement} action={action.action} onClose={() => setAction(null)} toasts={toasts} />}
      {toasts.noeud}
    </>
  );
}
