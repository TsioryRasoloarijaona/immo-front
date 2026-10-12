import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Plus, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { listEntitesJuridiques, type FiltreActif } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { poidsColonne, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { formatNumber } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ColonneDto, EntiteJuridiqueDto, GroupeColonne, TypeColonne } from '../../types';

/* Les colonnes de la liste ENTITES JURIDIQUE de l'aide OMRAN, toutes servies par `GET /api/entites-juridiques`
   (une dizaine d'entités) : catalogue local, seule la sélection affichée change. */
const col = (nom: string, libelle: string, groupe: GroupeColonne, type: TypeColonne, parDefaut = false): ColonneDto => ({
  nom,
  libelle,
  groupe,
  type,
  parDefaut,
  groupable: false,
  agregeable: false,
  fonctions: [],
});

const CATALOGUE: ColonneDto[] = [
  col('code', 'Code', 'IDENTITE', 'TEXTE', true),
  col('description', 'Description', 'IDENTITE', 'TEXTE', true),
  col('actif', 'Active', 'IDENTITE', 'BOOLEEN', true),
  col('formeJuridique', 'Forme juridique', 'IDENTITE', 'TEXTE', true),
  col('matriculeFiscal', 'Matricule fiscal', 'IDENTITE', 'TEXTE', true),
  col('registreCommerce', 'Registre de commerce', 'IDENTITE', 'TEXTE'),
  col('ice', "Identifiant commun de l'entreprise", 'IDENTITE', 'TEXTE'),
  col('cnss', 'CNSS', 'IDENTITE', 'TEXTE'),
  col('patente', 'Patente', 'IDENTITE', 'TEXTE'),
  col('capital', 'Capital', 'IDENTITE', 'MONTANT'),
  col('dateCreation', 'Date de création', 'IDENTITE', 'DATE'),
  col('dateLiquidation', 'Date liquidation', 'IDENTITE', 'DATE'),
  col('groupeLibelle', 'Groupe actionnaire', 'ACTEURS', 'TEXTE'),
  col('nombreActionnaires', 'Nombre actionnaires', 'ACTEURS', 'NOMBRE'),
  col('nombreParts', 'Nombre de parts (actions)', 'ACTEURS', 'NOMBRE'),
  col('adresse', 'Adresse 1', 'COORDONNEES', 'TEXTE'),
  col('adresse2', 'Adresse 2', 'COORDONNEES', 'TEXTE'),
  col('adresse3', 'Adresse 3', 'COORDONNEES', 'TEXTE'),
  col('codePostal', 'Code postal', 'COORDONNEES', 'TEXTE'),
  col('ville', 'Ville', 'COORDONNEES', 'TEXTE', true),
  col('paysLibelle', 'Pays', 'COORDONNEES', 'TEXTE'),
  col('telephone', 'Tél.', 'COORDONNEES', 'TEXTE'),
  col('mobile', 'Mobile', 'COORDONNEES', 'TEXTE'),
  col('fax', 'Fax', 'COORDONNEES', 'TEXTE'),
  col('email', 'Email', 'COORDONNEES', 'TEXTE'),
  col('siteWeb', 'Site web', 'COORDONNEES', 'TEXTE'),
  col('villeSignature', 'Courrier fait à', 'ACTEURS', 'TEXTE'),
  col('signataireLibelle', 'Courrier signataire', 'ACTEURS', 'TEXTE'),
  col('representantLegalLibelle', 'Représentant légal', 'ACTEURS', 'TEXTE'),
  col('responsableCommercialLibelle', 'Responsable commercial', 'ACTEURS', 'TEXTE'),
  col('responsableTechniqueLibelle', 'Responsable technique', 'ACTEURS', 'TEXTE'),
  col('descriptionLongue', 'Description détaillée', 'IDENTITE', 'TEXTE'),
  col('creePar', 'Créé par', 'AUDIT', 'TEXTE'),
  col('creeLe', 'Créé le', 'AUDIT', 'DATE'),
  col('modifiePar', 'Modifié par', 'AUDIT', 'TEXTE'),
  col('modifieLe', 'Modifié le', 'AUDIT', 'DATE'),
];

const DISPOSITION: DispositionColonnes = {
  ordre: [],
  poids: { code: 10, description: 22, actif: 8, formeJuridique: 10, matriculeFiscal: 12, ville: 12 },
};

const FILTRES: { value: FiltreActif; label: string }[] = [
  { value: 'tous', label: 'Toutes' },
  { value: 'true', label: 'Actives' },
  { value: 'false', label: 'Inactives' },
];

function rendu(nom: string): ColonneGrille<EntiteJuridiqueDto>['rendu'] {
  if (nom !== 'actif') return undefined;
  return (e) => (e.actif ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>);
}

export default function EntitesJuridiquesList() {
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);
  const [search, setSearch] = useState('');
  const [actif, setActif] = useState<FiltreActif>('tous');
  const debouncedSearch = useDebouncedValue(search);
  const { data, loading, error } = useApi(
    () => listEntitesJuridiques({ actif, search: debouncedSearch || undefined }),
    [actif, debouncedSearch],
  );
  const colonnes = useColonnesVisibles('entites-juridiques', CATALOGUE, DISPOSITION);
  const grille = useMemo<ColonneGrille<EntiteJuridiqueDto>[]>(
    () =>
      colonnes.colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION.poids),
        classe: c.nom === 'description' ? 'font-medium text-foreground' : 'text-muted-foreground',
        rendu: rendu(c.nom),
        valeur: c.nom === 'actif' ? (e: EntiteJuridiqueDto) => (e.actif ? 'Active' : 'Inactive') : undefined,
      })),
    [colonnes.colonnes],
  );

  return (
    <PageShell
      title="Entités juridiques"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Entités juridiques' }]}
      actions={
        admin ? (
          <Button size="sm" onClick={() => void navigate('/entites-juridiques/nouveau')}>
            <Plus data-icon="inline-start" /> Nouvelle entité
          </Button>
        ) : undefined
      }
      icon={<Landmark />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup className="max-w-md min-w-60 flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Rechercher une entité"
              placeholder="Rechercher — code, libellé, matricule fiscal, registre du commerce…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Select items={FILTRES} value={actif} onValueChange={(v) => setActif(v ?? 'tous')}>
            <SelectTrigger className="w-36" aria-label="Filtrer par état">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FILTRES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {formatNumber(data.length)} entité{data.length > 1 ? 's' : ''}
              </div>
              <ColumnSelector
                catalogue={colonnes.catalogueServi}
                visibles={colonnes.visibles}
                onBasculer={colonnes.basculer}
                onReinitialiser={colonnes.reinitialiser}
                estDefaut={colonnes.estDefaut}
              />
            </div>
            {data.length === 0 ? (
              <EmptyState
                title={search ? 'Aucun résultat' : 'Rien à afficher'}
                message={search ? 'Aucune entité ne correspond à la recherche.' : 'Aucune entité juridique pour ce filtre.'}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="entites-juridiques"
                  rows={data}
                  colonnes={grille}
                  onOuvrir={(id) => navigate(`/entites-juridiques/${id}`)}
                  libelleLigne={(e) => `Ouvrir l'entité ${e.description || e.code || ''}`.trim()}
                />
              </div>
            )}
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
