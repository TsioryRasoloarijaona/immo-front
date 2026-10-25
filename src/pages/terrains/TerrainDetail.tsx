import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, Trees } from 'lucide-react';
import CadreFiche from '../../components/CadreFiche';
import FicheShell, { type OngletFiche } from '../../components/FicheShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../components/patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import BoutonImprimerFiche from '../../components/patrimoine/BoutonImprimerFiche';
import FraisTerrain from '../../components/patrimoine/FraisTerrain';
import GrilleOnglet from '../../components/patrimoine/GrilleOnglet';
import OngletAudit from '../../components/patrimoine/OngletAudit';
import PanneauActions from '../../components/patrimoine/PanneauActions';
import PanneauNotes from '../../components/patrimoine/PanneauNotes';
import PiecesJointesBloc from '../../components/patrimoine/PiecesJointesBloc';
import SuperficiesTerrain from '../../components/patrimoine/SuperficiesTerrain';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { deleteTerrain, getTerrain } from '../../lib/apiTerrains';
import { useConfirm } from '../../lib/confirmContext';
import { grilleContenances, sourceContenances } from '../../lib/ongletsArticle';
import { useContenances } from '../../lib/referentiels';
import { aplatir, sectionsTerrain } from '../../lib/saisieTerrain';
import { useApi } from '../../lib/useApi';
import type { TerrainDetailDto } from '../../types/terrains';

const SECTIONS = sectionsTerrain(false);
const [GENERAL, COUTS, FONCIER, ANOMALIE] = SECTIONS;

export default function TerrainDetail() {
  const { id = '' } = useParams();
  return <FicheTerrain key={id} id={id} />;
}

function FicheTerrain({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTerrain(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('general');
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const contenances = useContenances();

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer le terrain',
      message: 'Le terrain, ses frais non validés, contenances, pièces jointes et notes seront supprimés. Continuer ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteTerrain(id);
      void navigate('/terrains');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  if (loading && !t) return <CadreFiche title="Terrain"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche title="Terrain"><ErrorState message={error} /></CadreFiche>;
  if (!t) {
    return (
      <CadreFiche title="Terrain introuvable" crumbs={[{ label: 'Terrains', to: '/terrains' }]}>
        <p>Ce terrain n'existe pas.</p>
      </CadreFiche>
    );
  }

  const vue = aplatir(t);
  const code = t.code || 'Terrain';
  const onglets: OngletFiche[] = [
    { id: 'general', libelle: 'Général', contenu: <SectionFiche section={GENERAL} source={vue} /> },
    {
      id: 'superficies',
      libelle: t.estTermine === false ? 'Lotissements' : 'Superficies',
      compteur: t.sousTerrains?.length,
      contenu: <SuperficiesTerrain terrain={t} onOuvrir={(cible) => void navigate(`/terrains/${cible}`)} />,
    },
    {
      id: 'couts',
      libelle: 'Coûts',
      contenu: (
        <div className="flex flex-col gap-4">
          <SectionFiche section={COUTS} source={vue} />
          <FraisTerrain terrain={t} onModifie={() => void refetch()} />
        </div>
      ),
    },
    { id: 'foncier', libelle: FONCIER.titre, contenu: <SectionFiche section={FONCIER} source={vue} /> },
    {
      id: 'contenances',
      libelle: 'Contenances',
      contenu: (
        <>
          {contenances.error && <ErrorState message={contenances.error} />}
          <GrilleOnglet source={sourceContenances(t.id)} nouvelle={{ nombre: 1 }} {...grilleContenances(contenances.data)} />
        </>
      ),
    },
    { id: 'anomalie', libelle: ANOMALIE.titre, contenu: <SectionFiche section={ANOMALIE} source={vue} /> },
    { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur="article" id={t.id} /> },
    { id: 'actions', libelle: 'Actions', contenu: <PanneauActions articleId={t.id} /> },
    { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={t.id} /> },
    { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="terrain" id={t.id} /> },
    { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={t.id} /> },
  ];

  return (
    <CadreFiche
      title={code}
      typeFiche="Terrain"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Terrains', to: '/terrains' }, { label: code }]}
      icon={<Trees />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={<ActionsTerrain terrain={t} onSupprimer={() => void supprimer()} />}
    >
      <FicheShell
        ongletActif={onglet}
        onOngletChange={setOnglet}
        rembourrer
        identite={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft data-icon="inline-start" /> Retour
            </Button>
            <h2 className="text-title font-semibold tracking-tight text-foreground">{t.code}</h2>
            {t.statut && <Badge tone="neutral">{t.statut.description || t.statut.code}</Badge>}
            {t.occupe && <Badge tone="neutral">Occupé</Badge>}
            {t.parent && (
              <button type="button" onClick={() => t.parent && void navigate(`/terrains/${t.parent.id}`)}
                className="text-body text-muted-foreground hover:text-foreground hover:underline">
                Sous-terrain de <span className="font-medium text-foreground">{t.parent.code || t.parent.description}</span>
              </button>
            )}
            {erreurSuppression && <span role="alert" className="text-label text-destructive">{erreurSuppression}</span>}
          </div>
        }
        onglets={onglets}
      />
    </CadreFiche>
  );
}

function ActionsTerrain({ terrain, onSupprimer }: Readonly<{ terrain: TerrainDetailDto; onSupprimer: () => void }>) {
  return (
    <div className="flex flex-wrap gap-2">
      <BoutonImprimerFiche ressource="terrains" id={terrain.id} />
      <ActionAdmin onClick={onSupprimer} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
      {terrain.sousTerrainsAutorises && (
        <ActionAdmin to={`/terrains/${terrain.id}/sous-terrains/nouveau`} libelle="Nouveau sous-terrain" variant="outline"
          icone={<Plus data-icon="inline-start" />} />
      )}
      <ActionAdmin to={`/terrains/${terrain.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
    </div>
  );
}
