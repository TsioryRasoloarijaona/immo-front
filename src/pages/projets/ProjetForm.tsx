import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { Card, ErrorState, LoadingState } from '../../components/ui';
import { ChampSelect, ChampsDeclares, GrilleSaisie, PiedFormulaire, type OptionSelect } from '../../components/patrimoine/SaisiePatrimoine';
import { avecChampsAVider, messageDuChamp, useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { createProjet, getDefautsEntiteProjet, getProjet, updateProjet } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { useApi } from '../../lib/useApi';
import { referentielItems, useEntitesReferentiel, usePays, usePersonnels } from '../../lib/referentiels';
import type { ProjetEcritureDto } from '../../types';
import { ADMINISTRATION, AUTRES, COORDONNEES, DELAIS, GENERAL, SAISIS, versEcriture } from './champsProjet';

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

function useReferencesProjet(): Partial<Record<string, OptionSelect[]>> {
  const pays = usePays();
  const personnels = referentielItems(usePersonnels().data);
  return {
    paysId: pays.data.map((p) => ({ label: p.description || p.code || p.id, value: p.id })),
    signataireId: personnels,
    responsableTechniqueId: personnels,
    responsableCommercialId: personnels,
  };
}

function FormulaireProjet({ id, initial }: Readonly<{ id?: string; initial: ProjetEcritureDto }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const [form, setForm] = useState<ProjetEcritureDto>(initial);
  const [erreurDefauts, setErreurDefauts] = useState<string | null>(null);
  const { enCours, erreur, soumettre } = useSoumission();
  const entites = useEntitesReferentiel();
  const references = useReferencesProjet();

  const changer = (nom: keyof ProjetEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const champs = (defs: DefChamp<ProjetEcritureDto>[]) => (
    <ChampsDeclares prefixe="prj" defs={defs} form={form} onChange={changer} erreur={erreur} references={references} />
  );

  /** OMRAN `Project:CfgCompanyItemList_ValueChanged` : code et libellé compris ; un code pris donnera 409. */
  async function choisirEntite(entiteId: string | undefined) {
    changer('entiteId', entiteId);
    setErreurDefauts(null);
    if (!entiteId) return;
    const charger = await confirmer({
      title: 'Données par défaut',
      message: "Voulez-vous charger les données par défaut de l'entité sélectionnée ?",
      confirmLabel: 'Charger',
      cancelLabel: 'Non',
    });
    if (!charger) return;
    try {
      const defauts = await getDefautsEntiteProjet(entiteId);
      setForm((f) => ({ ...f, ...defauts, entiteId }));
    } catch {
      setErreurDefauts("Données de l'entité non chargées : saisissez-les.");
    }
  }

  function enregistrer() {
    const corps = avecChampsAVider(initial, form, SAISIS);
    void soumettre(
      () => (id ? updateProjet(id, corps) : createProjet(corps)),
      (projet) => void navigate(`/projets/${projet.id}`),
    );
  }

  return (
    <div className="flex max-w-200 flex-col gap-3">
      <Card title="Général" accent="var(--sec-projet)">
        <div className="flex flex-col gap-3.5">
          <GrilleSaisie>
            <ChampSelect
              id="prj-entite"
              libelle="Entité"
              requis
              options={referentielItems(entites.data)}
              valeur={form.entiteId}
              onChange={(v) => void choisirEntite(v)}
              message={messageDuChamp(erreur, 'entiteId') ?? erreurDefauts}
              aide="Propose de reprendre les coordonnées et les responsables de l'entité."
            />
          </GrilleSaisie>
          {champs(GENERAL)}
        </div>
      </Card>
      <Card title="Délais">{champs(DELAIS)}</Card>
      <Card title="Coordonnées">{champs(COORDONNEES)}</Card>
      <Card title="Administration">{champs(ADMINISTRATION)}</Card>
      <Card title="Autres">{champs(AUTRES)}</Card>
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
