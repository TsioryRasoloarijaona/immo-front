import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Coins, FileStack, HardHat, Receipt, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import RefSelect from '../../components/RefSelect';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, ResultsRegion, StatCard } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import {
  DEFAULT_PAGE_SIZE,
  getProjetChantier,
  getReferentielsChantier,
  listLotsProjetChantier,
  nullSiIntrouvable,
} from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { formatCurrency, formatDate, formatPercentValue, pluriel } from '../../lib/format';
import type { LotListItemDto, ProjetChantierDetailDto } from '../../types';
import NotFound from '../NotFound';
import { BandeCartes, SqueletteGrille } from './chantierUi';

const COLONNES_LOTS: ColonneGrille<LotListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'text-muted-foreground' },
  { nom: 'description', libelle: 'Désignation', largeur: 18, classe: 'font-medium text-foreground', titre: (r) => r.description ?? undefined },
  { nom: 'typeDescription', libelle: 'Type', largeur: 8, classe: 'text-muted-foreground' },
  { nom: 'statutDescription', libelle: 'Statut', largeur: 9, classe: 'text-muted-foreground' },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14, classe: 'text-muted-foreground', titre: (r) => r.fournisseurNom ?? undefined },
  { nom: 'dateDebut', libelle: 'Début', type: 'DATE', largeur: 7, classe: 'text-muted-foreground' },
  { nom: 'dateFin', libelle: 'Fin', type: 'DATE', largeur: 7, classe: 'text-muted-foreground' },
  { nom: 'montantTTC', libelle: 'Marché TTC', type: 'MONTANT', largeur: 12, classe: 'text-foreground' },
  { nom: 'cumulDecomptesTTC', libelle: 'Décomptes TTC', type: 'MONTANT', largeur: 12, classe: 'text-muted-foreground' },
  {
    nom: 'avancementPct',
    libelle: 'Avancement',
    type: 'NOMBRE',
    largeur: 7,
    sansSomme: true,
    classe: 'text-muted-foreground',
    rendu: (r) => formatPercentValue(r.avancementPct),
  },
  { nom: 'cumulRetenueGarantie', libelle: 'RG cumulée', type: 'MONTANT', largeur: 11, classe: 'text-muted-foreground' },
  { nom: 'totalFacture', libelle: 'Facturé', type: 'MONTANT', largeur: 12, classe: 'text-muted-foreground' },
  { nom: 'totalRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 12, classe: 'text-(--success)' },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 12, classe: 'text-destructive' },
];

export default function ProjetChantierDetail() {
  const { id = '' } = useParams();
  return <FicheProjet key={id} id={id} />;
}

function FicheProjet({ id }: Readonly<{ id: string }>) {
  const { data: p, loading, error } = useApi(() => nullSiIntrouvable(getProjetChantier(id)), [id]);

  if (loading && !p) return <PageShell title="Projet"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Projet"><ErrorState message={error} /></PageShell>;
  if (!p) return <NotFound />;

  return (
    <PageShell
      title={p.description ?? p.code ?? 'Projet'}
      crumbs={[{ label: 'Projets', to: '/chantier/projets' }, { label: p.code ?? '' }]}
      icon={<HardHat />}
      accent="var(--sec-chantier-projet)"
      accentBg="var(--sec-chantier-projet-bg)"
    >
      <div className="flex flex-col gap-3 pt-1">
        <EnteteProjet p={p} />
        <BandeCartes>
          <StatCard label="Marchés TTC" value={formatCurrency(p.totalMarchesTTC)} sub={`HT ${formatCurrency(p.totalMarchesHT)} · ${pluriel(p.nbLots, 'lot')}`} icon={<FileStack />} />
          <StatCard label="Décomptes TTC" value={formatCurrency(p.totalDecomptesTTC)} sub={pluriel(p.nbDecomptes, 'décompte')} icon={<Receipt />} />
          <StatCard label="Facturé" value={formatCurrency(p.totalFacture)} sub={`Réglé ${formatCurrency(p.totalRegle)}`} icon={<Coins />} tone="success" />
          <StatCard label="Reste à régler" value={formatCurrency(p.totalResteARegler)} icon={<Coins />} tone={p.totalResteARegler > 0 ? 'amber' : 'neutral'} />
        </BandeCartes>
        <Card title="Dates du projet">
          <FieldGrid>
            <Field label="Début" value={formatDate(p.dateDebut)} />
            <Field label="Délai" value={p.delaiJours === null ? null : pluriel(p.delaiJours, 'jour')} />
            <Field label="Fin" value={formatDate(p.dateFin)} />
            <Field label="Début des travaux prévu" value={formatDate(p.dateDebutTravauxPrevue)} />
            <Field label="Fin des travaux prévue" value={formatDate(p.dateFinTravauxPrevue)} />
            <Field label="Début réel des travaux" value={formatDate(p.dateDebutTravauxReelle)} />
            <Field label="Fin réelle des travaux" value={formatDate(p.dateFinTravauxReelle)} />
          </FieldGrid>
        </Card>
        <LotsDuProjet projetId={p.id} />
      </div>
    </PageShell>
  );
}

function EnteteProjet({ p }: Readonly<{ p: ProjetChantierDetailDto }>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-title font-semibold tracking-tight text-foreground">{p.description ?? '—'}</h2>
        <span className="font-mono text-micro text-muted-foreground">{p.code}</span>
        {p.statutDescription && <Badge tone="neutral">{p.statutDescription}</Badge>}
        {p.estCentreDeCouts && <Badge tone="info">Centre de coûts</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-4 text-body text-muted-foreground">
        <span>Société : {p.societeDescription ?? p.societeCode ?? '—'}</span>
        <span>Responsable : {p.responsableNom ?? '—'}</span>
        {p.adresse && <span>{p.adresse}</span>}
      </div>
    </div>
  );
}

function LotsDuProjet({ projetId }: Readonly<{ projetId: string }>) {
  const navigate = useNavigate();
  const referentiels = useApi(() => getReferentielsChantier(), [], 'chantier-referentiels');
  const [statutId, setStatutId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);

  const { data, loading, error } = useApi(
    () =>
      listLotsProjetChantier(
        projetId,
        { statutId: statutId ?? undefined, typeId: typeId ?? undefined, search: debouncedSearch || undefined },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [projetId, statutId, typeId, debouncedSearch, page],
  );
  const filtreActif = Boolean(statutId || typeId || search);

  function reinitialiser() {
    setPage(0);
    setStatutId(null);
    setTypeId(null);
    setSearch('');
  }

  // Plusieurs natures de lot ont un statut « En cours » : la nature lève l'ambiguïté hors « PrjMarket ».
  const statuts = (referentiels.data?.statutsLot ?? []).map((s) => {
    const libelle = s.description ?? s.code ?? '';
    return { label: s.entiteCode && s.entiteCode !== 'PrjMarket' ? `${libelle} (${s.entiteCode})` : libelle, value: s.id };
  });
  const types = (referentiels.data?.typesLot ?? []).map((t) => ({ label: `${t.code ?? ''} ${t.description ?? ''}`.trim(), value: t.id }));

  return (
    <Card title="Lots" padded={false}>
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="min-w-55 flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un code, une désignation, un fournisseur…"
              aria-label="Rechercher un lot"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </InputGroup>
          <RefSelect id="lots-statut" label="Statut" placeholder="Tous" value={statutId} items={statuts} size="sm" onChange={(v) => { setPage(0); setStatutId(v); }} />
          <RefSelect id="lots-type" label="Type" placeholder="Tous" value={typeId} items={types} size="sm" onChange={(v) => { setPage(0); setTypeId(v); }} />
        </div>

        {loading && !data && <SqueletteGrille />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="text-body text-muted-foreground">{pluriel(data.totalElements, 'lot')}</div>
            {data.content.length === 0 ? (
              <EmptyState
                title={filtreActif ? 'Aucun résultat' : 'Aucun lot'}
                message={filtreActif ? 'Aucun lot ne correspond aux filtres.' : "Ce projet n'a aucun lot."}
                action={
                  filtreActif ? (
                    <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-w-0 overflow-auto rounded-lg border border-border">
                <DataGrid
                  cleOrdre="chantier-lots"
                  rows={data.content}
                  colonnes={COLONNES_LOTS}
                  onOuvrir={(lotId) => void navigate(`/chantier/lots/${lotId}`)}
                  libelleLigne={(r) => `Ouvrir le lot ${r.code ?? r.id}`}
                />
              </div>
            )}
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </ResultsRegion>
        )}
      </div>
    </Card>
  );
}
