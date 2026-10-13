import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Banknote, FileText, FolderOpen, Pencil, RotateCcw, Search, Trash2, X } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion, StatCard } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatCurrency, formatNumber } from '../../../lib/format';
import { useApi, useDebouncedValue } from '../../../lib/useApi';
import { listerOrdres, supprimerOrdre } from '../../../lib/virements';
import CadreVirements, { ChoixSimple, type ContexteCharge } from './CadreVirements';
import { rafraichir } from './contexte';
import { STATUT_ORDRE, pluriel } from './donnees';
import ModifierOrdreDialog from './ModifierOrdreDialog';
import OrdreDetailDialog from './OrdreDetailDialog';
import type { Ordre } from './types';
import { useConfirmation } from './useConfirmation';
import { useNotification } from './useNotification';

type FiltreDossier = 'tous' | '0' | '1';

const DOSSIER_ITEMS: { value: FiltreDossier; label: string }[] = [
  { value: 'tous', label: 'Tous les dossiers' },
  { value: '0', label: 'À compléter' },
  { value: '1', label: 'Complets' },
];

/** `DataGrid` veut un `id` texte ; `ordre` garde la forme du fil. */
type LigneHistorique = { id: string; ordre: Ordre };

export default function HistoriqueVirements() {
  return (
    <CadreVirements ecran="Historique" fullHeight>
      {(ctx) => <Historique ctx={ctx} />}
    </CadreVirements>
  );
}

/** Chiffres et ventilation viennent de la réponse serveur, calculés sous les mêmes filtres : ne pas les recalculer. */
function Historique({ ctx }: Readonly<{ ctx: ContexteCharge }>) {
  const { meta, moi, revision } = ctx;
  const toasts = useNotification();
  const [confirmation, demander] = useConfirmation();
  const [params, setParams] = useSearchParams();
  const groupe = params.get('groupe') ?? '';
  const [q, setQ] = useState('');
  const qFiltre = useDebouncedValue(q.trim(), 250);
  const [dossier, setDossier] = useState<FiltreDossier>('tous');
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [aModifier, setAModifier] = useState<Ordre | null>(null);

  const { data, loading, error } = useApi(
    () => listerOrdres({ q: qFiltre || undefined, complet: dossier === 'tous' ? undefined : dossier, groupe: groupe || undefined }),
    [qFiltre, dossier, groupe, revision],
  );

  const lignes = useMemo<LigneHistorique[]>(() => (data?.ordres ?? []).map((o) => ({ id: String(o.id), ordre: o })), [data]);
  const plusieursSocietes = new Set(data?.ordres.map((o) => o.societe_nom)).size > 1;

  async function supprimer(o: Ordre) {
    const ok = await demander({
      titre: `Supprimer ${o.numero} ?`,
      message: `L'ordre ${o.numero} (${o.fournisseur_nom}, ${formatCurrency(o.montant)}) et ses ${pluriel(o.pieces.length, 'pièce jointe', 'pièces jointes')} seront effacés définitivement. Si le virement a simplement été abandonné, le statut « Annulé » garde la trace.`,
      confirmer: 'Supprimer définitivement',
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimerOrdre(o.id);
      rafraichir();
      toasts.notifier(`Ordre ${o.numero} supprimé avec succès.`);
    } catch (e) {
      toasts.notifierErreur(e, "Impossible de supprimer l'ordre");
      rafraichir();
    }
  }

  const colonnes: ColonneGrille<LigneHistorique>[] = [
    { nom: 'beneficiaire', libelle: 'Bénéficiaire', largeur: 17, classe: 'font-medium text-foreground', valeur: (r) => r.ordre.fournisseur_nom },
    { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 8, valeur: (r) => r.ordre.date_virement },
    ...(plusieursSocietes ? [{ nom: 'societe', libelle: 'Société', largeur: 11, valeur: (r: LigneHistorique) => r.ordre.societe_nom ?? '—' }] : []),
    {
      nom: 'statut',
      libelle: 'Statut',
      largeur: 13,
      valeur: (r) => STATUT_ORDRE[r.ordre.statut].libelle,
      rendu: ({ ordre: o }) => (
        <span className="flex flex-wrap items-center gap-1">
          <Badge tone={STATUT_ORDRE[o.statut].ton}>{STATUT_ORDRE[o.statut].libelle}</Badge>
          {o.type_virement === 'salaire' && <Badge tone="info">Salaire</Badge>}
          {o.groupe && (
            <span title={`Virement groupé ${o.groupe}`}>
              <Badge tone="neutral">Groupé</Badge>
            </span>
          )}
        </span>
      ),
    },
    {
      nom: 'dossier',
      libelle: 'Dossier',
      largeur: 12,
      valeur: (r) => (r.ordre.dossier_complet ? 'Complet' : `Manque ${pluriel(r.ordre.manquants.length, 'document')}`),
      titre: (r) => (r.ordre.dossier_complet ? undefined : r.ordre.manquants.join(', ')),
      rendu: ({ ordre: o }) =>
        o.dossier_complet ? (
          <Badge tone="success">Complet</Badge>
        ) : (
          <span title={o.manquants.join(', ')}>
            <Badge tone="amber">Manque {pluriel(o.manquants.length, 'document')}</Badge>
          </span>
        ),
    },
    { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 11, sansSomme: true, valeur: (r) => r.ordre.montant },
    { nom: 'numero', libelle: 'N°', largeur: 10, classe: 'font-mono text-muted-foreground', valeur: (r) => r.ordre.numero },
    { nom: 'reference', libelle: 'Référence', largeur: 12, classe: 'text-muted-foreground', valeur: (r) => r.ordre.reference || '—' },
    {
      nom: 'actions',
      libelle: '',
      largeur: 9,
      rendu: ({ ordre: o }) => (
        // La ligne s'ouvre au clic : les boutons ne doivent pas l'ouvrir en plus.
        <div role="presentation" className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="icon-xs" title="Ouvrir" aria-label={`Ouvrir ${o.numero}`} onClick={() => setOuvert(o.id)}>
            <FolderOpen />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" title="Modifier" aria-label={`Modifier ${o.numero}`} onClick={() => setAModifier(o)}>
            <Pencil />
          </Button>
          {moi.admin && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Supprimer"
              aria-label={`Supprimer ${o.numero}`}
              className="text-destructive hover:text-destructive"
              onClick={() => void supprimer(o)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const nb = data?.ordres.length ?? 0;
  const filtre = q.trim() !== '' || dossier !== 'tous' || groupe !== '';

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N°, bénéficiaire, référence, groupe…"
            aria-label="Rechercher un ordre"
            className="pl-8"
          />
        </div>
        <ChoixSimple items={DOSSIER_ITEMS} value={dossier} onChange={setDossier} className="w-44" />
        {groupe && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-body">
            Virement groupé <span className="font-mono font-medium">{groupe}</span>
            <button
              type="button"
              aria-label="Retirer le filtre de groupe"
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => setParams({}, { replace: true })}
            >
              <X className="size-3.5" />
            </button>
          </span>
        )}
      </div>

      {!data && (error ? <ErrorState message={error} /> : <LoadingState />)}
      {data && (
        <ResultsRegion loading={loading}>
          <div className="grid shrink-0 gap-3 sm:grid-cols-3">
            <StatCard label={nb > 1 ? 'Ordres' : 'Ordre'} value={formatNumber(nb)} icon={<FileText />} />
            <StatCard label="Total viré, toutes sociétés" value={formatCurrency(data.total_montant)} icon={<Banknote />} />
            <StatCard
              label={data.nb_incomplets > 1 ? 'Dossiers à compléter' : 'Dossier à compléter'}
              value={formatNumber(data.nb_incomplets)}
              icon={<AlertTriangle />}
              tone={data.nb_incomplets > 0 ? 'amber' : 'neutral'}
            />
          </div>

          {data.totaux_par_societe.length >= 2 && (
            <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.totaux_par_societe.map((s) => (
                <div key={s.societe_nom} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="truncate text-body font-medium text-foreground">{s.societe_nom}</div>
                  <div className="text-label font-semibold text-foreground">{formatCurrency(s.total_montant)}</div>
                  <div className="text-micro text-muted-foreground">
                    {pluriel(s.nb_ordres, 'ordre')} · {s.nb_incomplets} à compléter
                  </div>
                </div>
              ))}
            </div>
          )}

          {nb === 0 ? (
            <EmptyState
              title="Aucun ordre de virement pour ces critères"
              action={
                filtre ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQ('');
                      setDossier('tous');
                      setParams({}, { replace: true });
                    }}
                  >
                    <RotateCcw data-icon="inline-start" /> Tout afficher
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                rows={lignes}
                colonnes={colonnes}
                cleOrdre={plusieursSocietes ? 'outils-virements-historique' : 'outils-virements-historique-1soc'}
                onOuvrir={(id) => setOuvert(Number(id))}
                libelleLigne={(r) => `Ouvrir l'ordre ${r.ordre.numero}`}
              />
            </div>
          )}
        </ResultsRegion>
      )}

      {ouvert !== null && <OrdreDetailDialog ordreId={ouvert} meta={meta} moi={moi} onClose={() => setOuvert(null)} toasts={toasts} />}
      {aModifier && <ModifierOrdreDialog ordre={aModifier} meta={meta} moi={moi} onClose={() => setAModifier(null)} toasts={toasts} />}
      {confirmation}
      {toasts.noeud}
    </>
  );
}
