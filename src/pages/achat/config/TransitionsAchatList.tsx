import { useMemo, useState } from 'react';
import { RefreshCw, Workflow } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import { Button } from '../../../components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { listTransitionsAchat } from '../../../lib/apiAchatConfig';
import { useApi } from '../../../lib/useApi';
import type { TransitionAchatDto } from '../../../types/achatConfig';

const SANS_GESTION = 'Sans gestion';

const rolesTexte = (t: TransitionAchatDto) => t.roles.map((r) => r.code ?? '').join(', ');

const COLONNES: ColonneGrille<TransitionAchatDto>[] = [
  { nom: 'ordre', libelle: 'Ordre', type: 'NOMBRE', largeur: 5 },
  { nom: 'description', libelle: 'Description', largeur: 22 },
  { nom: 'statutDepartCode', libelle: 'De', largeur: 14 },
  { nom: 'statutArriveeCode', libelle: 'À', largeur: 14 },
  {
    nom: 'roles', libelle: 'Rôles', largeur: 16, valeur: rolesTexte,
    rendu: (t) => (t.roles.length > 0 ? rolesTexte(t) : <span className="text-muted-foreground">Aucun rôle</span>),
  },
  { nom: 'noteObligatoire', libelle: 'Commentaire obligatoire', type: 'BOOLEEN', largeur: 8 },
  { nom: 'valideeParDeclencheur', libelle: 'Validée par le déclencheur', type: 'BOOLEEN', largeur: 8 },
  { nom: 'nombrePassages', libelle: 'Passages', type: 'NOMBRE', largeur: 7 },
  { nom: 'dernierPassage', libelle: 'Dernier passage', type: 'DATE', largeur: 10 },
];

/** « Sans gestion » toujours en dernier ; les autres par ordre alphabétique. */
function grouperParGestion(lignes: TransitionAchatDto[]): [string, TransitionAchatDto[]][] {
  const parGestion = new Map<string, TransitionAchatDto[]>();
  for (const t of [...lignes].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))) {
    parGestion.set(t.gestionLibelle, [...(parGestion.get(t.gestionLibelle) ?? []), t]);
  }
  const rang = (g: string) => (g === SANS_GESTION ? 1 : 0);
  return [...parGestion.entries()].sort(([a], [b]) => rang(a) - rang(b) || a.localeCompare(b, 'fr'));
}

/** Transitions des pièces d'achat en lecture seule, une table par gestion. */
export default function TransitionsAchatList() {
  const [utilisees, setUtilisees] = useState(false);
  const { data, loading, error, refetch } = useApi(() => listTransitionsAchat(utilisees), [utilisees], 'achat-config-transitions');
  const groupes = useMemo(() => grouperParGestion(data ?? []), [data]);

  return (
    <PageShell title="Transitions des pièces" icon={<Workflow />}
      crumbs={[{ label: 'Achat' }, { label: 'Configuration' }, { label: 'Transitions' }]}
      actions={<Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}><RefreshCw /> Rafraîchir</Button>}>
      <div className="flex flex-col gap-5 p-4 md:px-7">
        <label className="flex w-fit items-center gap-2 text-label text-foreground">
          <input type="checkbox" className="accent-(--brand)" checked={utilisees} onChange={(e) => setUtilisees(e.target.checked)} />
          Seulement les transitions utilisées
        </label>
        {loading && !data && <LoadingState />}
        {error && (
          <>
            <ErrorState message={error} />
            <Button type="button" variant="outline" className="self-center" onClick={() => void refetch()}>Réessayer</Button>
          </>
        )}
        {!error && data && data.length === 0 && (
          <EmptyState title={utilisees ? "Aucune transition n'a servi" : 'Aucune transition'} />
        )}
        {!error && groupes.map(([gestion, lignes]) => (
          <section key={gestion} className="flex flex-col gap-2">
            <h2 className="text-label font-medium text-foreground">{gestion}</h2>
            <div className="overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                cleOrdre={`achat-config-transitions-${gestion}`}
                rows={lignes}
                colonnes={COLONNES}
                classeLigne={(t) => (t.nombrePassages === 0 ? 'text-muted-foreground' : undefined)}
              />
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
