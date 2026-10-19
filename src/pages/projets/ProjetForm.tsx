import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { getProjet } from '../../lib/api';
import { createProjet, updateProjet } from '../../lib/apiPatrimoine';
import { referentielItems, useEntitesReferentiel, usePays } from '../../lib/referentiels';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie, type SectionSaisie } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { ProjetDetailDto } from '../../types';

const SECTIONS: SectionSaisie[] = [
  {
    titre: 'Identité',
    champs: [
      { nom: 'entiteId', libelle: 'Entité', type: 'liste', liste: 'entites', obligatoire: true },
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
      { nom: 'descriptionLongue', libelle: 'Description longue', type: 'texteLong' },
    ],
  },
  {
    titre: 'Coordonnées',
    champs: [
      { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
      { nom: 'adresse2', libelle: 'Adresse 2', type: 'texte' },
      { nom: 'adresse3', libelle: 'Adresse 3', type: 'texte' },
      { nom: 'codePostal', libelle: 'Code postal', type: 'texte' },
      { nom: 'ville', libelle: 'Ville', type: 'texte' },
      { nom: 'villeSignature', libelle: 'Ville de signature', type: 'texte' },
      { nom: 'paysId', libelle: 'Pays', type: 'liste', liste: 'pays' },
      { nom: 'telephone', libelle: 'Téléphone', type: 'texte' },
      { nom: 'mobile', libelle: 'Mobile', type: 'texte' },
      { nom: 'fax', libelle: 'Fax', type: 'texte' },
      { nom: 'email', libelle: 'Email', type: 'texte' },
      { nom: 'siteWeb', libelle: 'Site web', type: 'texte' },
    ],
  },
  {
    titre: 'Dates',
    champs: [
      { nom: 'dateDebutTravaux', libelle: 'Début des travaux', type: 'date' },
      { nom: 'dateFinTravaux', libelle: 'Fin des travaux', type: 'date' },
      { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', type: 'date' },
      { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', type: 'date' },
    ],
  },
];

const CHAMPS = champsDe(SECTIONS);

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
  const initial = brouillonDepuis(CHAMPS, projet);
  const saisie = useSaisie(CHAMPS, initial);
  const entites = useEntitesReferentiel();
  const pays = usePays();

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
        sections={SECTIONS}
        brouillon={saisie.brouillon}
        onChange={saisie.modifier}
        listes={{ entites: referentielItems(entites.data), pays: referentielItems(pays.data) }}
        champErreur={saisie.champErreur}
        messageErreur={saisie.erreur}
      />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer}
        libelle={projet ? 'Enregistrer' : 'Créer le programme'} />
    </div>
  );
}
