import { useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../patrimoine/FicheSections';
import FraisTerrain from '../../patrimoine/FraisTerrain';
import GrilleOnglet from '../../patrimoine/GrilleOnglet';
import OngletAudit from '../../patrimoine/OngletAudit';
import PanneauActions from '../../patrimoine/PanneauActions';
import PanneauNotes from '../../patrimoine/PanneauNotes';
import PiecesJointesBloc from '../../patrimoine/PiecesJointesBloc';
import SuperficiesTerrain from '../../patrimoine/SuperficiesTerrain';
import ChampsDe, { PageChamps } from '../../patrimoine/fiche/ChampsDe';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useImprimer, useSuppression } from '../../patrimoine/fiche/outilsFiche';
import { Badge, ErrorState } from '../../ui';
import type { OngletFiche } from '../../FicheShell';
import { fichePdf } from '../../../lib/apiFichesPdf';
import { deleteTerrain, getTerrain } from '../../../lib/apiTerrains';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { grilleContenances, sourceContenances } from '../../../lib/ongletsArticle';
import { useContenances } from '../../../lib/referentiels';
import { aplatir, sectionsTerrain } from '../../../lib/saisieTerrain';
import { useApi } from '../../../lib/useApi';
import type { TerrainDetailDto } from '../../../types/terrains';

const [GENERAL, COUTS, FONCIER, ANOMALIE] = sectionsTerrain(false);

/** Fiche du terrain en fenêtre flottante ; la saisie reste sur `/terrains/:id/modifier`. */
export default function FicheTerrainFenetre({ id, voisins, onFermer }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTerrain(id), [id]);
  const navigate = useNavigate();
  const contenances = useContenances();
  const imprimer = useImprimer(() => fichePdf('terrains', id));
  const { erreur, supprimer } = useSuppression({
    titre: 'Supprimer le terrain',
    message: 'Le terrain, ses frais non validés, contenances, pièces jointes et notes seront supprimés. Continuer ?',
    action: () => deleteTerrain(id),
    apres: onFermer,
  });
  const ouvrirTerrain = (cible: string) => void navigate(`/terrains/${cible}`);

  function onglets(terrain: TerrainDetailDto): OngletFiche[] {
    const vue = aplatir(terrain);
    return [
      {
        id: 'superficies',
        libelle: terrain.estTermine === false ? 'Lotissements' : 'Superficies',
        compteur: terrain.sousTerrains?.length,
        contenu: <SuperficiesTerrain terrain={terrain} onOuvrir={ouvrirTerrain} />,
      },
      {
        id: 'couts',
        libelle: 'Coûts',
        contenu: (
          <div className="flex flex-col gap-4">
            <SectionFiche section={COUTS} source={vue} />
            <FraisTerrain terrain={terrain} onModifie={() => void refetch()} />
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
            <GrilleOnglet source={sourceContenances(terrain.id)} nouvelle={{ nombre: 1 }} {...grilleContenances(contenances.data)} />
          </>
        ),
      },
      { id: 'anomalie', libelle: ANOMALIE.titre, contenu: <SectionFiche section={ANOMALIE} source={vue} /> },
      { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur="article" id={terrain.id} /> },
      { id: 'actions', libelle: 'Actions', contenu: <PanneauActions articleId={terrain.id} /> },
      { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={terrain.id} /> },
      { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="terrain" id={terrain.id} /> },
      { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={terrain.id} /> },
    ];
  }

  return (
    <FenetrePatrimoine
      type="terrain"
      nature="Terrain"
      titre={t?.code || 'Terrain'}
      badge={
        t && (
          <>
            {t.statut && <Badge tone="neutral">{t.statut.description || t.statut.code}</Badge>}
            {t.occupe && <Badge tone="neutral">Occupé</Badge>}
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      etat={{ chargement: loading && !t, erreur: error, pret: !!t, introuvable: "Ce terrain n'existe pas." }}
      erreur={erreur}
      bandeaux={
        t?.parent ? (
          <p className="text-body text-muted-foreground">
            Sous-terrain de{' '}
            <button type="button" onClick={() => t.parent && ouvrirTerrain(t.parent.id)} className="font-medium text-foreground hover:underline">
              {t.parent.code || t.parent.description}
            </button>
          </p>
        ) : undefined
      }
      ruban={(aller) => ({
        propres: [],
        enSuite: t && (
          <>
            {t.sousTerrainsAutorises && (
              <ActionAdmin to={`/terrains/${id}/sous-terrains/nouveau`} libelle="Nouveau sous-terrain" variant="outline" icone={<Plus data-icon="inline-start" />} />
            )}
            <ActionAdmin to={`/terrains/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          </>
        ),
        imprimer,
        piecesJointes: { onClick: () => aller('pieces') },
        supprimer,
      })}
      bande={t && <ChampsDe sections={[GENERAL]} source={aplatir(t)} />}
      entete={t ? [{ id: 'couts', titre: 'Coûts (synthèse)', contenu: <PageChamps sections={[COUTS]} source={aplatir(t)} /> }] : undefined}
      bas={t ? onglets(t) : []}
    />
  );
}
