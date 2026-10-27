import { useParams, useSearchParams } from 'react-router-dom';
import { Percent, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { getCommissionTranche, getDroitsCommission } from '../../lib/apiCommissions';
import { formatCurrency, formatNumber } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { DroitsCommissionDto } from '../../types/commissions';
import OngletCommissions from './OngletCommissions';
import OngletDossiers from './OngletDossiers';
import OngletFactures from './OngletFactures';
import { MESSAGE_ACCES_REFUSE, MESSAGE_TRANCHE_INTROUVABLE, lire } from './lecture';

const ONGLETS = [
  { valeur: 'dossiers', libelle: 'Dossiers' },
  { valeur: 'commissions', libelle: 'Commissions' },
  { valeur: 'factures', libelle: 'Factures' },
] as const;

type Onglet = (typeof ONGLETS)[number]['valeur'];

const SANS_DROIT: DroitsCommissionDto = { ecriture: false, suppression: false, impression: false };

function ongletDe(valeur: string | null): Onglet {
  return ONGLETS.find((o) => o.valeur === valeur)?.valeur ?? 'dossiers';
}

export default function CommissionTranche() {
  const { trancheId = '' } = useParams();
  return <Fiche key={trancheId} trancheId={trancheId} />;
}

function Fiche({ trancheId }: Readonly<{ trancheId: string }>) {
  const [params, setParams] = useSearchParams();
  const onglet = ongletDe(params.get('onglet'));
  const tranche = useApi(() => lire(() => getCommissionTranche(trancheId)), [trancheId]);
  const droitsApi = useApi(() => getDroitsCommission(), []);
  const droits = droitsApi.data ?? SANS_DROIT;
  const t = tranche.data;
  const crumbs = [{ label: 'Ventes' }, { label: 'Commissions', to: '/commissions' }, { label: t?.code ?? 'Tranche' }];

  let contenu;
  if (tranche.error === MESSAGE_TRANCHE_INTROUVABLE || tranche.error === MESSAGE_ACCES_REFUSE) {
    contenu = <EmptyState title={tranche.error} />;
  } else if (tranche.error) {
    contenu = (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={tranche.error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void tranche.refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  } else if (t) {
    contenu = (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-body font-medium text-foreground">{t.description || t.code}</p>
          <FieldGrid>
            <Field label="Code" value={t.code} />
            <Field label="Vendu nombre"value={formatNumber(t.vendus)} />
            <Field label="Reste nombre" value={formatNumber(t.restants)} />
            <Field label="Commission générée" value={formatCurrency(t.montantGenere)} />
            <Field label="Commission réglée" value={formatCurrency(t.montantRegle)} />
            <Field label="Reste à régler" value={formatCurrency(t.montantReste)} />
            <Field label="C.A. Stock" value={formatCurrency(t.caStock)} />
            <Field label="C.A. Réalisé" value={formatCurrency(t.caRealise)} />
            <Field label="C.A. Reste" value={formatCurrency(t.caReste)} />
          </FieldGrid>
        </div>
        <Tabs
          value={onglet}
          onValueChange={(v) => setParams({ onglet: ongletDe(String(v)) }, { replace: true })}
          className="min-h-0 flex-1"
        >
          <TabsList>
            {ONGLETS.map((o) => (
              <TabsTrigger key={o.valeur} value={o.valeur}>
                {o.libelle}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="dossiers" className="flex min-h-0 flex-col">
            {onglet === 'dossiers' && <OngletDossiers trancheId={trancheId} ecriture={droits.ecriture} onChange={() => void tranche.refetch()} />}
          </TabsContent>
          <TabsContent value="commissions" className="flex min-h-0 flex-col">
            {onglet === 'commissions' && <OngletCommissions trancheId={trancheId} droits={droits} onChange={() => void tranche.refetch()} />}
          </TabsContent>
          <TabsContent value="factures" className="flex min-h-0 flex-col">
            {onglet === 'factures' && <OngletFactures trancheId={trancheId} />}
          </TabsContent>
        </Tabs>
      </div>
    );
  } else {
    contenu = <LoadingState />;
  }

  return (
    <PageShell title="Commissions de la tranche" crumbs={crumbs} fullHeight icon={<Percent />} accent="var(--sec-dossier)" accentBg="var(--sec-dossier-bg)">
      <div className="flex h-full min-h-0 flex-col">{contenu}</div>
    </PageShell>
  );
}
