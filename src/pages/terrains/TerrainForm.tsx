import { useNavigate, useParams } from 'react-router-dom';
import { Trees } from 'lucide-react';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import PrixArticleSaisie from '../../components/patrimoine/PrixArticleSaisie';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { createSousTerrain, createTerrain, getTerrain, updateTerrain } from '../../lib/apiTerrains';
import { useSaisie } from '../../lib/saisiePatrimoine';
import {
  brouillonTerrain, CHAMPS_PROTEGES_TERRAIN, champsTerrain, corpsTerrain, SECTIONS_SOUS_TERRAIN, sectionsTerrain, useListesTerrain,
} from '../../lib/saisieTerrain';
import { useApi } from '../../lib/useApi';
import AdminGuard from '../utilisateurs/AdminGuard';
import type { TerrainDetailDto } from '../../types/terrains';

/** `/terrains/nouveau`, `/terrains/:id/modifier` et, avec `sousTerrain`, `/terrains/:id/sous-terrains/nouveau` (`:id` = le parent). */
export default function TerrainForm({ sousTerrain = false }: Readonly<{ sousTerrain?: boolean }>) {
  const { id } = useParams();
  let titre = 'Nouveau terrain';
  if (sousTerrain) titre = 'Nouveau sous-terrain';
  else if (id) titre = 'Modifier le terrain';
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Terrains', to: '/terrains' }, { label: titre }]}
      icon={<Trees />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {id ? <TerrainCharge key={id} id={id} sousTerrain={sousTerrain} /> : <SaisieTerrain />}
    </AdminGuard>
  );
}

function TerrainCharge({ id, sousTerrain }: Readonly<{ id: string; sousTerrain: boolean }>) {
  const { data, error } = useApi(() => getTerrain(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return sousTerrain ? <SaisieTerrain parent={data} /> : <SaisieTerrain terrain={data} />;
}

function SaisieTerrain({ terrain, parent }: Readonly<{ terrain?: TerrainDetailDto; parent?: TerrainDetailDto }>) {
  const navigate = useNavigate();
  const sections = parent ? SECTIONS_SOUS_TERRAIN : sectionsTerrain(!terrain);
  const depart = brouillonTerrain(sections, terrain);
  const saisie = useSaisie(champsTerrain(sections), depart);
  const listes = useListesTerrain(String(saisie.brouillon.paysId));
  const occupe = terrain?.occupe === true;
  // « Terminé » ne se change plus sur un sous-terrain ni sur un terrain issu d'une prospection foncière.
  const termineFige = !!terrain && (!!terrain.parent || !!terrain.prospectionFonciereId);
  const verrouilles = [...(occupe ? CHAMPS_PROTEGES_TERRAIN : []), ...(termineFige ? ['estTermine'] : [])];
  // Les villes sont celles du pays : en changer vide la ville.
  const modifierGeneral = (nom: string, valeur: string | boolean) => {
    if (nom === 'paysId') saisie.setBrouillon((b) => ({ ...b, paysId: valeur, villeId: '' }));
    else saisie.modifier(nom, valeur);
  };

  function enregistrer() {
    const corps = corpsTerrain(sections, saisie.brouillon, terrain ? depart : undefined);
    let action: () => Promise<TerrainDetailDto> = () => createTerrain(corps);
    if (terrain) action = () => updateTerrain(terrain.id, corps);
    else if (parent) action = () => createSousTerrain(parent.id, corps);
    void saisie.envoyer(action, (t) => void navigate(`/terrains/${t.id}`));
  }

  return (
    <div className="flex max-w-240 flex-col gap-3">
      {parent && (
        <p className="text-body text-muted-foreground">
          Sous-terrain de <span className="font-medium text-foreground">{parent.code}</span> — société, statut, vocation, catégorie,
          localisation et classification sont repris du parent.
        </p>
      )}
      {occupe && (
        <p role="note" className="text-body text-muted-foreground">
          Terrain affecté : surfaces, prix et titre foncier ne se modifient plus.
        </p>
      )}
      <SectionsSaisie sections={sections.slice(0, 1)} brouillon={saisie.brouillon} onChange={modifierGeneral} listes={listes}
        verrouilles={verrouilles} champErreur={saisie.champErreur} messageErreur={saisie.erreur} />
      <PrixArticleSaisie brouillon={saisie.brouillon} onChange={saisie.modifier} verrouille={occupe} />
      <SectionsSaisie sections={sections.slice(1)} brouillon={saisie.brouillon} onChange={saisie.modifier} listes={listes}
        verrouilles={verrouilles} champErreur={saisie.champErreur} messageErreur={saisie.erreur} />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer} libelle={terrain ? 'Enregistrer' : 'Créer'} />
    </div>
  );
}
