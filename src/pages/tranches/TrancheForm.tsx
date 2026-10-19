import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { getProjet, getTranche } from '../../lib/api';
import { createTranche, updateTranche } from '../../lib/apiPatrimoine';
import { referentielItems, usePays, useProjetsReferentiel } from '../../lib/referentiels';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie, type Brouillon } from '../../lib/saisiePatrimoine';
import { SECTIONS_TRANCHE, DEFAUTS_TRANCHE, CHAMPS_REPRIS_DU_PROGRAMME } from '../../lib/saisieTranche';
import { useApi } from '../../lib/useApi';
import type { ProjetDetailDto, TrancheDetailDto } from '../../types';

const CHAMPS = champsDe(SECTIONS_TRANCHE);

export default function TrancheForm() {
  const { id } = useParams();
  const titre = id ? 'Modifier la tranche' : 'Nouvelle tranche';
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches', to: '/tranches' }, { label: titre }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {id ? <ModificationTranche key={id} id={id} /> : <CreationTranche />}
    </AdminGuard>
  );
}

function ModificationTranche({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getTranche(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <SaisieTranche tranche={data} depart={brouillonDepuis(CHAMPS, data)} />;
}

const CHAMPS_REPRIS = CHAMPS.filter((c) => CHAMPS_REPRIS_DU_PROGRAMME.includes(c.nom));

/** OMRAN `GetDefaultValuesFromProject` : coordonnées, pays, dates et description longue, ni code ni description. */
function reprisDuProgramme(projet: ProjetDetailDto): Brouillon {
  return { ...brouillonDepuis(CHAMPS_REPRIS, projet), projetId: projet.id };
}

function CreationTranche() {
  const [params] = useSearchParams();
  const projetId = params.get('projetId');
  const { data, error, loading } = useApi(() => (projetId ? getProjet(projetId) : Promise.resolve(null)), [projetId]);
  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState />;
  const defauts = brouillonDepuis(CHAMPS, DEFAUTS_TRANCHE);
  return <SaisieTranche depart={data ? { ...defauts, ...reprisDuProgramme(data) } : defauts} />;
}

function SaisieTranche({ tranche, depart }: Readonly<{ tranche?: TrancheDetailDto; depart: Brouillon }>) {
  const navigate = useNavigate();
  const saisie = useSaisie(CHAMPS, depart);
  const projets = useProjetsReferentiel();
  const pays = usePays();

  function changer(nom: string, valeur: string | boolean) {
    saisie.modifier(nom, valeur);
    if (tranche || nom !== 'projetId' || !valeur) return;
    void getProjet(String(valeur)).then((projet) => {
      saisie.setBrouillon((b) => ({ ...b, ...reprisDuProgramme(projet) }));
    });
  }

  function enregistrer() {
    const corps = corpsDepuis(CHAMPS, saisie.brouillon, tranche ? depart : undefined);
    void saisie.envoyer(
      () => (tranche ? updateTranche(tranche.id, corps) : createTranche(corps)),
      (t) => void navigate(`/tranches/${t.id}`),
    );
  }

  return (
    <div className="flex max-w-240 flex-col gap-3">
      <SectionsSaisie
        sections={SECTIONS_TRANCHE}
        brouillon={saisie.brouillon}
        onChange={changer}
        listes={{ projets: referentielItems(projets.data), pays: referentielItems(pays.data) }}
        verrouilles={tranche ? ['projetId'] : []}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer}
        libelle={tranche ? 'Enregistrer' : 'Créer la tranche'} />
    </div>
  );
}
