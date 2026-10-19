import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Calendar, Coins, Pencil, Scale } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import OngletsTransverses from '../../components/patrimoine/OngletsTransverses';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, TogglePill } from '../../components/ui';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import Pagination from '../../components/Pagination';
import { getTranche, listTrancheArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatPercent, formatSurface, libellePrix, libelleTrace } from '../../lib/format';
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

function ValeurRegle({ fmt, value }: Readonly<{ fmt: FieldFmt; value: unknown }>) {
  const empty = <span className="font-normal text-muted-foreground">—</span>;
  // 0 vaut « non défini » pour toutes ces règles, pas une valeur à afficher.
  const positif = typeof value === 'number' && value > 0 ? value : null;
  switch (fmt) {
    case 'percent':
      return typeof value === 'number' && value ? <>{formatPercent(value, 2)}</> : empty;
    case 'currency':
      return positif === null ? <span className="font-normal text-muted-foreground">Non défini</span> : <>{formatCurrency(positif)}</>;
    case 'days':
      return positif === null ? empty : <>{positif} jours</>;
    case 'hours':
      return positif === null ? empty : <>{positif} h</>;
    case 'number':
      return positif === null ? empty : <>{positif}</>;
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
  const { id = '' } = useParams();
  return <FicheTranche key={id} id={id} />;
}

function FicheTranche({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error } = useApi(() => getTranche(id), [id]);
  const [statut, setStatut] = useState<ArticleStatut | 'all'>('all');
  const [articlesPage, setArticlesPage] = useState(0);
  const articles = useApi(
    () => listTrancheArticles(id,{ statut: statut !== 'all' ? statut : undefined }, { page: articlesPage, size: 20 }),
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
    <PageShell
      title={t.description || t.code || 'Tranche'}
      crumbs={[{ label: 'Tranches', to: '/tranches' }, { label: t.code || '' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex gap-2">
          <ActionAdmin to={`/tranches/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          <ActionAdmin to={`/articles/nouveau?trancheId=${id}`} libelle="Nouvel article" />
        </div>
      }
      fullHeight
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
        <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-title font-semibold tracking-tight text-foreground">{t.description}</h2>
          <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
          <span className="text-body text-muted-foreground">
            {t.ville ? <span className="capitalize">{t.ville}</span> : 'Ville non renseignée'}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {t.estEnVente && <Badge tone="info">Vente</Badge>}
            {t.estEnLocation && <Badge tone="info">Location</Badge>}
          </span>
        </div>

        <Card title="Aperçu du projet" accent="var(--sec-tranche)" className="shrink-0">
          <FieldGrid>
            <Field label="Adresse" value={t.adresse} />
            <Field label="Ville" value={t.ville ? <span className="capitalize">{t.ville}</span> : undefined} />
            <Field label="Téléphone" value={t.telephone} />
            <Field label="Email" value={t.email} />
            <Field label="Début des travaux" value={formatDate(t.dateDebutTravaux)} />
            <Field label="Fin des travaux" value={formatDate(t.dateFinTravaux)} />
            <Field label="Début commercialisation" value={formatDate(t.dateDebutCommercialisation)} />
            <Field label="Fin commercialisation" value={formatDate(t.dateFinCommercialisation)} />
            <Field label="Octroi des T.F" value={formatDate(t.dateOctroiTitresFonciers)} />
            <Field label="Programme" value={t.projetCode} />
            <Field label="Créé par" value={libelleTrace(t.creePar, t.creeLe)} />
            <Field label="Modifié par" value={libelleTrace(t.modifiePar, t.modifieLe)} />
          </FieldGrid>
        </Card>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <div>
            <div className="mb-2 flex items-center gap-2 text-body font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="size-3.75" />
              Règles de gestion
            </div>
            {SECTIONS.map((section) => (
              <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card first:mt-0" key={section.title}>
                <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary">
                  {section.icon}
                  <h3 className="text-label font-semibold text-foreground">{section.title}</h3>
                  <span className="text-micro text-muted-foreground">{section.desc}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-px bg-border">
                  {section.fields.map((f) => (
                    <div className="bg-card px-3.5 py-2" key={String(f.key)}>
                      <div className="mb-0.5 text-micro text-muted-foreground">{f.label}</div>
                      <div className="flex items-center gap-1.5 text-label font-semibold text-foreground"><ValeurRegle fmt={f.fmt} value={t[f.key]} /></div>
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
                        if (e.key === 'Enter') void navigate(`/articles/${a.id}`);
                      }}
                    >
                      <TableCell className="font-medium text-foreground">{a.code}</TableCell>
                      <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.typeLibelle}</TableCell>
                      <TableCell className="text-muted-foreground">{a.categorieLibelle}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.area ? formatSurface(a.area) : '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {libellePrix(a.salePrice, a.salePriceFloor) ?? '—'}
                      </TableCell>
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
        <OngletsTransverses porteur="tranche" id={id} />
        </div>
      </div>
    </PageShell>
  );
}
