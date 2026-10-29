import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import ClasseurBas from '../../fiche/ClasseurBas';
import ClasseurEntete from '../../fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import FenetreFiche from '../../fiche/FenetreFiche';
import RubanFiche from '../../fiche/RubanFiche';
import { EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import OngletCommissions from '../../../pages/commissions/OngletCommissions';
import OngletDossiers from '../../../pages/commissions/OngletDossiers';
import OngletFactures from '../../../pages/commissions/OngletFactures';
import { MESSAGE_ACCES_REFUSE, MESSAGE_TRANCHE_INTROUVABLE, lire } from '../../../pages/commissions/lecture';
import { getCommissionTranche, getDroitsCommission } from '../../../lib/apiCommissions';
import { formatCurrency, formatNumber } from '../../../lib/format';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { refetchAllApis, useApi } from '../../../lib/useApi';
import type { CommissionTrancheDto, DroitsCommissionDto } from '../../../types/commissions';

const SANS_DROIT: DroitsCommissionDto = { ecriture: false, suppression: false, impression: false };
const ONGLETS = ['dossiers', 'commissions', 'factures'];

function Synthese({ t }: Readonly<{ t: CommissionTrancheDto }>) {
  return (
    <FieldGrid>
      <Field label="Code" value={t.code} />
      <Field label="Vendu nombre" value={formatNumber(t.vendus)} />
      <Field label="Reste nombre" value={formatNumber(t.restants)} />
      <Field label="Commission générée" value={formatCurrency(t.montantGenere)} />
      <Field label="Commission réglée" value={formatCurrency(t.montantRegle)} />
      <Field label="Reste à régler" value={formatCurrency(t.montantReste)} />
      <Field label="C.A. Stock" value={formatCurrency(t.caStock)} />
      <Field label="C.A. Réalisé" value={formatCurrency(t.caRealise)} />
      <Field label="C.A. Reste" value={formatCurrency(t.caReste)} />
    </FieldGrid>
  );
}

function CorpsTranche({
  t,
  trancheId,
  droits,
  relire,
}: Readonly<{ t: CommissionTrancheDto; trancheId: string; droits: DroitsCommissionDto; relire: () => void }>) {
  const [params] = useSearchParams();
  const demande = params.get('onglet');
  const [onglet, setOnglet] = useState(ONGLETS.find((o) => o === demande) ?? 'dossiers');
  // Les onglets chargent leurs données : seul l'onglet actif est monté. Leurs filtres et boutons de génération restent dans l'onglet.
  return (
    <>
      <RubanFiche
        enregistrer={{ disabled: true, onClick: () => undefined, aide: 'Les commissions se génèrent et se modifient par les boutons des onglets.' }}
        propres={[]}
      />
      <div className="grid shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <BandeFiche>
          <ChampFiche libelle="Code" valeur={t.code} />
          <ChampFiche libelle="Tranche" valeur={t.description} />
        </BandeFiche>
        <ClasseurEntete type="commission" onglets={[{ id: 'synthese', titre: 'Synthèse de la tranche', contenu: <Synthese t={t} /> }]} />
      </div>
      <ClasseurBas
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          {
            id: 'dossiers',
            libelle: 'Dossiers',
            contenu: onglet === 'dossiers' && (
              <div className="flex h-full min-h-0 flex-col p-3">
                <OngletDossiers trancheId={trancheId} ecriture={droits.ecriture} onChange={relire} />
              </div>
            ),
          },
          {
            id: 'commissions',
            libelle: 'Commissions',
            contenu: onglet === 'commissions' && (
              <div className="flex h-full min-h-0 flex-col p-3">
                <OngletCommissions trancheId={trancheId} droits={droits} onChange={relire} />
              </div>
            ),
          },
          {
            id: 'factures',
            libelle: 'Factures',
            contenu: onglet === 'factures' && (
              <div className="flex h-full min-h-0 flex-col p-3">
                <OngletFactures trancheId={trancheId} />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

/** Fiche « Commissions de la tranche » en fenêtre flottante ; l'« id » est la tranche. */
export default function FicheCommissionTrancheFenetre({
  trancheId,
  voisins,
  onFermer,
}: Readonly<{ trancheId: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const tranche = useApi(() => lire(() => getCommissionTranche(trancheId)), [trancheId]);
  const droitsApi = useApi(() => getDroitsCommission(), []);
  const t = tranche.data;

  let corps: ReactNode = <LoadingState />;
  if (tranche.error === MESSAGE_TRANCHE_INTROUVABLE || tranche.error === MESSAGE_ACCES_REFUSE) {
    corps = <EmptyState title={tranche.error} />;
  } else if (tranche.error) {
    corps = (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={tranche.error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void tranche.refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  } else if (t) {
    corps = <CorpsTranche t={t} trancheId={trancheId} droits={droitsApi.data ?? SANS_DROIT} relire={() => {
      void tranche.refetch();
      refetchAllApis();
    }} />;
  }

  return (
    <FenetreFiche
      nature="Commissions de la tranche"
      titre={t ? t.description || t.code || 'Tranche' : 'Tranche'}
      voisins={voisins}
      onFermer={onFermer}
    >
      {corps}
    </FenetreFiche>
  );
}
