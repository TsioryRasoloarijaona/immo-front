import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, RotateCcw, Search } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import SelectFiltre from '../../components/SelectFiltre';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { genererCommissions, getDossiersCommission } from '../../lib/apiCommissions';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { DossierCommissionDto, ResultatGenerationDto, TypeCommission } from '../../types/commissions';
import { lire } from './lecture';

const MAX_SELECTION = 500;

const TYPES: { type: TypeCommission; libelle: string; date: (d: DossierCommissionDto) => string | null }[] = [
  { type: 'CONCRETISATION', libelle: 'Concrétisation', date: (d) => d.dateConcretisation },
  { type: 'FINALISATION_1', libelle: 'Finalisation 1', date: (d) => d.dateFinalisation1 },
  { type: 'FINALISATION_2', libelle: 'Finalisation 2', date: (d) => d.dateFinalisation2 },
  { type: 'DESISTEMENT', libelle: 'Désistement', date: (d) => d.dateAnnulation },
];

const COLONNES: ColonneGrille<Ligne>[] = [
  { nom: 'code', libelle: 'Dossier', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'statut', libelle: 'Statut', largeur: 8 },
  { nom: 'client', libelle: 'Client', largeur: 12 },
  { nom: 'articleCode', libelle: 'Article', largeur: 8 },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 8 },
  { nom: 'commercial', libelle: 'Commercial', largeur: 10 },
  { nom: 'gestionnaire', libelle: 'Gestionnaire', largeur: 10 },
  { nom: 'dateConcretisation', libelle: 'Concrétisation', type: 'DATE', largeur: 6 },
  { nom: 'dateFinalisation1', libelle: 'Finalisation 1', type: 'DATE', largeur: 6 },
  { nom: 'dateFinalisation2', libelle: 'Finalisation 2', type: 'DATE', largeur: 6 },
  { nom: 'dateAnnulation', libelle: 'Désistement', type: 'DATE', largeur: 6 },
  { nom: 'prixVenteTtc', libelle: 'Prix de vente TTC', type: 'MONTANT', largeur: 8 },
  { nom: 'commissionConcretisation', libelle: 'Comm. concrétisation', type: 'MONTANT', largeur: 8 },
  { nom: 'commissionFinalisation1', libelle: 'Comm. finalisation 1', type: 'MONTANT', largeur: 8 },
  { nom: 'commissionFinalisation2', libelle: 'Comm. finalisation 2', type: 'MONTANT', largeur: 8 },
  { nom: 'commissionDesistement', libelle: 'Comm. désistement', type: 'MONTANT', largeur: 8 },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 8, classe: 'font-bold text-(--success)' },
  { nom: 'montantReste', libelle: 'Reste', type: 'MONTANT', largeur: 8, classe: 'font-bold text-destructive' },
];

type Ligne = DossierCommissionDto & { id: string };

const TOUS = 'tous';

function Resultat({ resultat }: Readonly<{ resultat: ResultatGenerationDto }>) {
  const [ouvert, setOuvert] = useState(false);
  const n = resultat.ignores.length;
  return (
    <div role="status" className="rounded-lg border border-border bg-card px-3 py-2 text-body">
      <p>
        {resultat.creees.length} créées, {n} ignorées
        {n > 0 && (
          <button type="button" className="ml-2 inline-flex items-center gap-0.5 text-(--info)" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
            {ouvert ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />} Voir les ignorés
          </button>
        )}
      </p>
      {ouvert && (
        <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
          {resultat.ignores.map((i) => (
            <li key={i.dossierId}>
              {i.dossierCode ?? i.dossierId} — {i.libelle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OngletDossiers({
  trancheId,
  ecriture,
  onChange,
}: Readonly<{ trancheId: UUID; ecriture: boolean; onChange: () => void }>) {
  const navigate = useNavigate();
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [typesChoisis, setTypesChoisis] = useState<Set<TypeCommission>>(new Set());
  const [personne, setPersonne] = useState(TOUS);
  const [recherche, setRecherche] = useState('');
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [resultat, setResultat] = useState<ResultatGenerationDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const typeUnique = typesChoisis.size === 1 ? [...typesChoisis][0] : undefined;
  const dossiers = useApi(
    () => lire(() => getDossiersCommission(trancheId, { du: du || undefined, au: au || undefined, type: typeUnique })),
    [trancheId, du, au, typeUnique],
  );

  const personnes = useMemo(() => {
    const parId = new Map<string, string>();
    for (const d of dossiers.data ?? []) {
      if (d.commercialId && d.commercial) parId.set(d.commercialId, d.commercial);
      if (d.gestionnaireId && d.gestionnaire) parId.set(d.gestionnaireId, d.gestionnaire);
      if (d.gestionnaire2Id && d.gestionnaire2) parId.set(d.gestionnaire2Id, d.gestionnaire2);
    }
    const items = [...parId].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    return [{ value: TOUS, label: 'Commercial / Gestionnaire : tous' }, ...items];
  }, [dossiers.data]);

  const rows = useMemo<Ligne[]>(() => {
    const mot = recherche.trim().toLowerCase();
    const typesCoches = TYPES.filter((t) => typesChoisis.has(t.type));
    return (dossiers.data ?? [])
      .filter((d) => typesCoches.every((t) => t.date(d)))
      .filter((d) => personne === TOUS || [d.commercialId, d.gestionnaireId, d.gestionnaire2Id].includes(personne))
      .filter((d) => !mot || (d.code ?? '').toLowerCase().includes(mot))
      .map((d) => ({ ...d, id: d.dossierId }));
  }, [dossiers.data, typesChoisis, personne, recherche]);

  const choisis = useMemo(() => rows.filter((r) => ids.has(r.id)).map((r) => r.id), [rows, ids]);

  function basculerType(type: TypeCommission) {
    setTypesChoisis((prev) => {
      const suivant = new Set(prev);
      if (!suivant.delete(type)) suivant.add(type);
      return suivant;
    });
  }

  function toutSelectionner() {
    if (rows.length > MAX_SELECTION) {
      setErreur(`Sélection limitée à ${MAX_SELECTION} dossiers : affinez les filtres (${rows.length} dossiers correspondent).`);
      return;
    }
    setErreur(null);
    setIds(new Set(rows.map((r) => r.id)));
  }

  async function generer(type: TypeCommission) {
    if (choisis.length > MAX_SELECTION) {
      setErreur(`Sélection limitée à ${MAX_SELECTION} dossiers.`);
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      setResultat(await genererCommissions(trancheId, { type, dossierIds: choisis }));
      onChange();
      await dossiers.refetch();
    } catch (err) {
      setResultat(null);
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  if (dossiers.error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={dossiers.error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void dossiers.refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  }
  if (!dossiers.data) return <LoadingState />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label">Date de</span>
        <InputGroup className="w-36">
          <InputGroupInput type="date" aria-label="Date de" value={du} onChange={(e) => setDu(e.target.value)} />
        </InputGroup>
        <span className="text-label">À</span>
        <InputGroup className="w-36">
          <InputGroupInput type="date" aria-label="À" value={au} onChange={(e) => setAu(e.target.value)} />
        </InputGroup>
        {TYPES.map((t) => (
          <label key={t.type} className="flex items-center gap-1 text-label">
            <input type="checkbox" checked={typesChoisis.has(t.type)} onChange={() => basculerType(t.type)} />
            {t.libelle}
          </label>
        ))}
        <SelectFiltre ariaLabel="Commercial / Gestionnaire" items={personnes} value={personne} onChange={setPersonne} />
        <InputGroup className="w-48">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput aria-label="Recherche par dossier" placeholder="Dossier" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </InputGroup>
      </div>
      {ecriture && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={toutSelectionner}>
            Tout sélectionner (filtré)
          </Button>
          {TYPES.map((t) => (
            <Button key={t.type} type="button" variant="outline" size="sm" disabled={enCours || choisis.length === 0} onClick={() => void generer(t.type)}>
              Générer {t.libelle.toLowerCase()}
            </Button>
          ))}
        </div>
      )}
      {erreur && (
        <p role="alert" className="text-body text-destructive">
          {erreur}
        </p>
      )}
      {resultat && <Resultat resultat={resultat} />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <EmptyState title="Aucun dossier ne correspond." />
        ) : (
          <DataGrid
            cleOrdre="commissions-dossiers"
            rows={rows}
            colonnes={COLONNES}
            bandeauRegroupement={false}
            selection={{
              ids,
              onToggle: (id) =>
                setIds((prev) => {
                  const suivant = new Set(prev);
                  if (!suivant.delete(id)) suivant.add(id);
                  return suivant;
                }),
              onToggleAll: (tous) => setIds(new Set(tous)),
            }}
            onOuvrir={(id) => navigate(`/dossiers/${id}`)}
            libelleLigne={(d) => `Ouvrir le dossier ${d.code ?? d.id}`}
          />
        )}
      </div>
    </div>
  );
}
