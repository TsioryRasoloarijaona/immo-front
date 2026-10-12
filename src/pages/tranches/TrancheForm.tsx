import { useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { Card, ErrorState, LoadingState } from '../../components/ui';
import { ChampSelect, ChampsDeclares, GrilleSaisie, PiedFormulaire } from '../../components/patrimoine/SaisiePatrimoine';
import { messageDuChamp, useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { createTranche, getProjet, getTranche, updateTranche } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { referentielItems, usePays, useProjetsReferentiel } from '../../lib/referentiels';
import type { ProjetDetailDto, TrancheEcritureDto } from '../../types';
import { AUTRES, COORDONNEES, DATES, DEFAUTS_CREATION, IDENTITE, REGLES_1, REGLES_2, REMISES, versEcriture } from './champsTranche';

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
  return <FormulaireTranche id={id} initial={versEcriture(data)} />;
}

function CreationDepuisProgramme({ projetId }: Readonly<{ projetId: string }>) {
  const { data, error } = useApi(() => getProjet(projetId), [projetId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <FormulaireTranche initial={{ ...DEFAUTS_CREATION, ...reprisDuProgramme(data), projetId }} />;
}

function Section({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return <Card title={titre}>{children}</Card>;
}

function FormulaireTranche({ id, initial }: Readonly<{ id?: string; initial: TrancheEcritureDto }>) {
  const navigate = useNavigate();
  const [form, setForm] = useState<TrancheEcritureDto>(initial);
  const { enCours, erreur, soumettre } = useSoumission();
  const [erreurProgramme, setErreurProgramme] = useState<string | null>(null);
  const projets = useProjetsReferentiel();
  const pays = usePays();
  const optionsPays = pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id }));

  const changer = (nom: keyof TrancheEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const champs = (defs: DefChamp<TrancheEcritureDto>[]) => (
    <ChampsDeclares prefixe="tra" defs={defs} form={form} onChange={changer} erreur={erreur} />
  );

  async function choisirProgramme(projetId: string | undefined) {
    changer('projetId', projetId);
    setErreurProgramme(null);
    if (!projetId) return;
    try {
      const repris = reprisDuProgramme(await getProjet(projetId));
      setForm((f) => ({ ...f, ...repris, projetId }));
    } catch {
      setErreurProgramme('Coordonnées du programme non reprises : saisissez-les.');
    }
  }

  function enregistrer() {
    void soumettre(
      () => (id ? updateTranche(id, form) : createTranche(form)),
      (tranche) => void navigate(`/tranches/${tranche.id}`),
    );
  }

  return (
    <div className="flex max-w-200 flex-col gap-3">
      <Card title="Identité" accent="var(--sec-tranche)">
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
          {champs(IDENTITE)}
        </div>
      </Card>
      <Section titre="Coordonnées">
        <div className="flex flex-col gap-3.5">
          {champs(COORDONNEES)}
          <GrilleSaisie>
            <ChampSelect
              id="tra-pays"
              libelle="Pays"
              options={optionsPays}
              valeur={form.paysId}
              onChange={(v) => changer('paysId', v)}
              message={messageDuChamp(erreur, 'paysId')}
            />
          </GrilleSaisie>
        </div>
      </Section>
      <Section titre="Dates">{champs(DATES)}</Section>
      <Section titre="Règles de gestion 1">{champs(REGLES_1)}</Section>
      <Section titre="Règles de gestion 2">{champs(REGLES_2)}</Section>
      <Section titre="Remises anciens clients">{champs(REMISES)}</Section>
      <Section titre="Autres">{champs(AUTRES)}</Section>
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
