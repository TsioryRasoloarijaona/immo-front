import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { getProjet } from '../../lib/api';
import { createProjet, getDefautsEntite, updateProjet } from '../../lib/apiPatrimoine';
import { useConfirm } from '../../lib/confirmContext';
import { referentielItems, useEntitesReferentiel, usePays, usePersonnels } from '../../lib/referentiels';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie } from '../../lib/saisiePatrimoine';
import { SECTIONS_PROJET } from '../../lib/saisieProjet';
import { useApi } from '../../lib/useApi';
import type { ProjetDetailDto } from '../../types';

const CHAMPS = champsDe(SECTIONS_PROJET);

export default function ProjetForm() {
  const { id } = useParams();
  const titre = id ? 'Modifier le programme' : 'Nouveau programme';
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Projets', to: '/projets' }, { label: titre }]}
      icon={<LayoutGrid />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
    >
      {id ? <ModificationProjet key={id} id={id} /> : <SaisieProjet />}
    </AdminGuard>
  );
}

function ModificationProjet({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getProjet(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <SaisieProjet projet={data} />;
}

function SaisieProjet({ projet }: Readonly<{ projet?: ProjetDetailDto }>) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const initial = brouillonDepuis(CHAMPS, projet);
  const saisie = useSaisie(CHAMPS, initial);
  const entites = useEntitesReferentiel();
  const pays = usePays();
  const personnels = usePersonnels();

  /** OMRAN `Project:CfgCompanyItemList_ValueChanged` : proposer les données de l'entité, code compris. */
  async function chargerDefauts(entiteId: string) {
    const oui = await confirm({
      title: "Données de l'entité",
      message: "Voulez-vous charger les données par défaut de l'entité sélectionnée ?",
      confirmLabel: 'Charger',
    });
    if (!oui) return;
    const defauts = await getDefautsEntite(entiteId);
    saisie.setBrouillon(brouillonDepuis(CHAMPS, defauts));
  }

  function changer(nom: string, valeur: string | boolean) {
    saisie.modifier(nom, valeur);
    // Échec du chargement : le formulaire reste tel que saisi, rien à défaire.
    if (!projet && nom === 'entiteId' && valeur) chargerDefauts(String(valeur)).catch(() => undefined);
  }

  function enregistrer() {
    const corps = corpsDepuis(CHAMPS, saisie.brouillon, projet ? initial : undefined);
    void saisie.envoyer(
      () => (projet ? updateProjet(projet.id, corps) : createProjet(corps)),
      (p) => void navigate(`/projets/${p.id}`),
    );
  }

  return (
    <div className="flex max-w-240 flex-col gap-3">
      <SectionsSaisie
        sections={SECTIONS_PROJET}
        brouillon={saisie.brouillon}
        onChange={changer}
        listes={{
          entites: referentielItems(entites.data),
          pays: referentielItems(pays.data),
          personnels: referentielItems(personnels.data),
        }}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer}
        libelle={projet ? 'Enregistrer' : 'Créer le programme'} />
    </div>
  );
}
