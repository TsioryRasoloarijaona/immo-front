import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound } from 'lucide-react';
import { Badge } from '../../components/ui';
import { Button } from '../../components/ui/button';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import ColumnSelector from '../../components/ColumnSelector';
import CadreListe from '../../components/patrimoine/CadreListe';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import FicheUtilisateurFenetre from '../../components/utilisateurs/FicheUtilisateurFenetre';
import { DEFAULT_PAGE_SIZE, listUtilisateurs } from '../../lib/api';
import { EXPORT_UTILISATEURS, getUtilisateursReferences } from '../../lib/apiUtilisateurs';
import { colonneLocale as colonne, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { formatDate, pluriel } from '../../lib/format';
import { voisinsDe } from '../../lib/fenetreFiche';
import { puceUnique } from '../../lib/pucesFiltres';
import { NOUVEAU_UTILISATEUR } from '../../lib/saisieUtilisateur';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { ColonneDto, UtilisateurListItemDto } from '../../types';
import type { FiltresUtilisateurs } from '../../types/utilisateurs';
import AffecterProjetsDialog from './AffecterProjetsDialog';
import type { CompteAReinitialiser } from './ReinitialiserMotDePasse';

type Statut = 'active' | 'disabled';

const STATUTS: { label: string; value: Statut }[] = [
  { label: 'Actifs', value: 'active' },
  { label: 'Désactivés', value: 'disabled' },
];

const oui = (b?: boolean) => (b ? 'Oui' : 'Non');

type Definition = Omit<ColonneGrille<UtilisateurListItemDto>, 'nom' | 'libelle'>;

const DEFINITIONS: Record<string, Definition> = {
  username: { largeur: 12, classe: 'font-medium text-foreground' },
  description: { largeur: 20 },
  email: { largeur: 20 },
  mobile: { largeur: 12 },
  disabled: { largeur: 8, valeur: (r) => oui(r.disabled), rendu: (r) => <Badge tone={r.disabled ? 'neutral' : 'success'}>{r.disabled ? 'Oui' : 'Non'}</Badge> },
  creePar: { largeur: 12 },
  dateCreation: { largeur: 10, valeur: (r) => formatDate(r.dateCreation), rendu: (r) => formatDate(r.dateCreation) },
  modifiePar: { largeur: 12 },
  modifieLe: { largeur: 10, valeur: (r) => formatDate(r.modifieLe), rendu: (r) => formatDate(r.modifieLe) },
  phone: { largeur: 12 },
  accesMobile: { largeur: 8, valeur: (r) => oui(r.accesMobile), rendu: (r) => oui(r.accesMobile) },
  accesMessagerie: { largeur: 8, valeur: (r) => oui(r.accesMessagerie), rendu: (r) => oui(r.accesMessagerie) },
  roles: { largeur: 16, valeur: (r) => (r.roles ?? []).join(', '), rendu: (r) => (r.roles ?? []).join(', ') || '—' },
  nombreProjets: { largeur: 8, type: 'NOMBRE' },
};

const CATALOGUE: ColonneDto[] = [
  colonne('username', 'Code', 'GENERAL', 'TEXTE', true),
  colonne('description', 'Description', 'GENERAL', 'TEXTE', true),
  colonne('email', 'Email', 'COORDONNEES', 'TEXTE', true),
  colonne('mobile', 'Mobile', 'COORDONNEES', 'TEXTE', true),
  colonne('disabled', 'Inactif', 'GENERAL', 'TEXTE', true),
  colonne('creePar', 'Créé par', 'AUDIT', 'TEXTE', true),
  colonne('dateCreation', 'Créé le', 'AUDIT', 'DATE', true),
  colonne('modifiePar', 'Modifié par', 'AUDIT', 'TEXTE', true),
  colonne('modifieLe', 'Modifié le', 'AUDIT', 'DATE', true),
  colonne('phone', 'Téléphone', 'COORDONNEES'),
  colonne('accesMobile', 'Accès mobile', 'GENERAL'),
  colonne('accesMessagerie', 'Accès messagerie', 'GENERAL'),
  colonne('roles', 'Rôles', 'GENERAL'),
  colonne('nombreProjets', 'Projets', 'GENERAL', 'NOMBRE'),
];

const DISPOSITION: DispositionColonnes = { ordre: CATALOGUE.map((c) => c.nom), poids: {} };

/** `/utilisateurs` : comptes AdmUser, Administrateur seul (le serveur répond 403 aux autres). */
export default function UtilisateursList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statut, setStatut] = useState<Statut | null>('active');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [personnelId, setPersonnelId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [dialogUser, setDialogUser] = useState<{ id: string; label: string; roles?: string[] } | null>(null);

  const filtres = useMemo<FiltresUtilisateurs>(
    () => ({
      search: debouncedSearch || undefined,
      disabled: statut === null ? undefined : statut === 'disabled',
      roleId: roleId ?? undefined,
      personnelId: personnelId ?? undefined,
    }),
    [debouncedSearch, statut, roleId, personnelId],
  );

  const { data, loading, error, refetch } = useApi(() => listUtilisateurs(filtres, { page, size: DEFAULT_PAGE_SIZE }), [filtres, page], 'utilisateurs');
  const references = useApi(() => getUtilisateursReferences(), []);
  const colonnes = useColonnesVisibles('utilisateurs', CATALOGUE, DISPOSITION);
  const exportListe = useExportListe(EXPORT_UTILISATEURS, { ...filtres },'utilisateurs');
  const rows = data?.content ?? [];
  const ouvrir = (id: string) => setOuvert(id);

  const grille = useMemo<ColonneGrille<UtilisateurListItemDto>[]>(
    () => colonnes.colonnes.map((c) => ({ classe: 'text-muted-foreground', ...DEFINITIONS[c.nom], nom: c.nom, libelle: c.libelle })),
    [colonnes.colonnes],
  );

  function choisir<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }
  const filtresActifs = !!search || statut !== 'active' || !!roleId || !!personnelId;
  function reinitialiser() {
    setPage(0);
    setSearch('');
    setStatut('active');
    setRoleId(null);
    setPersonnelId(null);
  }
  const itemsReference = (liste?: { id: string; code?: string; description?: string }[]) =>
    (liste ?? []).map((i) => ({ value: i.id, label: i.description || i.code || i.id }));
  const itemsRoles = itemsReference(references.data?.roles);
  const itemsPersonnels = itemsReference(references.data?.personnels);

  return (
    <CadreListe
      titre="Comptes utilisateurs"
      cle="utilisateurs"
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, 'compte') : undefined}
      selecteur={
        <ColumnSelector compact catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
          onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
      }
      panneau={{
        puces: [
          ...puceUnique(STATUTS, statut === 'active' ? null : statut),
          ...puceUnique(itemsRoles, roleId),
          ...puceUnique(itemsPersonnels, personnelId),
          ...(search ? [`« ${search} »`] : []),
        ],
        recherche: { valeur: search, onChange: (v) => choisir(setSearch, v), placeholder: 'Code, description, email…' },
        onReinitialiser: reinitialiser,
        children: (
          <>
            <BoiteFiltre titre="Statut" mode="unique" items={STATUTS} valeur={statut} onChange={(v) => choisir(setStatut, v as Statut | null)} />
            <BoiteFiltre titre="Rôle" mode="unique" items={itemsRoles} valeur={roleId} onChange={(v) => choisir(setRoleId, v)} />
            <BoiteFiltre titre="Personnel" mode="unique" items={itemsPersonnels} valeur={personnelId} onChange={(v) => choisir(setPersonnelId, v)} />
          </>
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucun compte', filtresActifs, onReinitialiser: reinitialiser } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{ nouveau: { libelle: 'Nouveau compte', onClick: () => ouvrir(NOUVEAU_UTILISATEUR) } }}
      exportListe={{ export: exportListe }}
      dialogues={
        <>
          {ouvert && (
            <FicheUtilisateurFenetre key={ouvert} id={ouvert} voisins={voisinsDe(rows.map((r) => r.id), ouvert, ouvrir)}
              onFermer={() => setOuvert(null)} onCree={ouvrir} />
          )}
          {dialogUser && <AffecterProjetsDialog user={dialogUser} onClose={() => setDialogUser(null)} onSaved={refetch} />}
        </>
      }
    >
      <DataGrid
        cleOrdre="utilisateurs"
        rows={rows}
        colonnes={grille}
        onOuvrir={ouvrir}
        libelleLigne={(r) => `Ouvrir le compte ${r.username ?? ''}`.trim()}
        actions={(r) => (
          <div className="flex items-center justify-center gap-1">
            <Button type="button" variant="outline" size="icon-xs" title="Affecter" aria-label={`Affecter les projets de ${r.username ?? ''}`}
              onClick={() => setDialogUser({ id: r.id, label: r.username || r.description || '', roles: r.roles })}>
              <Building2 />
            </Button>
            <Button type="button" variant="outline" size="icon-xs" title="Réinitialiser" aria-label={`Réinitialiser le mot de passe de ${r.username ?? ''}`}
              onClick={() => {
                const compte: CompteAReinitialiser = { username: r.username, description: r.description, email: r.email };
                void navigate(`/utilisateurs/reinitialiser-mot-de-passe?admUserId=${r.id}`, { state: compte });
              }}>
              <KeyRound />
            </Button>
          </div>
        )}
      />
    </CadreListe>
  );
}
