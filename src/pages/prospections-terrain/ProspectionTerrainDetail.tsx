import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPinned, Pencil, Trash2 } from 'lucide-react';
import CadreFiche from '../../components/CadreFiche';
import FicheShell, { type OngletFiche } from '../../components/FicheShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import HistoriqueProspection from '../../components/patrimoine/HistoriqueProspection';
import OngletAudit from '../../components/patrimoine/OngletAudit';
import PanneauNotes from '../../components/patrimoine/PanneauNotes';
import PiecesJointesBloc from '../../components/patrimoine/PiecesJointesBloc';
import StatutProspection from '../../components/patrimoine/StatutProspection';
import SurfacesProspection from '../../components/patrimoine/SurfacesProspection';
import TransformerEnTerrain from '../../components/patrimoine/TransformerEnTerrain';
import TransitionsProspection from '../../components/patrimoine/TransitionsProspection';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { deleteProspectionTerrain, getProspectionTerrain } from '../../lib/apiProspectionsTerrain';
import { useConfirm } from '../../lib/confirmContext';
import { formatDate } from '../../lib/format';
import {
  aplatir, SECTION_ANOMALIES, SECTION_ENREGISTREMENT, SECTION_GENERAL, SECTION_PRIX,
} from '../../lib/saisieProspectionTerrain';
import { errorMessage, useApi } from '../../lib/useApi';
import type { ProspectionTerrainDetailDto } from '../../types/prospectionsTerrain';

const PREFIXE_GOOGLE = 'https://www.google';

export default function ProspectionTerrainDetail() {
  const { id = '' } = useParams();
  return <FicheProspection key={id} id={id} />;
}

function Identite({ p, erreur }: Readonly<{ p: ProspectionTerrainDetailDto; erreur: string | null }>) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Button variant="outline" size="sm" onClick={() => void navigate(-1)}>
        <ArrowLeft data-icon="inline-start" /> Retour
      </Button>
      <h2 className="text-title font-semibold tracking-tight text-foreground">{p.code}</h2>
      <StatutProspection prospection={p} />
      {p.dateValiditeStatut && <span className="text-body text-muted-foreground">Valide jusqu'au {formatDate(p.dateValiditeStatut)}</span>}
      {p.estArchivee && <Badge tone="neutral">Archivée</Badge>}
      {p.estTransformee && <Badge tone="success">Transformée</Badge>}
      {p.terrainId && (
        <Button type="button" variant="link" size="sm" onClick={() => void navigate(`/terrains/${p.terrainId}`)}>
          Terrain {p.terrainCode}
        </Button>
      )}
      {erreur && <span role="alert" className="text-label text-destructive">{erreur}</span>}
    </div>
  );
}

function LienCarte({ lien }: Readonly<{ lien?: string | null }>) {
  if (!lien?.startsWith(PREFIXE_GOOGLE)) return null;
  return (
    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => window.open(lien, '_blank', 'noopener,noreferrer')}>
      Afficher sur Google Maps
    </Button>
  );
}

function FicheProspection({ id }: Readonly<{ id: string }>) {
  const { data: p, loading, error, refetch } = useApi(() => getProspectionTerrain(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('general');
  const [erreur, setErreur] = useState<string | null>(null);

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer la prospection',
      message: 'La prospection, ses zones, son historique de statuts, ses pièces jointes et ses notes seront supprimés. Continuer ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteProspectionTerrain(id);
      void navigate('/terrains-prospection');
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  if (loading && !p) return <CadreFiche title="Prospection terrain"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche title="Prospection terrain"><ErrorState message={error} /></CadreFiche>;
  if (!p) {
    return (
      <CadreFiche title="Prospection introuvable" crumbs={[{ label: 'Prospections terrain', to: '/terrains-prospection' }]}>
        <p>Cette prospection terrain n'existe pas.</p>
      </CadreFiche>
    );
  }

  const vue = aplatir(p);
  const relire = () => {
    setErreur(null);
    void refetch();
  };
  const onglets: OngletFiche[] = [
    {
      id: 'general',
      libelle: 'Général',
      contenu: (
        <>
          <SectionFiche section={SECTION_GENERAL} source={vue} />
          <LienCarte lien={p.lienGoogle} />
        </>
      ),
    },
    { id: 'superficies', libelle: 'Superficies', compteur: p.estAmenage === false ? p.zones?.length : undefined,
      contenu: <SurfacesProspection prospection={p} onModifie={relire} /> },
    { id: 'prix', libelle: SECTION_PRIX.titre, contenu: <SectionFiche section={SECTION_PRIX} source={vue} /> },
    { id: 'enregistrement', libelle: SECTION_ENREGISTREMENT.titre, contenu: <SectionFiche section={SECTION_ENREGISTREMENT} source={vue} /> },
    { id: 'anomalies', libelle: SECTION_ANOMALIES.titre, contenu: <SectionFiche section={SECTION_ANOMALIES} source={vue} /> },
    { id: 'historique', libelle: 'Historique', contenu: <HistoriqueProspection id={p.id} version={p.statut?.id} /> },
    { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur="prospection-terrain" id={p.id} /> },
    { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="prospections-terrain" id={p.id} /> },
    { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={p.id} /> },
  ];

  return (
    <CadreFiche
      title={p.code || 'Prospection terrain'}
      typeFiche="Prospection terrain"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Prospections terrain', to: '/terrains-prospection' }, { label: p.code || '—' }]}
      icon={<MapPinned />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <TransitionsProspection id={p.id} statutId={p.statut?.id} onFait={relire} />
          <TransformerEnTerrain prospection={p} />
          <ActionAdmin onClick={() => void supprimer()} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
          <ActionAdmin to={`/terrains-prospection/${p.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
        </div>
      }
    >
      <FicheShell ongletActif={onglet} onOngletChange={setOnglet} rembourrer identite={<Identite p={p} erreur={erreur} />} onglets={onglets} />
    </CadreFiche>
  );
}
