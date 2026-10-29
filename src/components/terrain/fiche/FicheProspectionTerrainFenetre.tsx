import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../patrimoine/FicheSections';
import HistoriqueProspection from '../../patrimoine/HistoriqueProspection';
import OngletAudit from '../../patrimoine/OngletAudit';
import PanneauNotes from '../../patrimoine/PanneauNotes';
import PiecesJointesBloc from '../../patrimoine/PiecesJointesBloc';
import StatutProspection from '../../patrimoine/StatutProspection';
import SurfacesProspection from '../../patrimoine/SurfacesProspection';
import TransformerEnTerrain from '../../patrimoine/TransformerEnTerrain';
import TransitionsProspection from '../../patrimoine/TransitionsProspection';
import ChampsDe, { PageChamps } from '../../patrimoine/fiche/ChampsDe';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useImprimer, useSuppression } from '../../patrimoine/fiche/outilsFiche';
import { Badge } from '../../ui';
import { Button } from '../../ui/button';
import type { OngletFiche } from '../../FicheShell';
import { fichePdf } from '../../../lib/apiFichesPdf';
import { deleteProspectionTerrain, getProspectionTerrain } from '../../../lib/apiProspectionsTerrain';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { formatDate } from '../../../lib/format';
import { aplatir, SECTION_ANOMALIES, SECTION_ENREGISTREMENT, SECTION_GENERAL, SECTION_PRIX } from '../../../lib/saisieProspectionTerrain';
import { useApi } from '../../../lib/useApi';
import type { ProspectionTerrainDetailDto } from '../../../types/prospectionsTerrain';

const PREFIXE_GOOGLE = 'https://www.google';

function LienCarte({ lien }: Readonly<{ lien?: string | null }>) {
  if (!lien?.startsWith(PREFIXE_GOOGLE)) return null;
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.open(lien, '_blank', 'noopener,noreferrer')}>
      Afficher sur Google Maps
    </Button>
  );
}

/** Fiche de la prospection terrain en fenêtre flottante ; la saisie reste sur `/terrains-prospection/:id/modifier`. */
export default function FicheProspectionTerrainFenetre({ id, voisins, onFermer }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: p, loading, error, refetch } = useApi(() => getProspectionTerrain(id), [id]);
  const navigate = useNavigate();
  const imprimer = useImprimer(() => fichePdf('prospections-terrain', id));
  const { erreur, supprimer } = useSuppression({
    titre: 'Supprimer la prospection',
    message: 'La prospection, ses zones, son historique de statuts, ses pièces jointes et ses notes seront supprimés. Continuer ?',
    action: () => deleteProspectionTerrain(id),
    apres: onFermer,
  });
  const relire = () => void refetch();

  function onglets(pr: ProspectionTerrainDetailDto): OngletFiche[] {
    const vue = aplatir(pr);
    return [
      {
        id: 'superficies',
        libelle: 'Superficies',
        compteur: pr.estAmenage === false ? pr.zones?.length : undefined,
        contenu: <SurfacesProspection prospection={pr} onModifie={relire} />,
      },
      { id: 'enregistrement', libelle: SECTION_ENREGISTREMENT.titre, contenu: <SectionFiche section={SECTION_ENREGISTREMENT} source={vue} /> },
      { id: 'anomalies', libelle: SECTION_ANOMALIES.titre, contenu: <SectionFiche section={SECTION_ANOMALIES} source={vue} /> },
      { id: 'historique', libelle: 'Historique', contenu: <HistoriqueProspection id={pr.id} version={pr.statut?.id} /> },
      { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur="prospection-terrain" id={pr.id} /> },
      { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="prospections-terrain" id={pr.id} /> },
      { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="prospection-terrain" id={pr.id} /> },
      { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={pr.id} /> },
    ];
  }

  return (
    <FenetrePatrimoine
      type="prospection-terrain"
      nature="Prospection terrain"
      titre={p?.code || 'Prospection terrain'}
      badge={
        p && (
          <>
            <StatutProspection prospection={p} />
            {p.dateValiditeStatut && <span className="text-body text-muted-foreground">Valide jusqu'au {formatDate(p.dateValiditeStatut)}</span>}
            {p.estArchivee && <Badge tone="neutral">Archivée</Badge>}
            {p.estTransformee && <Badge tone="success">Transformée</Badge>}
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      trace={p ?? undefined}
      etat={{ chargement: loading && !p, erreur: error, pret: !!p, introuvable: "Cette prospection terrain n'existe pas." }}
      erreur={erreur}
      bandeaux={
        p && (
          <div className="flex flex-wrap items-center gap-2">
            {p.terrainId && (
              <Button type="button" variant="link" size="sm" onClick={() => void navigate(`/terrains/${p.terrainId}`)}>
                Terrain {p.terrainCode}
              </Button>
            )}
            <LienCarte lien={p.lienGoogle} />
          </div>
        )
      }
      ruban={(aller) => ({
        propres: [],
        enSuite: p && (
          <>
            <TransitionsProspection id={p.id} statutId={p.statut?.id} onFait={relire} />
            <TransformerEnTerrain prospection={p} />
            <ActionAdmin to={`/terrains-prospection/${p.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          </>
        ),
        imprimer,
        piecesJointes: { onClick: () => aller('pieces') },
        supprimer,
      })}
      bande={p && <ChampsDe sections={[SECTION_GENERAL]} source={aplatir(p)} />}
      entete={p ? [{ id: 'prix', titre: SECTION_PRIX.titre, contenu: <PageChamps sections={[SECTION_PRIX]} source={aplatir(p)} /> }] : undefined}
      bas={p ? onglets(p) : []}
    />
  );
}
