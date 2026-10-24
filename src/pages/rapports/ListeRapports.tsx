import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileBarChart, SlidersHorizontal } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, EmptyState } from '../../components/ui';
import { listRapports } from '../../lib/apiRapports';
import { cheminRapports } from '../../lib/rapports';
import { useApi } from '../../lib/useApi';
import type { GroupeRapportsDto, ModuleRapport } from '../../types/rapports';

function GroupeReplie({ groupe, module, replie, onBasculer }: Readonly<{ groupe: GroupeRapportsDto; module: ModuleRapport; replie: boolean; onBasculer: () => void }>) {
  return (
    <Card padded={false}>
      <button
        type="button"
        aria-expanded={!replie}
        className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-label font-medium"
        onClick={onBasculer}
      >
        {replie ? <ChevronRight aria-hidden className="size-4" /> : <ChevronDown aria-hidden className="size-4" />}
        {groupe.nom}
        <span className="font-normal text-muted-foreground">({groupe.rapports.length})</span>
      </button>
      {!replie && (
        <ul className="border-t border-border">
          {groupe.rapports.map((r) => (
            <li key={r.code} className="border-b border-border/60 last:border-b-0">
              <Link to={`${cheminRapports(module)}/${encodeURIComponent(r.code)}`} className="flex items-center gap-2 px-4 py-2 text-body hover:bg-muted/40">
                <FileBarChart aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.libelle}</span>
                {r.avecParametres && <SlidersHorizontal aria-label="Avec filtres" className="size-3.5 shrink-0 text-muted-foreground" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Hub des rapports d'un module : groupes repliables, filtrés côté serveur selon les droits du profil. */
export default function ListeRapports({ module }: Readonly<{ module: ModuleRapport }>) {
  const { data, loading, error, refetch } = useApi(() => listRapports(module), [module]);
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());

  function basculer(nom: string) {
    setReplies((r) => {
      const suivant = new Set(r);
      if (!suivant.delete(nom)) suivant.add(nom);
      return suivant;
    });
  }

  const groupes = data ? [...data].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, 'fr')) : [];

  return (
    <PageShell title="Rapports" icon={<FileBarChart />}>
      <div className="flex flex-col gap-3">
        {loading && !data && (
          <div className="flex flex-col gap-2" aria-busy>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {error && (
          <EmptyState
            title="Impossible de charger les rapports"
            message={error}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Réessayer
              </Button>
            }
          />
        )}
        {!error && data && groupes.length === 0 && <EmptyState title="Aucun rapport n'est disponible pour votre profil." />}
        {!error &&
          data &&
          groupes.map((g) => <GroupeReplie key={g.nom} groupe={g} module={module} replie={replies.has(g.nom)} onBasculer={() => basculer(g.nom)} />)}
      </div>
    </PageShell>
  );
}
