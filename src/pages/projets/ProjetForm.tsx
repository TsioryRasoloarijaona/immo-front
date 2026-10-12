import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { Card, ErrorState, LoadingState } from '../../components/ui';
import { ChampSelect, ChampsDeclares, GrilleSaisie, PiedFormulaire } from '../../components/patrimoine/SaisiePatrimoine';
import { extraireSaisie, messageDuChamp, useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { createProjet, getProjet, updateProjet } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { referentielItems, useEntitesReferentiel, usePays } from '../../lib/referentiels';
import type { ProjetDetailDto, ProjetEcritureDto } from '../../types';

const IDENTITE: DefChamp<ProjetEcritureDto>[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
  { nom: 'descriptionLongue', libelle: 'Description détaillée', genre: 'texteLong' },
];

const COORDONNEES: DefChamp<ProjetEcritureDto>[] = [
  { nom: 'adresse', libelle: 'Adresse', genre: 'texte', large: true },
  { nom: 'adresse2', libelle: 'Adresse (suite)', genre: 'texte' },
  { nom: 'adresse3', libelle: 'Adresse (complément)', genre: 'texte' },
  { nom: 'codePostal', libelle: 'Code postal', genre: 'texte' },
  { nom: 'ville', libelle: 'Ville', genre: 'texte' },
  { nom: 'villeSignature', libelle: 'Courrier fait à', genre: 'texte' },
  { nom: 'telephone', libelle: 'Téléphone', genre: 'texte' },
  { nom: 'mobile', libelle: 'Mobile', genre: 'texte' },
  { nom: 'fax', libelle: 'Fax', genre: 'texte' },
  { nom: 'email', libelle: 'Email', genre: 'texte' },
  { nom: 'siteWeb', libelle: 'Site web', genre: 'texte' },
];

const DATES: DefChamp<ProjetEcritureDto>[] = [
  { nom: 'dateDebutTravaux', libelle: 'Lancement des travaux', genre: 'date' },
  { nom: 'dateFinTravaux', libelle: 'Fin des travaux', genre: 'date' },
  { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', genre: 'date' },
  { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', genre: 'date' },
];

function versEcriture(p: ProjetDetailDto): ProjetEcritureDto {
  return extraireSaisie(p, [...IDENTITE, ...COORDONNEES, ...DATES], { entiteId: p.entiteId, paysId: p.paysId });
}

const ENTETE = {
  crumbs: [{ label: 'Patrimoine' }, { label: 'Projets', to: '/projets' }],
  icon: <LayoutGrid />,
  accent: 'var(--sec-projet)',
  accentBg: 'var(--sec-projet-bg)',
};

export default function ProjetForm() {
  const { id } = useParams();
  if (!id) {
    return (
      <AdminGuard title="Nouveau programme" {...ENTETE} crumbs={[...ENTETE.crumbs, { label: 'Nouveau' }]}>
        <FormulaireProjet initial={{}} />
      </AdminGuard>
    );
  }
  return (
    <AdminGuard title="Modifier le programme" {...ENTETE} crumbs={[...ENTETE.crumbs, { label: 'Modifier' }]}>
      <EditionProjet key={id} id={id} />
    </AdminGuard>
  );
}

function EditionProjet({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getProjet(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <FormulaireProjet id={id} initial={versEcriture(data)} />;
}

function FormulaireProjet({ id, initial }: Readonly<{ id?: string; initial: ProjetEcritureDto }>) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProjetEcritureDto>(initial);
  const { enCours, erreur, soumettre } = useSoumission();
  const entites = useEntitesReferentiel();
  const pays = usePays();
  const optionsPays = pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id }));

  const changer = (nom: keyof ProjetEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));

  function enregistrer() {
    void soumettre(
      () => (id ? updateProjet(id, form) : createProjet(form)),
      (projet) => void navigate(`/projets/${projet.id}`),
    );
  }

  return (
    <div className="flex max-w-200 flex-col gap-3">
      <Card title="Identité" accent="var(--sec-projet)">
        <div className="flex flex-col gap-3.5">
          <GrilleSaisie>
            <ChampSelect
              id="prj-entite"
              libelle="Entité"
              requis
              options={referentielItems(entites.data)}
              valeur={form.entiteId}
              onChange={(v) => changer('entiteId', v)}
              message={messageDuChamp(erreur, 'entiteId')}
            />
          </GrilleSaisie>
          <ChampsDeclares prefixe="prj" defs={IDENTITE} form={form} onChange={changer} erreur={erreur} />
        </div>
      </Card>
      <Card title="Coordonnées">
        <div className="flex flex-col gap-3.5">
          <ChampsDeclares prefixe="prj" defs={COORDONNEES} form={form} onChange={changer} erreur={erreur} />
          <GrilleSaisie>
            <ChampSelect
              id="prj-pays"
              libelle="Pays"
              options={optionsPays}
              valeur={form.paysId}
              onChange={(v) => changer('paysId', v)}
              message={messageDuChamp(erreur, 'paysId')}
            />
          </GrilleSaisie>
        </div>
      </Card>
      <Card title="Dates">
        <ChampsDeclares prefixe="prj" defs={DATES} form={form} onChange={changer} erreur={erreur} />
      </Card>
      <PiedFormulaire
        erreur={erreur}
        enCours={enCours}
        libelle={id ? 'Enregistrer' : 'Créer le programme'}
        onAnnuler={() => void navigate(id ? `/projets/${id}` : '/projets')}
        onValider={enregistrer}
      />
    </div>
  );
}
