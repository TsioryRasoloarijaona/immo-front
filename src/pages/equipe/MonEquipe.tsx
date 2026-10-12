import { useState } from 'react';
import { Send, UsersRound } from 'lucide-react';
import PageShell from '../../components/PageShell';
import RefSelect from '../../components/RefSelect';
import PeriodeFilterBar from '../../components/kpi/PeriodeFilterBar';
import { emptyPeriode, type Periode } from '../../components/kpi/periode';
import EntonnoirEquipe from '../../components/equipe/EntonnoirEquipe';
import TableauCommerciaux from '../../components/equipe/TableauCommerciaux';
import AffectationsEquipe from '../../components/equipe/AffectationsEquipe';
import DistribuerDialog from '../../components/equipe/DistribuerDialog';
import ReaffecterDialog from '../../components/equipe/ReaffecterDialog';
import { Card, EmptyState, ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getADistribuer, getAffectationsEquipe, getEntonnoirEquipe, listCommerciauxEquipe } from '../../lib/api';
import { refetchAllApis, useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { estChefOuExempte } from '../../lib/roles';
import { formatNumber } from '../../lib/format';
import type { CommercialEquipeDto } from '../../types';

/** Suit la période de l'écran (FEATURE-equipe-commerciale.md §10). */
function ADistribuer({ periode, projet, onDistribuer }: Readonly<{ periode: Periode; projet: string | null; onDistribuer: () => void }>) {
  const { data, error } = useApi(
    () => getADistribuer({ du: periode.du || undefined, au: periode.au || undefined, projet: projet ?? undefined }),
    [periode.du, periode.au, projet],
    'equipe-a-distribuer',
  );
  let texte = '…';
  if (data) {
    texte = data.nombre === 0
      ? 'Aucune pré-prospection en attente sur la période.'
      : `${formatNumber(data.nombre)} en attente · la plus ancienne depuis ${formatNumber(data.agePlusAncienneJours)} j`;
  }
  return (
    <Card
      title="À distribuer"
      action={
        <Button type="button" size="sm" onClick={onDistribuer}>
          <Send data-icon="inline-start" /> Distribuer
        </Button>
      }
    >
      {error ? <ErrorState message={error} /> : <p className="text-body text-foreground">{texte}</p>}
    </Card>
  );
}

function ContenuEquipe() {
  const [periode, setPeriode] = useState<Periode>(emptyPeriode());
  const [projet, setProjet] = useState<string | null>(null);
  const [distribuer, setDistribuer] = useState(false);
  const [source, setSource] = useState<CommercialEquipeDto | null>(null);

  const params = { du: periode.du || undefined, au: periode.au || undefined, projet: projet ?? undefined };
  const entonnoir = useApi(() => getEntonnoirEquipe(params), [periode.du, periode.au, projet], 'equipe-entonnoir');
  const commerciaux = useApi(() => listCommerciauxEquipe(params), [periode.du, periode.au, projet], 'equipe-commerciaux');
  const affectations = useApi(() => getAffectationsEquipe(), [], 'equipe-affectations');

  const projetItems = (affectations.data?.projets ?? []).map((p) => ({ label: `${p.code ?? ''} — ${p.libelle ?? ''}`, value: p.id }));
  const membres = commerciaux.data ?? [];
  const fait = () => refetchAllApis();

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <PeriodeFilterBar value={periode} onChange={setPeriode} />
        </div>
        <div className="w-full lg:w-72">
          <RefSelect id="equipe-projet" value={projet} onChange={setProjet} items={projetItems} placeholder="Tous mes projets" label="Projet" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr]">
        <EntonnoirEquipe data={entonnoir.data} loading={entonnoir.loading} error={entonnoir.error} />
        <ADistribuer periode={periode} projet={projet} onDistribuer={() => setDistribuer(true)} />
      </div>
      <TableauCommerciaux data={commerciaux.data} loading={commerciaux.loading} error={commerciaux.error} onOuvrir={setSource} />
      <AffectationsEquipe data={affectations.data} loading={affectations.loading} error={affectations.error} onFait={fait} />
      {distribuer && <DistribuerDialog periode={periode} projet={projet} commerciaux={membres} onClose={() => setDistribuer(false)} onFait={fait} />}
      {source && <ReaffecterDialog source={source} commerciaux={membres} onClose={() => setSource(null)} onFait={fait} />}
    </div>
  );
}

/** Écran du chef commercial ; la vraie barrière est le 403 du serveur (FEATURE-equipe-commerciale.md). */
export default function MonEquipe() {
  const { user } = useAuth();
  return (
    <PageShell
      title="Mon équipe"
      crumbs={[{ label: 'Ventes' }, { label: 'Mon équipe' }]}
      icon={<UsersRound />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
    >
      {estChefOuExempte(user) ? (
        <ContenuEquipe />
      ) : (
        <EmptyState title="Accès réservé" message="Cet écran est réservé aux chefs commerciaux, à l’administration et à la direction générale." />
      )}
    </PageShell>
  );
}
