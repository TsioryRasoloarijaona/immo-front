import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { Card, ErrorState, LoadingState } from '../../components/ui';
import { ChampSelect, ChampsDeclares, GrilleSaisie, PiedFormulaire, type OptionSelect } from '../../components/patrimoine/SaisiePatrimoine';
import { avecChampsAVider, messageDuChamp, useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { createTranche, getProjet, getProjetsFacturation, getTranche, updateTranche } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import {
  referentielItems,
  useNiveauxTerrain,
  usePays,
  usePersonnels,
  usePlansComptables,
  useProjetsReferentiel,
  useRubriquesTranche,
  useStandings,
  useTiersAutrui,
} from '../../lib/referentiels';
import type { ProjetDetailDto, ReferentielItemDto, TrancheEcritureDto } from '../../types';
import {
  AUTRES,
  COORDONNEES,
  DATES,
  DEFAUTS_CREATION,
  FONCIER,
  GENERAL,
  REGLES_1,
  REGLES_2,
  REMISES,
  SAISIS,
  VISIBILITE,
  versEcriture,
} from './champsTranche';

const ENTETE = {
  icon: <Building2 />,
  accent: 'var(--sec-tranche)',
  accentBg: 'var(--sec-tranche-bg)',
};
const FIL = [{ label: 'Patrimoine' }, { label: 'Tranches', to: '/tranches' }];

/** OMRAN `GetDefaultValuesFromProject` : coordonnées, pays, dates et description détaillée ; ni code ni description. */
function reprisDuProgramme(p: ProjetDetailDto): TrancheEcritureDto {
  return {
    adresse: p.adresse,
    adresse2: p.adresse2,
    adresse3: p.adresse3,
    codePostal: p.codePostal,
    ville: p.ville,
    paysId: p.paysId,
    telephone: p.telephone,
    mobile: p.mobile,
    fax: p.fax,
    email: p.email,
    siteWeb: p.siteWeb,
    descriptionLongue: p.descriptionLongue,
    dateDebutTravaux: p.dateDebutTravaux ?? undefined,
    dateFinTravaux: p.dateFinTravaux ?? undefined,
    dateDebutCommercialisation: p.dateDebutCommercialisation ?? undefined,
    dateFinCommercialisation: p.dateFinCommercialisation ?? undefined,
  };
}

export default function TrancheForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const projetId = params.get('projetId') ?? undefined;
  if (id) {
    return (
      <AdminGuard title="Modifier la tranche" {...ENTETE} crumbs={[...FIL, { label: 'Modifier' }]}>
        <EditionTranche key={id} id={id} />
      </AdminGuard>
    );
  }
  return (
    <AdminGuard title="Nouvelle tranche" {...ENTETE} crumbs={[...FIL, { label: 'Nouvelle' }]}>
      {projetId ? <CreationDepuisProgramme projetId={projetId} /> : <FormulaireTranche initial={DEFAUTS_CREATION} />}
    </AdminGuard>
  );
}

function EditionTranche({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getTranche(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <FormulaireTranche id={id} initial={versEcriture(data)} entiteId={data.entiteId} />;
}

function CreationDepuisProgramme({ projetId }: Readonly<{ projetId: string }>) {
  const { data, error } = useApi(() => getProjet(projetId), [projetId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <FormulaireTranche initial={{ ...DEFAUTS_CREATION, ...reprisDuProgramme(data), projetId }} entiteId={data.entiteId} />;
}

/** Options des champs `reference` du catalogue, par nom de champ. */
function useReferencesTranche(entiteId: string | undefined): Partial<Record<string, OptionSelect[]>> {
  const standings = useStandings();
  const niveaux = useNiveauxTerrain();
  const rubriques = useRubriquesTranche();
  const personnels = usePersonnels();
  const pays = usePays();
  const tiersAutrui = useTiersAutrui();
  const comptes = usePlansComptables();
  // OMRAN propose les projets de l'entité du programme (`PrjProjectItemList.GetList`).
  const projets = useApi(() => getProjetsFacturation(entiteId), [entiteId ?? '']);
  const avecCode = (list: ReferentielItemDto[]) =>
    list.map((r) => ({ label: [r.code, r.description].filter(Boolean).join(' — ') || r.id, value: r.id }));
  return {
    standingId: referentielItems(standings.data),
    niveauTerrainId: referentielItems(niveaux.data),
    rubriqueId: referentielItems(rubriques.data),
    responsableSavId: referentielItems(personnels.data),
    paysId: pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id })),
    tiersAutruiId: referentielItems(tiersAutrui.data),
    planComptableId: avecCode(comptes.data),
    projetFacturationId: referentielItems(projets.data ?? []),
  };
}

function FormulaireTranche({ id, initial, entiteId }: Readonly<{ id?: string; initial: TrancheEcritureDto; entiteId?: string }>) {
  const navigate = useNavigate();
  const [form, setForm] = useState<TrancheEcritureDto>(initial);
  const [entite, setEntite] = useState(entiteId);
  const { enCours, erreur, soumettre } = useSoumission();
  const [erreurProgramme, setErreurProgramme] = useState<string | null>(null);
  const projets = useProjetsReferentiel();
  const references = useReferencesTranche(entite);

  const changer = (nom: keyof TrancheEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const champs = (defs: DefChamp<TrancheEcritureDto>[]) => (
    <ChampsDeclares prefixe="tra" defs={defs} form={form} onChange={changer} erreur={erreur} references={references} />
  );

  async function choisirProgramme(projetId: string | undefined) {
    changer('projetId', projetId);
    setErreurProgramme(null);
    if (!projetId) return;
    try {
      const programme = await getProjet(projetId);
      setEntite(programme.entiteId);
      setForm((f) => ({ ...f, ...reprisDuProgramme(programme), projetId }));
    } catch {
      setErreurProgramme('Coordonnées du programme non reprises : saisissez-les.');
    }
  }

  function enregistrer() {
    const corps = avecChampsAVider(initial, form, SAISIS);
    void soumettre(
      () => (id ? updateTranche(id, corps) : createTranche(corps)),
      (tranche) => void navigate(`/tranches/${tranche.id}`),
    );
  }

  return (
    <div className="flex max-w-200 flex-col gap-3">
      <Card title="Général" accent="var(--sec-tranche)">
        <div className="flex flex-col gap-3.5">
          <GrilleSaisie>
            <ChampSelect
              id="tra-programme"
              libelle="Programme"
              requis
              desactive={!!id}
              options={referentielItems(projets.data)}
              valeur={form.projetId}
              onChange={(v) => void choisirProgramme(v)}
              message={messageDuChamp(erreur, 'projetId') ?? erreurProgramme}
              aide={id ? "Le programme d'une tranche ne se modifie pas." : 'Reprend les coordonnées et les dates du programme.'}
            />
          </GrilleSaisie>
          {champs(GENERAL)}
        </div>
      </Card>
      <Card title="Visibilité par module">{champs(VISIBILITE)}</Card>
      <Card title="Délais">{champs(DATES)}</Card>
      <Card title="Coordonnées">{champs(COORDONNEES)}</Card>
      <Card title="Identification foncière">{champs(FONCIER)}</Card>
      <Card title="Règles de gestion 1">{champs(REGLES_1)}</Card>
      <Card title="Règles de gestion 2">{champs(REGLES_2)}</Card>
      <Card title="Remises anciens clients">{champs(REMISES)}</Card>
      <Card title="Autres">{champs(AUTRES)}</Card>
      <PiedFormulaire
        erreur={erreur}
        enCours={enCours}
        libelle={id ? 'Enregistrer' : 'Créer la tranche'}
        onAnnuler={() => void navigate(id ? `/tranches/${id}` : '/tranches')}
        onValider={enregistrer}
      />
    </div>
  );
}
