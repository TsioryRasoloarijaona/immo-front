import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Ruler, Settings2 } from 'lucide-react';
import type { ColonneGrille } from '../../components/DataGrid';
import ListeAdmin from '../../components/entites/ListeAdmin';
import ConfigWorkflowFaisabilite from '../../components/faisabilite/ConfigWorkflowFaisabilite';
import GardeEtudes from '../../components/faisabilite/GardeEtudes';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import PageShell from '../../components/PageShell';
import { Badge } from '../../components/ui';
import { buttonVariants } from '../../components/ui/button';
import { listEtudesFaisabilite } from '../../lib/apiFaisabilite';
import { toneStatut } from '../../lib/faisabilite';
import { formatSurface } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { referentielItems, useEntitesReferentiel } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { EtudeFaisabiliteListeDto } from '../../types/faisabilite';

const TOUS = 'tous';
const LISTE = '/etudes-faisabilite';

const COLONNES: ColonneGrille<EtudeFaisabiliteListeDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 36 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 12 },
  { nom: 'societeLibelle', libelle: 'Société', largeur: 22 },
  { nom: 'terrainLibelle', libelle: 'Terrain', largeur: 22 },
  { nom: 'prospectionTerrainDescription', libelle: 'Prospection', largeur: 20 },
  {
    nom: 'statutLibelle', libelle: 'Statut', largeur: 16,
    rendu: (r) => (r.statutLibelle ? <Badge tone={toneStatut(r.statutCouleur)}>{r.statutLibelle}</Badge> : null),
  },
  { nom: 'bloquee', libelle: 'Bloquée', type: 'BOOLEEN', largeur: 9 },
  { nom: 'superficie', libelle: 'Superficie', type: 'NOMBRE', largeur: 13, rendu: (r) => formatSurface(r.superficie), formatValeur: (v) => formatSurface(Number(v)) },
  { nom: 'coutTotalTerrain', libelle: 'Coût total du terrain', type: 'MONTANT', largeur: 18 },
  { nom: 'coutTotal', libelle: 'Charge TTC', type: 'MONTANT', largeur: 16 },
  { nom: 'chiffreAffaires', libelle: "Chiffre d'affaires TTC", type: 'MONTANT', largeur: 18 },
  { nom: 'montantAutofinancement', libelle: 'Fonds propres TTC', type: 'MONTANT', largeur: 16 },
  { nom: 'margeNette', libelle: 'Marge bénéficiaire nette', type: 'MONTANT', largeur: 18 },
  { nom: 'montantConcretisation', libelle: 'Montant concrétisation TTC', type: 'MONTANT', largeur: 20 },
  { nom: 'montantFinalisation', libelle: 'Montant finalisation TTC', type: 'MONTANT', largeur: 20 },
  { nom: 'pourcentageConcretisation', libelle: 'Taux de concrétisation', type: 'POURCENTAGE', largeur: 16 },
  { nom: 'rentabiliteCoutProjet', libelle: 'Retour sur coût projet', type: 'POURCENTAGE', largeur: 16 },
  { nom: 'rentabiliteChiffreAffaires', libelle: "Retour sur chiffre d'affaires", type: 'POURCENTAGE', largeur: 18 },
  { nom: 'rentabiliteFondsPropres', libelle: 'Retour sur fonds propres', type: 'POURCENTAGE', largeur: 18 },
];

function Contenu() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const recherche = useDebouncedValue(search).trim();
  const [societeId, setSocieteId] = useState(TOUS);
  const [statutId, setStatutId] = useState(TOUS);
  const societes = useEntitesReferentiel();
  const etat = useApi(() => listEtudesFaisabilite({
    search: recherche || undefined,
    societeId: societeId === TOUS ? undefined : societeId,
    statutId: statutId === TOUS ? undefined : statutId,
  }), [recherche, societeId, statutId]);
  // Les statuts proposés viennent des études elles-mêmes : la liste non filtrée.
  const toutes = useApi(() => listEtudesFaisabilite(), []);
  const statuts = useMemo(() => {
    const parId = new Map<string, string>();
    for (const e of toutes.data ?? []) if (e.statutId && e.statutLibelle) parId.set(e.statutId, e.statutLibelle);
    return [...parId].map(([value, label]) => ({ label, value }));
  }, [toutes.data]);

  const itemsSocietes = referentielItems(societes.data);
  const exportListe = useExportListe('/api/etudes-faisabilite/export', {
    search: recherche || undefined, societeId: societeId === TOUS ? undefined : societeId,
    statutId: statutId === TOUS ? undefined : statutId, colonnes: COLONNES.map((c) => c.nom),
  }, 'etudes-faisabilite');
  const unique = (valeur: string) => (valeur === TOUS ? null : valeur);

  function resetFilters() {
    setSearch('');
    setSocieteId(TOUS);
    setStatutId(TOUS);
  }

  return (
    <ListeAdmin
      titre="Études de faisabilité"
      chemin="/etudes-faisabilite"
      libelleNouveau="Nouvelle étude"
      sujet="étude"
      aucun="Aucune étude"
      etat={etat}
      colonnes={COLONNES}
      exportListe={{ export: exportListe, pdf: true }}
      propres={[{ id: 'statuts', libelle: 'Statuts et transitions', icone: Settings2, onClick: () => void navigate(`${LISTE}?vue=configuration`) }]}
      filtre={recherche !== '' || societeId !== TOUS || statutId !== TOUS}
      panneau={{
        puces: [...puceUnique(itemsSocietes, unique(societeId)), ...puceUnique(statuts, unique(statutId)), ...(search ? [`« ${search} »`] : [])],
        recherche: { valeur: search, onChange: setSearch, placeholder: 'Code, description, terrain…' },
        onReinitialiser: resetFilters,
        children: (
          <>
            <BoiteFiltre titre="Société" mode="unique" items={itemsSocietes} valeur={unique(societeId)} onChange={(v) => setSocieteId(v ?? TOUS)} />
            <BoiteFiltre titre="Statut" mode="unique" items={statuts} valeur={unique(statutId)} onChange={(v) => setStatutId(v ?? TOUS)} />
          </>
        ),
      }}
    />
  );
}

function Configuration() {
  return (
    <PageShell title="Statuts et transitions des études" icon={<Ruler />} crumbs={[{ label: 'Patrimoine' }, { label: 'Études de faisabilité', to: LISTE }, { label: 'Statuts et transitions' }]}
      actions={<Link to={LISTE} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Retour aux études</Link>}>
      <ConfigWorkflowFaisabilite />
    </PageShell>
  );
}

/** `?vue=configuration` : statuts et transitions (Administrateur en écriture, Direction Générale en lecture). */
export default function EtudesFaisabiliteList() {
  const [params] = useSearchParams();
  return <GardeEtudes>{params.get('vue') === 'configuration' ? <Configuration /> : <Contenu />}</GardeEtudes>;
}
