import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Coins, Scale } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, TogglePill } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import Pagination from '../../components/Pagination';
import { getTranche, listTrancheArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import type { ArticleStatut, TrancheDetailDto } from '../../types';

type FieldFmt = 'percent' | 'currency' | 'days' | 'hours' | 'number' | 'toggle';

interface RuleFieldDef {
  key: keyof TrancheDetailDto;
  label: string;
  fmt: FieldFmt;
}

interface RuleSection {
  title: string;
  desc: string;
  icon: ReactNode;
  fields: RuleFieldDef[];
}

const SECTIONS: RuleSection[] = [
  {
    title: 'Seuils financiers',
    desc: 'Acomptes et plafonds de crédit configurés pour cette tranche.',
    icon: <Coins />,
    fields: [
      { key: 'advancePercent', label: "Taux d'avance", fmt: 'percent' },
      { key: 'concretisationPercent', label: 'Taux de concrétisation', fmt: 'percent' },
      { key: 'isWithVerifCredit', label: 'Vérification crédit', fmt: 'toggle' },
      { key: 'creditPercent', label: 'Taux de crédit max', fmt: 'percent' },
      { key: 'delaiMaxEcheance', label: 'Délai échéance max', fmt: 'days' },
      { key: 'delaiSoldePaiement', label: 'Délai solde de paiement', fmt: 'days' },
    ],
  },
  {
    title: 'Pénalités',
    desc: "Pénalités appliquées en cas d'annulation ou de transfert du dossier.",
    icon: <Scale />,
    fields: [
      { key: 'tauxPenaliteAnnulation', label: "Pénalité d'annulation", fmt: 'percent' },
      { key: 'tauxPenaliteAnnulationRemise', label: "Pénalité d'annulation (remisée)", fmt: 'percent' },
      { key: 'penaliteTransfertArticle', label: "Pénalité transfert d'article", fmt: 'currency' },
      { key: 'penaliteTransfertTranche', label: 'Pénalité transfert de tranche', fmt: 'currency' },
      { key: 'penaliteTransfertClient', label: 'Pénalité transfert de client', fmt: 'currency' },
      { key: 'tauxPenalitePremierEngagement', label: '1er engagement', fmt: 'percent' },
      { key: 'tauxPenaliteDeuxiemeEngagement', label: '2ème engagement', fmt: 'percent' },
    ],
  },
  {
    title: 'Légal & planification',
    desc: 'Délais réglementaires et contraintes de visite technique.',
    icon: <Building2 />,
    fields: [
      { key: 'delaiRetractation', label: 'Délai de rétractation', fmt: 'hours' },
      { key: 'delaiPremierEngagement', label: '1er engagement (délai)', fmt: 'days' },
      { key: 'delaiDeuxiemeEngagement', label: '2ème engagement (délai)', fmt: 'days' },
      { key: 'delaiMinimumIntervention', label: 'Délai minimum intervention', fmt: 'days' },
      { key: 'delaiGarantie', label: 'Délai de garantie', fmt: 'days' },
      { key: 'delaiGarantieSupplement', label: 'Délai de garantie additionnel', fmt: 'days' },
      { key: 'delaiNotaireMinutes', label: 'Délai notaire (minute)', fmt: 'days' },
      { key: 'delaiToutSoldeMinutes', label: 'Délai tout-soldé (minute)', fmt: 'days' },
      { key: 'maxVisitNumber', label: 'Nombre de visites max', fmt: 'number' },
    ],
  },
];

function renderValue(fmt: FieldFmt, value: unknown) {
  const empty = <span className="font-normal text-muted-foreground">—</span>;
  switch (fmt) {
    case 'percent':
      return typeof value === 'number' && value ? formatPercent(value, 2) : empty;
    case 'currency':
      return typeof value === 'number' && value > 0 ? formatCurrency(value) : <span className="font-normal text-muted-foreground">Non défini</span>;
    case 'days':
      return typeof value === 'number' && value > 0 ? `${value} jours` : empty;
    case 'hours':
      return typeof value === 'number' && value > 0 ? `${value} h` : empty;
    case 'number':
      return typeof value === 'number' && value > 0 ? String(value) : empty;
    case 'toggle':
      return <TogglePill on={Boolean(value)} />;
    default:
      return empty;
  }
}

const ARTICLE_STATUT_ITEMS: { label: string; value: ArticleStatut | 'all' }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
];

export default function TrancheDetail() {
  const { id } = useParams();
  const { data: t, loading, error } = useApi(() => getTranche(id!), [id]);
  const [statut, setStatut] = useState<ArticleStatut | 'all'>('all');
  const [articlesPage, setArticlesPage] = useState(0);
  const articles = useApi(
    () => listTrancheArticles(id!, { statut: statut !== 'all' ? statut : undefined }, { page: articlesPage, size: 20 }),
    [id, statut, articlesPage],
  );
  const navigate = useNavigate();

  if (loading) return <PageShell title="Tranche"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranche"><ErrorState message={error} /></PageShell>;
  if (!t) {
    return (
      <PageShell title="Tranche introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cette tranche n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t.description || t.code || 'Tranche'} crumbs={[{ label: 'Tranches', to: '/tranches' }, { label: t.code || '' }]}>
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/tranches')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3">
        <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{t.description}</h1>
        <div className="mt-1 text-[13px] text-muted-foreground">
          {t.code} · {t.ville ? <span className="capitalize">{t.ville}</span> : 'Ville non renseignée'}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.estEnVente && <Badge tone="info">Vente</Badge>}
          {t.estEnLocation && <Badge tone="info">Location</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Card title="Aperçu du projet">
          <FieldGrid>
            <Field label="Adresse" value={t.adresse} />
            <Field label="Ville" value={t.ville ? <span className="capitalize">{t.ville}</span> : undefined} />
            <Field label="Téléphone" value={t.telephone} />
            <Field label="Email" value={t.email} />
            <Field label="Début des travaux" value={formatDate(t.dateDebutTravaux)} />
            <Field label="Fin des travaux" value={formatDate(t.dateFinTravaux)} />
            <Field label="Début commercialisation" value={formatDate(t.dateDebutCommercialisation)} />
            <Field label="Fin commercialisation" value={formatDate(t.dateFinCommercialisation)} />
            <Field label="Livraison" value={formatDate(t.dateLivraison)} />
          </FieldGrid>
        </Card>

        <div>
          <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="size-[15px]" />
            Règles de gestion
          </div>
          {SECTIONS.map((section) => (
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card first:mt-0" key={section.title}>
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary">
                {section.icon}
                <div>
                  <h3 className="text-[13.5px] font-semibold text-foreground">{section.title}</h3>
                  <div className="mt-px text-xs text-muted-foreground">{section.desc}</div>
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-px bg-border">
                {section.fields.map((f) => (
                  <div className="bg-card px-5 py-3.5" key={String(f.key)}>
                    <div className="mb-1 text-xs text-muted-foreground">{f.label}</div>
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">{renderValue(f.fmt, t[f.key])}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card
          title={`Articles (${articles.data?.totalElements ?? 0})`}
          action={
            <Select
              items={ARTICLE_STATUT_ITEMS}
              value={statut}
              onValueChange={(v) => {
                setArticlesPage(0);
                setStatut(v as ArticleStatut | 'all');
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ARTICLE_STATUT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        >
          {articles.loading && <LoadingState />}
          {articles.error && <ErrorState message={articles.error} />}
          {articles.data && articles.data.content.length === 0 && <EmptyState title="Aucun article" />}
          {articles.data && articles.data.content.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Superficie</TableHead>
                    <TableHead className="text-right">Prix de vente</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.data.content.map((a) => (
                    <TableRow
                      key={a.id}
                      tabIndex={0}
                      role="link"
                      className="cursor-pointer"
                      onClick={() => navigate(`/articles/${a.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/articles/${a.id}`);
                      }}
                    >
                      <TableCell className="font-medium text-foreground">{a.code}</TableCell>
                      <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.type}</TableCell>
                      <TableCell className="text-muted-foreground">{a.categorie}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.area ? `${a.area} m²` : '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
                      <TableCell>
                        <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'Occupé'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {articles.data && (
            <Pagination
              page={articles.data.page}
              totalPages={articles.data.totalPages}
              totalElements={articles.data.totalElements}
              onPageChange={setArticlesPage}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}
