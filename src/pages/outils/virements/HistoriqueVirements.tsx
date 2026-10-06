import { useMemo, useState } from 'react';
import { AlertTriangle, Banknote, Download, FileText, Pencil, RotateCcw, Search } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, StatCard } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/format';
import CadreVirements, { ChoixSimple } from './CadreVirements';
import { useNotification } from './useNotification';
import ModifierOrdreDialog from './ModifierOrdreDialog';
import OrdreDetailDialog from './OrdreDetailDialog';
import { STATUT_ORDRE, etatDossier, useVirements, type Ordre } from './donnees';

type FiltreDossier = 'tous' | 'incomplets' | 'complets';

const DOSSIER_ITEMS: { value: FiltreDossier; label: string }[] = [
  { value: 'tous', label: 'Tous les dossiers' },
  { value: 'incomplets', label: 'À compléter' },
  { value: 'complets', label: 'Complets' },
];

type LigneHistorique = Ordre & { societe: string };

/** Historique des ordres émis : bandeau de chiffres, ventilation par société,
 * puis la grille. Un clic sur une ligne ouvre le dossier de pièces. */
export default function HistoriqueVirements() {
  const { ordres, societes } = useVirements();
  const [notification, notifier] = useNotification();
  const [q, setQ] = useState('');
  const [dossier, setDossier] = useState<FiltreDossier>('tous');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [aModifier, setAModifier] = useState<Ordre | null>(null);

  const lignes = useMemo<LigneHistorique[]>(() => {
    const terme = q.trim().toLowerCase();
    return ordres
      .map((o) => ({ ...o, societe: societes.find((s) => s.id === o.societeId)?.nom ?? '—' }))
      .filter((o) => {
        if (dossier !== 'tous' && etatDossier(o).complet !== (dossier === 'complets')) return false;
        if (!terme) return true;
        return [o.numero, o.beneficiaire, o.reference, o.societe].some((v) => v.toLowerCase().includes(terme));
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.numero.localeCompare(a.numero));
  }, [ordres, societes, q, dossier]);

  // Les chiffres portent sur la sélection affichée ; un ordre annulé n'a rien
  // viré et n'entre pas dans les totaux.
  const actifs = lignes.filter((o) => o.statut !== 'annule');
  const total = actifs.reduce((s, o) => s + o.montant, 0);
  const incomplets = lignes.filter((o) => o.statut !== 'annule' && !etatDossier(o).complet).length;
  const parSociete = societes
    .map((s) => ({ nom: s.nom, total: actifs.filter((o) => o.societeId === s.id).reduce((t, o) => t + o.montant, 0) }))
    .filter((s) => s.total > 0);

  const colonnes = useMemo<ColonneGrille<LigneHistorique>[]>(
    () => [
      { nom: 'numero', libelle: 'N°', largeur: 9, classe: 'font-mono font-medium text-foreground' },
      { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 8 },
      { nom: 'societe', libelle: 'Société', largeur: 12 },
      {
        nom: 'beneficiaire',
        libelle: 'Bénéficiaire',
        largeur: 18,
        classe: 'font-medium text-foreground',
        rendu: (r) => (
          <>
            {r.beneficiaire}
            {r.groupe && <span className="ml-1.5 text-micro font-normal text-muted-foreground">groupé {r.groupe}</span>}
          </>
        ),
      },
      { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 11 },
      { nom: 'reference', libelle: 'Référence', largeur: 14, classe: 'text-muted-foreground' },
      {
        nom: 'statut',
        libelle: 'Statut',
        largeur: 8,
        valeur: (r) => STATUT_ORDRE[r.statut].libelle,
        rendu: (r) => <Badge tone={STATUT_ORDRE[r.statut].ton}>{STATUT_ORDRE[r.statut].libelle}</Badge>,
      },
      {
        nom: 'dossier',
        libelle: 'Dossier',
        largeur: 10,
        valeur: (r) => (etatDossier(r).complet ? 'Complet' : 'À compléter'),
        rendu: (r) => {
          const d = etatDossier(r);
          return d.complet ? (
            <Badge tone="success">Complet</Badge>
          ) : (
            <Badge tone="amber">
              {d.fournies}/{d.requises} pièces
            </Badge>
          );
        },
      },
      {
        nom: 'actions',
        libelle: '',
        largeur: 9,
        // La ligne s'ouvre au clic : les boutons ne doivent pas l'ouvrir en plus.
        rendu: (r) => (
          <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Button type="button" variant="ghost" size="icon-xs" title="Pièces du dossier" aria-label={`Pièces de ${r.numero}`} onClick={() => setOuvert(r.id)}>
              <FileText />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" title="Modifier" aria-label={`Modifier ${r.numero}`} onClick={() => setAModifier(r)}>
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Télécharger le PDF"
              aria-label={`Télécharger le PDF de ${r.numero}`}
              onClick={() => notifier('Maquette : aucun PDF archivé.')}
            >
              <Download />
            </Button>
          </div>
        ),
      },
    ],
    [notifier],
  );

  const filtre = q.trim() !== '' || dossier !== 'tous';

  return (
    <CadreVirements ecran="Historique" fullHeight>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un n°, un bénéficiaire…"
            aria-label="Rechercher un ordre"
            className="pl-8"
          />
        </div>
        <ChoixSimple items={DOSSIER_ITEMS} value={dossier} onChange={setDossier} className="w-44" />
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-3">
        <StatCard label={lignes.length > 1 ? 'Ordres' : 'Ordre'} value={String(lignes.length)} icon={<FileText />} />
        <StatCard label="Total viré, toutes sociétés" value={formatCurrency(total)} icon={<Banknote />} sub="Hors ordres annulés" />
        <StatCard
          label={incomplets > 1 ? 'Dossiers à compléter' : 'Dossier à compléter'}
          value={String(incomplets)}
          icon={<AlertTriangle />}
          tone={incomplets > 0 ? 'amber' : 'neutral'}
        />
      </div>

      {parSociete.length > 1 && (
        <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-body text-muted-foreground">
          {parSociete.map((s) => (
            <span key={s.nom}>
              {s.nom} <span className="font-medium text-foreground">{formatCurrency(s.total)}</span>
            </span>
          ))}
        </div>
      )}

      {lignes.length === 0 ? (
        <EmptyState
          title={filtre ? 'Aucun résultat' : 'Aucun ordre'}
          message={filtre ? 'Aucun ordre ne correspond à la recherche.' : "Aucun ordre de virement n'a encore été émis."}
          action={
            filtre ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { setQ(''); setDossier('tous'); }}>
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
            cleOrdre="outils-virements-historique"
            onOuvrir={setOuvert}
            libelleLigne={(r) => `Ouvrir l'ordre ${r.numero}`}
          />
        </div>
      )}

      {ouvert && <OrdreDetailDialog ordreId={ouvert} onClose={() => setOuvert(null)} notifier={notifier} />}
      {aModifier && <ModifierOrdreDialog ordre={aModifier} onClose={() => setAModifier(null)} notifier={notifier} />}
      {notification}
    </CadreVirements>
  );
}
