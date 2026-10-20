import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map as IconePlan, Trash2, Upload } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ImportPlanDialog from '../../components/patrimoine/ImportPlanDialog';
import VuePlan from '../../components/patrimoine/VuePlan';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { getTranche } from '../../lib/api';
import { listPlansTranche, purgerPlansTranche } from '../../lib/apiPlans';
import { useConfirm } from '../../lib/confirmContext';
import { pluriel } from '../../lib/format';
import { useEcriture } from '../../lib/useEcriture';
import { useApi } from '../../lib/useApi';
import type { PlanDto } from '../../types/plans';

export default function PlansTranche() {
  const { id = '' } = useParams();
  return <PlansDeTranche key={id} id={id} />;
}

function PlansDeTranche({ id }: Readonly<{ id: string }>) {
  const tranche = useApi(() => getTranche(id), [id]);
  const plans = useApi(() => listPlansTranche(id), [id]);
  const confirm = useConfirm();
  const { executer } = useEcriture();
  const [planChoisi, setPlanChoisi] = useState<string | null>(null);
  const [importOuvert, setImport] = useState(false);
  const [version, setVersion] = useState(0);

  const liste = plans.data ?? [];
  const plan: PlanDto | undefined = liste.find((p) => p.id === planChoisi) ?? liste.at(0);
  const items = liste.map((p) => ({ label: `${p.etageCode ?? p.code ?? 'Plan'} · ${pluriel(p.nombreTraces, 'tracé')}`, value: p.id }));

  async function purger() {
    const oui = await confirm({
      title: 'Purger les plans',
      message: 'Voulez-vous vraiment supprimer les plans associés à la tranche en cours ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    const fait = await executer(() => purgerPlansTranche(id), 'Le purge des plans est fait avec succès.');
    if (fait) await rafraichir();
  }

  async function rafraichir() {
    setPlanChoisi(null);
    setVersion((v) => v + 1);
    await plans.refetch();
  }

  return (
    <PageShell
      title="Plans"
      crumbs={[{ label: 'Plans', to: '/plans' }, { label: tranche.data?.code || tranche.data?.description || 'Tranche' }]}
      icon={<IconePlan />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionAdmin onClick={() => setImport(true)} libelle="Importer un plan SVG" variant="outline"
            icone={<Upload data-icon="inline-start" />} />
          <ActionAdmin onClick={() => void purger()} libelle="Purger les plans" variant="outline"
            icone={<Trash2 data-icon="inline-start" />} />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 md:px-7">
        {plans.error && <ErrorState message={plans.error} />}
        {!plans.error && !plans.data && <LoadingState />}
        {!plans.error && plans.data && !plan && (
          <EmptyState title="Aucun plan pour cette tranche" message="Un administrateur peut importer un plan SVG par étage." />
        )}
        {!plans.error && plan && (
          <>
            <div className="max-w-xs">
              <Select items={items} value={plan.id} onValueChange={(v) => setPlanChoisi(v || null)}>
                <SelectTrigger aria-label="Étage" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>{items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <VuePlan key={`${plan.id}:${version}`} plan={plan} trancheId={id} />
          </>
        )}
      </div>
      {importOuvert &&<ImportPlanDialog trancheId={id} onClose={() => setImport(false)} onImporte={() => void rafraichir()} />}
    </PageShell>
  );
}
