import { useMemo, useState } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import FicheTacheFenetre from '../../components/taches/FicheTacheFenetre';
import { Badge } from '../../components/ui';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listStatutsTaches, listTaches } from '../../lib/apiTaches';
import { pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { NOUVELLE_TACHE, toneStatut } from '../../lib/saisieTache';
import { useChoixTaches } from '../../lib/useChoixTaches';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import useFenetreListe from '../../lib/useFenetreListe';
import type { StatutTacheDto, TacheDto } from '../../types/taches';

function colonnes(statuts: StatutTacheDto[]): ColonneGrille<TacheDto>[] {
  return [
    { nom: 'code', libelle: 'Code', largeur: 6, classe: 'font-medium text-foreground' },
    { nom: 'description', libelle: 'Description', largeur: 20 },
    { nom: 'typeLibelle', libelle: 'Type', largeur: 8 },
    { nom: 'prioriteLibelle', libelle: 'Priorité', largeur: 8 },
    { nom: 'datePrevue', libelle: 'Date prévisionnelle', type: 'DATE', largeur: 8 },
    { nom: 'gestionnaireNom', libelle: 'Gestionnaire', largeur: 10 },
    {
      nom: 'statutLibelle',
      libelle: 'Statut',
      largeur: 8,
      rendu: (t) => <Badge tone={toneStatut(statuts, t.statutId)}>{t.statutLibelle ?? '—'}</Badge>,
    },
  ];
}

/** `/administration/taches` : tâches (AdmTask), Administrateur seul. */
export default function TachesList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statutId, setStatutId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [prioriteId, setPrioriteId] = useState<string | null>(null);
  const [gestionnaireId, setGestionnaireId] = useState<string | null>(null);
  const texte = useDebouncedValue(search).trim();
  const choix = useChoixTaches();
  const statuts = useApi(listStatutsTaches, [], 'taches-statuts');
  const itemsStatut = useMemo(() => (statuts.data ?? []).map((s) => ({ label: s.code ?? s.id, value: s.id })), [statuts.data]);
  const grille = useMemo(() => colonnes(statuts.data ?? []), [statuts.data]);

  const { data, loading, error } = useApi(
    () =>
      listTaches({
        texte: texte || undefined,
        statutId: statutId ?? undefined,
        typeId: typeId ?? undefined,
        prioriteId: prioriteId ?? undefined,
        gestionnaireId: gestionnaireId ?? undefined,
        page,
        size: DEFAULT_PAGE_SIZE,
      }),
    [texte, statutId, typeId, prioriteId, gestionnaireId, page],
  );
  const rows = data?.content ?? [];
  const fenetre = useFenetreListe('/administration/taches', rows.map((t) => t.id));
  const filtre = !!texte || !!statutId || !!typeId || !!prioriteId || !!gestionnaireId;
  const apresFiltre = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(0);
    set(v);
  };

  function reinitialiser() {
    setPage(0);
    setSearch('');
    setStatutId(null);
    setTypeId(null);
    setPrioriteId(null);
    setGestionnaireId(null);
  }

  return (
    <CadreListe
      titre="Tâches"
      cle="administration-taches"
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, 'tâche') : undefined}
      panneau={{
        puces: [
          ...puceUnique(itemsStatut, statutId),
          ...puceUnique(choix.types, typeId),
          ...puceUnique(choix.priorites, prioriteId),
          ...puceUnique(choix.personnes, gestionnaireId),
          ...(search ? [`« ${search} »`] : []),
        ],
        recherche: { valeur: search, onChange: apresFiltre(setSearch), placeholder: 'Code, description…' },
        onReinitialiser: reinitialiser,
        children: (
          <>
            <BoiteFiltre titre="Statut" mode="unique" items={itemsStatut} valeur={statutId} onChange={apresFiltre(setStatutId)} />
            <BoiteFiltre titre="Type" mode="unique" items={choix.types} valeur={typeId} onChange={apresFiltre(setTypeId)} />
            <BoiteFiltre titre="Priorité" mode="unique" items={choix.priorites} valeur={prioriteId} onChange={apresFiltre(setPrioriteId)} />
            <BoiteFiltre titre="Gestionnaire" mode="unique" items={choix.personnes} valeur={gestionnaireId} onChange={apresFiltre(setGestionnaireId)} />
          </>
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucune tâche', filtresActifs: filtre, onReinitialiser: reinitialiser } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{ nouveau: { libelle: 'Nouvelle tâche', onClick: () => fenetre.ouvrir(NOUVELLE_TACHE) } }}
      dialogues={
        fenetre.idOuvert && (
          <FicheTacheFenetre key={fenetre.idOuvert} id={fenetre.idOuvert} voisins={fenetre.voisins} onFermer={fenetre.fermer} onCree={fenetre.ouvrir} />
        )
      }
    >
      <DataGrid
        cleOrdre="administration-taches"
        rows={rows}
        colonnes={grille}
        onOuvrir={fenetre.ouvrir}
        libelleLigne={(t) => `Ouvrir la tâche ${t.code ?? ''}`.trim()}
      />
    </CadreListe>
  );
}
