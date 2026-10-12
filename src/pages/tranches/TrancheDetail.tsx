import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Pencil, Plus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ChampsTrace from '../../components/patrimoine/ChampsTrace';
import { BlocFiche } from '../../components/patrimoine/FicheDeclaree';
import { OngletsLigne } from '../../components/FicheShell';
import OngletsTransverses from '../../components/patrimoine/OngletsTransverses';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { Badge, ErrorState, Field, LoadingState } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { getTranche } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatSurface } from '../../lib/format';
import type { TrancheDetailDto } from '../../types';
import GrilleArticles from '../articles/GrilleArticles';
import ActionsTranche from './ActionsTranche';
import { OngletEtages, OngletTerrains } from './OngletsTerrainsEtages';
import { OngletFrais, OngletPlancherCouvert } from './OngletsPlancherFrais';
import { AUTRES, COORDONNEES, DATES, FONCIER, GENERAL, REGLES_1, REGLES_2, REMISES, VISIBILITE } from './champsTranche';

type OngletTranche = 'fiche' | 'terrains' | 'etages' | 'plancher' | 'frais' | 'articles';

const MODULES: { cle: keyof TrancheDetailDto; libelle: string }[] = [
  { cle: 'estEnVente', libelle: 'Vente' },
  { cle: 'estEnLocation', libelle: 'Location' },
  { cle: 'visibleProjet', libelle: 'Projet' },
  { cle: 'visibleAchat', libelle: 'Achat' },
  { cle: 'visibleSav', libelle: 'SAV' },
  { cle: 'visiblePrm', libelle: 'Gestion immo.' },
  { cle: 'visibleRom', libelle: 'Location-vente' },
];

export default function TrancheDetail() {
  const { id = '' } = useParams();
  return <FicheTranche key={id} id={id} />;
}

const ONGLETS: { id: OngletTranche; libelle: string }[] = [
  { id: 'fiche', libelle: 'Fiche' },
  { id: 'terrains', libelle: 'Terrains' },
  { id: 'etages', libelle: 'Étages' },
  { id: 'plancher', libelle: 'Plancher couvert' },
  { id: 'frais', libelle: 'Frais' },
  { id: 'articles', libelle: 'Articles' },
];

function FicheTranche({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTranche(id), [id]);
  const [onglet, setOnglet] = useState<OngletTranche>('fiche');
  // Après « Charger à partir d'une autre tranche », les onglets se relisent (remontés par leur `key`).
  const [version, setVersion] = useState(0);
  const admin = estAdministrateur(useAuth().user);
  const recharger = () => {
    setVersion((v) => v + 1);
    void refetch();
  };

  if (loading && !t) return <PageShell title="Tranche"><LoadingState /></PageShell>;
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
    >
      <div className="flex flex-col gap-3 pt-1">
        <EnteteTranche t={t} admin={admin} onCharge={recharger} />
        <Tabs value={onglet} onValueChange={(v) => setOnglet(v as OngletTranche)} className="flex flex-col gap-3">
          <OngletsLigne onglets={ONGLETS} />
          <TabsContent value="fiche">
            <BlocsTranche t={t} />
          </TabsContent>
          <TabsContent value="terrains">
            <OngletTerrains key={version} trancheId={t.id} admin={admin} />
          </TabsContent>
          <TabsContent value="etages">
            <OngletEtages key={version} trancheId={t.id} admin={admin} />
          </TabsContent>
          <TabsContent value="plancher">
            <OngletPlancherCouvert key={version} trancheId={t.id} admin={admin} apresEnregistrement={() => void refetch()} />
          </TabsContent>
          <TabsContent value="frais">
            <OngletFrais key={version} trancheId={t.id} admin={admin} />
          </TabsContent>
          <TabsContent value="articles">
            <div className="flex min-h-120 flex-col gap-3">
              <GrilleArticles trancheId={t.id} cleOrdre="articles-tranche" />
            </div>
          </TabsContent>
        </Tabs>
        <OngletsTransverses porteur="tranche" id={t.id} />
      </div>
    </PageShell>
  );
}

function EnteteTranche({ t, admin, onCharge }: Readonly<{ t: TrancheDetailDto; admin: boolean; onCharge: () => void }>) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-title font-semibold tracking-tight text-foreground">{t.description}</h2>
      <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
      <span className="text-body text-muted-foreground">{t.projetLibelle ?? t.projetCode}</span>
      {t.standingLibelle && <Badge tone="info">{t.standingLibelle}</Badge>}
      <span className="flex flex-wrap gap-1.5">
        {MODULES.filter((m) => t[m.cle] === true).map((m) => (
          <Badge key={m.cle} tone="neutral">{m.libelle}</Badge>
        ))}
      </span>
      {admin && (
        <span className="ml-auto flex flex-wrap gap-2">
          <ActionsTranche t={t} onCharge={onCharge} />
          <Button variant="outline" size="sm" onClick={() => void navigate(`/tranches/${t.id}/modifier`)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
          <Button size="sm" onClick={() => void navigate(`/articles/nouveau?trancheId=${t.id}`)}>
            <Plus data-icon="inline-start" /> Nouvel article
          </Button>
        </span>
      )}
    </div>
  );
}

/** Blocs calqués sur les onglets de la fiche OMRAN, tirés du catalogue partagé avec le formulaire. */
function BlocsTranche({ t }: Readonly<{ t: TrancheDetailDto }>) {
  const accent = 'var(--sec-tranche)';
  return (
    <div className="flex flex-col gap-3">
      <BlocFiche
        titre="Général"
        defs={GENERAL}
        fiche={t}
        accent={accent}
        suite={
          <>
            <Field label="Programme" value={t.projetLibelle ?? t.projetCode} />
            <Field label="Entité" value={t.entiteLibelle ?? t.entiteCode} />
            <Field label="Plancher couvert" value={t.plancherCouvert ? formatSurface(t.plancherCouvert) : undefined} />
          </>
        }
      />
      <BlocFiche titre="Visibilité par module" defs={VISIBILITE} fiche={t} />
      <BlocFiche titre="Délais" defs={DATES} fiche={t} />
      <BlocFiche titre="Coordonnées" defs={COORDONNEES} fiche={t} />
      <BlocFiche titre="Identification foncière" defs={FONCIER} fiche={t} />
      <BlocFiche titre="Règles de gestion 1" defs={REGLES_1} fiche={t} />
      <BlocFiche titre="Règles de gestion 2" defs={REGLES_2} fiche={t} />
      <BlocFiche titre="Remises anciens clients" defs={REMISES} fiche={t} />
      <BlocFiche
        titre="Autres"
        defs={AUTRES}
        fiche={t}
        suite={<ChampsTrace creePar={t.creePar} creeLe={t.creeLe} modifiePar={t.modifiePar} modifieLe={t.modifieLe} />}
      />
    </div>
  );
}
