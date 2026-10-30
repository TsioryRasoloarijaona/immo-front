import { useMemo, useState } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import CadreListe from '../../components/patrimoine/CadreListe';
import FicheRoleFenetre from '../../components/roles/FicheRoleFenetre';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { EXPORT_ROLES, listRoles } from '../../lib/apiRoles';
import { pluriel } from '../../lib/format';
import { NOUVEAU_ROLE } from '../../lib/saisieRole';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import useFenetreListe from '../../lib/useFenetreListe';
import type { RoleLigneDto } from '../../types/roles';

const COLONNES: ColonneGrille<RoleLigneDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'description', libelle: 'Description', largeur: 20 },
  { nom: 'utilisateurs', libelle: 'Utilisateurs', type: 'NOMBRE', largeur: 5 },
  { nom: 'droits', libelle: 'Droits', type: 'NOMBRE', largeur: 5 },
];

/** `/administration/roles` : rôles (AdmRole) et leurs droits, Administrateur seul. */
export default function RolesList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const texte = useDebouncedValue(search).trim();
  const filtres = useMemo(() => ({ texte: texte || undefined }), [texte]);

  const { data, loading, error } = useApi(() => listRoles({ ...filtres, page, size: DEFAULT_PAGE_SIZE }), [filtres, page]);
  const exportListe = useExportListe(EXPORT_ROLES, filtres, 'roles');
  const rows = data?.content ?? [];
  const fenetre = useFenetreListe('/administration/roles', rows.map((r) => r.id));

  function reinitialiser() {
    setPage(0);
    setSearch('');
  }

  return (
    <CadreListe
      titre="Rôles"
      cle="administration-roles"
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, 'rôle') : undefined}
      panneau={{
        puces: search ? [`« ${search} »`] : [],
        recherche: { valeur: search, onChange: (v) => { setPage(0); setSearch(v); }, placeholder: 'Code, description…' },
        onReinitialiser: reinitialiser,
        children: null,
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucun rôle', filtresActifs: !!texte, onReinitialiser: reinitialiser } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      exportListe={{ export: exportListe }}
      admin={{ nouveau: { libelle: 'Nouveau rôle', onClick: () => fenetre.ouvrir(NOUVEAU_ROLE) } }}
      dialogues={
        fenetre.idOuvert && (
          <FicheRoleFenetre key={fenetre.idOuvert} id={fenetre.idOuvert} voisins={fenetre.voisins} onFermer={fenetre.fermer} onCree={fenetre.ouvrir} />
        )
      }
    >
      <DataGrid
        cleOrdre="administration-roles"
        rows={rows}
        colonnes={COLONNES}
        onOuvrir={fenetre.ouvrir}
        libelleLigne={(r) => `Ouvrir le rôle ${r.code ?? ''}`.trim()}
      />
    </CadreListe>
  );
}
