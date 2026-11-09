import { useMemo } from 'react';
import { Tags } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import { PastilleCouleur } from '../../../components/configuration/SelecteurCouleur';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { listStatutsLot } from '../../../lib/apiProjetConfig';
import { useApi } from '../../../lib/useApi';
import type { StatutLotDto } from '../../../types/projetConfig';

/** Les noms .NET (`LimeGreen`…) sont des noms CSS ; un nom inconnu donne un gris neutre. */
const couleurAffichee = (nom: string) => (CSS.supports('color', nom) ? nom : 'gray');

const COLONNES: ColonneGrille<StatutLotDto>[] = [
  { nom: 'ordre', libelle: 'Ordre', type: 'NOMBRE', largeur: 5 },
  { nom: 'code', libelle: 'Code', largeur: 12 },
  { nom: 'description', libelle: 'Description', largeur: 20 },
  {
    nom: 'couleur', libelle: 'Couleur', largeur: 10,
    rendu: (s) => (s.couleur ? <span className="flex items-center gap-2"><PastilleCouleur nom={couleurAffichee(s.couleur)} />{s.couleur}</span> : '—'),
  },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 12 },
];

/** Statuts de lot en lecture seule, groupés par genre de lot. */
export default function StatutsLotList() {
  const { data, loading, error } = useApi(listStatutsLot, [], 'projet-config-statuts-lot');
  const groupes = useMemo(() => {
    const parGenre = new Map<string, StatutLotDto[]>();
    for (const s of [...(data ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))) {
      const genre = s.genre ?? s.groupeCode ?? 'Autres';
      parGenre.set(genre, [...(parGenre.get(genre) ?? []), s]);
    }
    return [...parGenre.entries()];
  }, [data]);

  return (
    <PageShell title="Statuts de lot" icon={<Tags />}
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Statuts de lot' }]}>
      <div className="flex flex-col gap-5 p-4 md:px-7">
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.length === 0 && <EmptyState title="Aucun statut" message="Aucun statut de lot n'est configuré." />}
        {!error && groupes.map(([genre, lignes]) => (
          <section key={genre} className="flex flex-col gap-2">
            <h2 className="text-label font-medium text-foreground">{genre}</h2>
            <div className="overflow-auto rounded-xl border border-border bg-card">
              <DataGrid cleOrdre={`projet-config-statuts-lot-${genre}`} rows={lignes} colonnes={COLONNES} />
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
