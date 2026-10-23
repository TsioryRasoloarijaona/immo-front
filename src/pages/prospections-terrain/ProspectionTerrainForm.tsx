import { useNavigate, useParams } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { createProspectionTerrain, getProspectionTerrain, updateProspectionTerrain } from '../../lib/apiProspectionsTerrain';
import { useSaisie } from '../../lib/saisiePatrimoine';
import {
  brouillonProspection, CHAMPS_PROSPECTION, corpsProspection, estSaisieApercu, SECTION_ANOMALIES, SECTION_BRUT, SECTION_ENREGISTREMENT,
  SECTION_GENERAL, SECTION_PRIX, SECTION_SUPERFICIES, useApercuSurfaces, useListesProspection,
} from '../../lib/saisieProspectionTerrain';
import { useApi } from '../../lib/useApi';
import AdminGuard from '../utilisateurs/AdminGuard';
import type { ProspectionTerrainDetailDto } from '../../types/prospectionsTerrain';

/** `/terrains-prospection/nouveau` et `/terrains-prospection/:id/modifier` : Administrateur seul. */
export default function ProspectionTerrainForm() {
  const { id } = useParams();
  const titre = id ? 'Modifier la prospection terrain' : 'Nouvelle prospection terrain';
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Prospections terrain', to: '/terrains-prospection' }, { label: titre }]}
      icon={<MapPinned />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {id ? <ProspectionCharge key={id} id={id} /> : <SaisieProspection />}
    </AdminGuard>
  );
}

function ProspectionCharge({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getProspectionTerrain(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <SaisieProspection prospection={data} />;
}

function SaisieProspection({ prospection }: Readonly<{ prospection?: ProspectionTerrainDetailDto }>) {
  const navigate = useNavigate();
  const depart = brouillonProspection(prospection);
  const saisie = useSaisie(CHAMPS_PROSPECTION, depart);
  const apercu = useApercuSurfaces(saisie.brouillon, saisie.setBrouillon);
  const listes = useListesProspection(String(saisie.brouillon.paysId));
  const brut = saisie.brouillon.estAmenage === false;

  // Les villes sont celles du pays : en changer vide la ville.
  function modifier(nom: string, valeur: string | boolean) {
    if (nom === 'paysId') saisie.setBrouillon((b) => ({ ...b, paysId: valeur, villeId: '' }));
    else if (estSaisieApercu(nom) && typeof valeur === 'string') apercu.modifier(nom, valeur);
    else saisie.modifier(nom, valeur);
  }

  function enregistrer() {
    const corps = corpsProspection(saisie.brouillon, prospection ? depart : undefined);
    const action = prospection ? () => updateProspectionTerrain(prospection.id, corps) : () => createProspectionTerrain(corps);
    void saisie.envoyer(action, (p) => void navigate(`/terrains-prospection/${p.id}`));
  }

  const commun = { brouillon: saisie.brouillon, onChange: modifier, listes, champErreur: saisie.champErreur, messageErreur: saisie.erreur };
  return (
    <div className="flex max-w-240 flex-col gap-3">
      <SectionsSaisie sections={[SECTION_GENERAL]} {...commun} />
      <SectionsSaisie sections={[SECTION_SUPERFICIES]} {...commun} />
      {apercu.erreur && <p role="alert" className="text-micro text-destructive">{apercu.erreur}</p>}
      {brut && (
        <>
          <SectionsSaisie sections={[SECTION_BRUT]} {...commun} />
          <p role="note" className="text-body text-muted-foreground">
            {prospection ? 'Les zones se saisissent sur la fiche (onglet Superficies).' : 'Les zones se saisissent sur la fiche, après la création.'}
          </p>
        </>
      )}
      <SectionsSaisie sections={[SECTION_PRIX, SECTION_ENREGISTREMENT, SECTION_ANOMALIES]} {...commun} />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer} libelle={prospection ? 'Enregistrer' : 'Créer'} />
    </div>
  );
}
