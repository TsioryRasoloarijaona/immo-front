import { useMemo, useState } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import FicheRendezVousFenetre from '../../components/rendezVous/FicheRendezVousFenetre';
import { Input } from '../../components/ui/input';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { EXPORT_RENDEZ_VOUS, listRendezVous } from '../../lib/apiRendezVous';
import { formatDate, pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { NOUVEAU_RENDEZ_VOUS } from '../../lib/saisieRendezVous';
import { useChoixPersonnes } from '../../lib/useChoixRendezVous';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import useFenetreListe from '../../lib/useFenetreListe';
import type { RendezVousDto } from '../../types/rendezVous';

const COLONNES: ColonneGrille<RendezVousDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6, classe: 'font-medium text-foreground' },
  { nom: 'description', libelle: 'Description', largeur: 18 },
  { nom: 'declencheurCode', libelle: 'Déclencheur Code', largeur: 7 },
  { nom: 'declencheurNom', libelle: 'Déclencheur', largeur: 10 },
  { nom: 'datePrevue', libelle: 'Date prévisionnelle', type: 'DATE', largeur: 8 },
  { nom: 'dureePrevue', libelle: 'Durée prévisionnelle', largeur: 6 },
  { nom: 'dateFinPrevue', libelle: 'Date fin prévisionnelle', type: 'DATE', largeur: 8 },
  { nom: 'gestionnaireCode', libelle: 'Personnel Code', largeur: 7 },
  { nom: 'gestionnaireNom', libelle: 'Personnel', largeur: 10 },
  { nom: 'tierCode', libelle: 'Tier Code', largeur: 6 },
  { nom: 'tierNom', libelle: 'Tier', largeur: 10 },
  { nom: 'sourceLibelle', libelle: 'Source', largeur: 8 },
  { nom: 'sourceEntite', libelle: 'Entité fonctionnelle de la source', largeur: 9 },
  { nom: 'notes', libelle: 'Notes', largeur: 12 },
];

/** `/administration/taches` : rendez-vous (AdmTask de nature rendez-vous), Administrateur seul. */
export default function TachesList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [personnelId, setPersonnelId] = useState<string | null>(null);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const texte = useDebouncedValue(search).trim();
  const personnes = useChoixPersonnes();
  const filtres = useMemo(
    () => ({ texte: texte || undefined, gestionnaireId: personnelId ?? undefined, dateDebut: debut || undefined, dateFin: fin || undefined }),
    [texte, personnelId, debut, fin],
  );

  const { data, loading, error } = useApi(() => listRendezVous({ ...filtres, page, size: DEFAULT_PAGE_SIZE }), [filtres, page]);
  const exportListe = useExportListe(EXPORT_RENDEZ_VOUS, filtres, 'rendez-vous');
  const rows = data?.content ?? [];
  const fenetre = useFenetreListe('/administration/taches', rows.map((r) => r.id));
  const filtre = !!texte || !!personnelId || !!debut || !!fin;
  const apresFiltre = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(0);
    set(v);
  };

  function reinitialiser() {
    setPage(0);
    setSearch('');
    setPersonnelId(null);
    setDebut('');
    setFin('');
  }

  return (
    <CadreListe
      titre="Tâches"
      cle="administration-taches"
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, 'rendez-vous', 'rendez-vous') : undefined}
      panneau={{
        puces: [
          ...puceUnique(personnes, personnelId),
          ...(debut ? [`Du ${formatDate(debut)}`] : []),
          ...(fin ? [`Au ${formatDate(fin)}`] : []),
          ...(search ? [`« ${search} »`] : []),
        ],
        recherche: { valeur: search, onChange: apresFiltre(setSearch), placeholder: 'Code, description…' },
        onReinitialiser: reinitialiser,
        children: (
          <div className="flex flex-wrap items-center gap-3">
            <BoiteFiltre titre="Personnel" mode="unique" items={personnes} valeur={personnelId} onChange={apresFiltre(setPersonnelId)} />
            <span className="flex items-center gap-1.5 text-body text-muted-foreground">
              du
              <Input type="date" aria-label="Du" className="w-32.5" value={debut} max={fin || undefined} onChange={(e) => apresFiltre(setDebut)(e.target.value)} />
            </span>
            <span className="flex items-center gap-1.5 text-body text-muted-foreground">
              au
              <Input type="date" aria-label="Au" className="w-32.5" value={fin} min={debut || undefined} onChange={(e) => apresFiltre(setFin)(e.target.value)} />
            </span>
          </div>
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucun rendez-vous', filtresActifs: filtre, onReinitialiser: reinitialiser } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      exportListe={{ export: exportListe }}
      admin={{ nouveau: { libelle: 'Nouveau rendez-vous', onClick: () => fenetre.ouvrir(NOUVEAU_RENDEZ_VOUS) } }}
      dialogues={
        fenetre.idOuvert && (
          <FicheRendezVousFenetre key={fenetre.idOuvert} id={fenetre.idOuvert} voisins={fenetre.voisins} onFermer={fenetre.fermer} onCree={fenetre.ouvrir} />
        )
      }
    >
      <DataGrid
        cleOrdre="administration-taches"
        rows={rows}
        colonnes={COLONNES}
        onOuvrir={fenetre.ouvrir}
        libelleLigne={(r) => `Ouvrir le rendez-vous ${r.code ?? ''}`.trim()}
      />
    </CadreListe>
  );
}
