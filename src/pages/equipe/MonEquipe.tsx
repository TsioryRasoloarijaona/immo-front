import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import PageShell from '../../components/PageShell';
import RefSelect from '../../components/RefSelect';
import PeriodeFilterBar from '../../components/kpi/PeriodeFilterBar';
import { emptyPeriode, type Periode } from '../../components/kpi/periode';
import TableauCommerciaux from '../../components/equipe/TableauCommerciaux';
import AffectationsEquipe from '../../components/equipe/AffectationsEquipe';
import ListeADistribuer from '../../components/equipe/ListeADistribuer';
import ReaffecterDialog from '../../components/equipe/ReaffecterDialog';
import { EmptyState } from '../../components/ui';
import { getAffectationsEquipe, listCommerciauxEquipe } from '../../lib/api';
import { refetchAllApis, useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { estChefOuExempte } from '../../lib/roles';
import { periodeEffective } from '../../lib/equipe';
import type { CommercialEquipeDto } from '../../types';

function ContenuEquipe() {
  const [periode, setPeriode] = useState<Periode>(emptyPeriode());
  const [projet, setProjet] = useState<string | null>(null);
  const [source, setSource] = useState<CommercialEquipeDto | null>(null);

  const params = { du: periode.du || undefined, au: periode.au || undefined, projet: projet ?? undefined };
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
      <ListeADistribuer
        key={`${periode.du}|${periode.au}|${projet ?? ''}`}
        periode={periode}
        projet={projet}
        commerciaux={membres}
        onFait={fait}
      />
      <TableauCommerciaux data={commerciaux.data} loading={commerciaux.loading} error={commerciaux.error} onOuvrir={setSource} />
      <AffectationsEquipe data={affectations.data} loading={affectations.loading} error={affectations.error} onFait={fait} />
      {source && (
        <ReaffecterDialog
          source={source}
          commerciaux={membres}
          dates={periodeEffective(periode)}
          projet={projet}
          projetLibelle={projetItems.find((p) => p.value === projet)?.label ?? null}
          onClose={() => setSource(null)}
          onFait={fait}
        />
      )}
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
