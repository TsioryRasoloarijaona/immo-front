import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound } from 'lucide-react';
import { Badge } from '../../components/ui';
import { Button } from '../../components/ui/button';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { DEFAULT_PAGE_SIZE, listUtilisateurs } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { formatDate, pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { estExempte } from '../../lib/roles';
import type { UtilisateurListItemDto } from '../../types';
import AffecterProjetsDialog from './AffecterProjetsDialog';
import type { CompteAReinitialiser } from './ReinitialiserMotDePasse';

// `count === 0` veut dire « sans restriction », jamais un état vide ou d'erreur (FEATURE-perimetre-commercial.md §6.3).
function perimetreBadge(count: number, roles?: string[]) {
  if (estExempte({ roles })) return <Badge tone="amber">Exempté</Badge>;
  if (count === 0) return <Badge tone="neutral">Tous les projets</Badge>;
  return <Badge tone="progress">{count} projet{count > 1 ? 's' : ''}</Badge>;
}

type DisabledFilter = 'all' | 'active' | 'disabled';

const DISABLED_ITEMS: { label: string; value: DisabledFilter }[] = [
  { label: 'Actifs', value: 'active' },
  { label: 'Désactivés', value: 'disabled' },
];

const DISABLED_PARAM: Record<DisabledFilter, boolean | undefined> = { all: undefined, active: false, disabled: true };

function employeeName(row: { employeePrenom?: string; employeeNom?: string }): string {
  const name = [row.employeePrenom, row.employeeNom].filter(Boolean).join(' ');
  return name || '—';
}

// Pas de filtre par rôle : le serveur n'expose que `search` et `disabled`, un filtre client
// ne porterait que sur la page courante.
export default function UtilisateursList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [disabledFilter, setDisabledFilter] = useState<DisabledFilter>('all');
  const [page, setPage] = useState(0);

  const [dialogUser, setDialogUser] = useState<{ id: string; label: string; roles?: string[] } | null>(null);

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  const { data, loading, error, refetch } = useApi(
    () =>
      listUtilisateurs(
        {
          search: debouncedSearch || undefined,
          disabled: DISABLED_PARAM[disabledFilter],
        },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [debouncedSearch, disabledFilter, page],
    'utilisateurs',
  );
  const rows = data?.content ?? [];

  const colonnes = useMemo<ColonneGrille<UtilisateurListItemDto>[]>(
    () => [
      {
        nom: 'username',
        libelle: 'Identifiant',
        largeur: 14,
        classe: 'font-medium text-foreground',
        titre: (r) => r.username || undefined,
        rendu: (r) => (
          <>
            {r.username || '—'}
            {r.description && (
              <div className="truncate text-micro font-normal text-muted-foreground" title={r.description}>
                {r.description}
              </div>
            )}
            {r.dateCreation && (
              <div className="truncate text-micro font-normal text-muted-foreground">Créé le {formatDate(r.dateCreation)}</div>
            )}
          </>
        ),
      },
      { nom: 'employe', libelle: 'Employé', largeur: 13, classe: 'text-muted-foreground', valeur: employeeName, rendu: employeeName, titre: employeeName },
      {
        nom: 'email',
        libelle: 'Contact',
        largeur: 14,
        classe: 'text-muted-foreground',
        titre: (r) => [r.email, r.mobile || r.phone].filter(Boolean).join(' · ') || undefined,
        rendu: (r) => (
          <>
            <div className="truncate">{r.email || '—'}</div>
            {(r.mobile || r.phone) && <div className="truncate text-micro">{r.mobile || r.phone}</div>}
          </>
        ),
      },
      { nom: 'typeEmployeLibelle', libelle: 'Type', largeur: 9, classe: 'text-muted-foreground', titre: (r) => r.typeEmployeLibelle || undefined },
      {
        nom: 'roles',
        libelle: 'Rôles',
        largeur: 12,
        valeur: (r) => (r.roles ?? []).join(', '),
        rendu: (r) =>
          r.roles && r.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {r.roles.map((role) => (
                <Badge key={role} tone={role === 'Administrateur' ? 'amber' : 'neutral'}>
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        nom: 'statut',
        libelle: 'Statut',
        largeur: 9,
        valeur: (r) => (r.disabled ? 'Désactivé' : 'Actif'),
        rendu: (r) => (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={r.disabled ? 'neutral' : 'success'}>{r.disabled ? 'Désactivé' : 'Actif'}</Badge>
            {/* mustChangePassword/profileCompleted sont des drapeaux hérités ignorés : seul
                compte l'absence d'accès web (FEATURE-acces-arpent-depuis-omran). */}
            {!r.compteWebInitialise && <Badge tone="warning">Non initialisé</Badge>}
          </div>
        ),
      },
      {
        nom: 'nombreProjets',
        libelle: 'Périmètre',
        largeur: 11,
        rendu: (r) => perimetreBadge(r.nombreProjets ?? 0, r.roles),
      },
      {
        nom: 'actions',
        libelle: 'Actions',
        largeur: 18,
        rendu: (r) => (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogUser({ id: r.id, label: r.username || employeeName(r), roles: r.roles })}
            >
              <Building2 data-icon="inline-start" /> Affecter
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const compte: CompteAReinitialiser = { username: r.username, description: r.description, email: r.email };
                void navigate(`/utilisateurs/reinitialiser-mot-de-passe?admUserId=${r.id}`, { state: compte });
              }}
            >
              <KeyRound data-icon="inline-start" /> Réinitialiser
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const filtresActifs = !!search || disabledFilter !== 'all';
  function resetFilters() {
    setPage(0);
    setSearch('');
    setDisabledFilter('all');
  }

  return (
    <CadreListe
      titre="Comptes utilisateurs"
      cle="utilisateurs"
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, 'compte') : undefined}
      panneau={{
        puces: [...puceUnique(DISABLED_ITEMS, disabledFilter === 'all' ? null : disabledFilter), ...(search ? [`« ${search} »`] : [])],
        recherche: { valeur: search, onChange: (v) => resetAndSet(setSearch, v), placeholder: 'Identifiant, description, email…' },
        onReinitialiser: resetFilters,
        children: (
          <BoiteFiltre titre="Statut" mode="unique" items={DISABLED_ITEMS} valeur={disabledFilter === 'all' ? null : disabledFilter}
            onChange={(v) => resetAndSet(setDisabledFilter, (v ?? 'all') as DisabledFilter)} />
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      avant={
        <p className="shrink-0 text-body text-muted-foreground">
          Les comptes se créent dans Omran. Ici : ouvrir l'accès Arpent d'un compte (« Réinitialiser ») et affecter son périmètre.
        </p>
      }
      vide={rows.length === 0 ? { aucun: 'Aucun compte', filtresActifs, onReinitialiser: resetFilters } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      dialogues={dialogUser && (
        <AffecterProjetsDialog
          user={dialogUser}
          onClose={() => setDialogUser(null)}
          onSaved={refetch}
        />
      )}
    >
      <DataGrid rows={rows} colonnes={colonnes} cleOrdre="utilisateurs" />
    </CadreListe>
  );
}
