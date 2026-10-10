import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, Plus, Search } from 'lucide-react';
import { buttonVariants } from '../../../components/ui/button';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { Input } from '../../../components/ui/input';
import { listerAppartementsSyndic } from '../../../lib/syndic';
import { useApi, useDebouncedValue } from '../../../lib/useApi';
import { ChoixSimple } from '../virements/CadreVirements';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import { PASTILLE, sansAccents } from './donnees';
import type { Appartement } from './types';
import { useExercice } from './useExercice';

export default function AppartementsSyndic() {
  return (
    <CadreSyndic ecran="Appartements" fullHeight>
      {(ctx) => <Liste ctx={ctx} />}
    </CadreSyndic>
  );
}

const COLONNES: ColonneGrille<Appartement>[] = [
  { nom: 'code', libelle: 'Appartement', largeur: 10, classe: 'font-mono font-medium text-foreground' },
  { nom: 'proprietaires', libelle: 'Propriétaire(s)', largeur: 26, valeur: (a) => a.proprietaires.map((p) => p.nom).join(' et ') || '—' },
  {
    nom: 'situation',
    libelle: 'Situation',
    largeur: 14,
    valeur: (a) => PASTILLE[a.pastille].libelle,
    rendu: (a) => <Badge tone={PASTILLE[a.pastille].ton}>{PASTILLE[a.pastille].libelle}</Badge>,
  },
  { nom: 'du', libelle: 'Dû', type: 'MONTANT', largeur: 11, valeur: (a) => a.exercice_affiche?.situation.du ?? null },
  { nom: 'paye', libelle: 'Payé', type: 'MONTANT', largeur: 11, valeur: (a) => a.exercice_affiche?.situation.paye ?? null },
  { nom: 'reste', libelle: 'Reste à payer', type: 'MONTANT', largeur: 11, valeur: (a) => a.exercice_affiche?.situation.reste ?? null },
  { nom: 'manque', libelle: 'Fiche', largeur: 17, classe: 'text-muted-foreground', valeur: (a) => a.manque ?? 'Complète' },
];

function Liste({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const navigate = useNavigate();
  const { exercice, setExercice, items } = useExercice(ctx.revision);
  const [q, setQ] = useState('');
  const recherche = useDebouncedValue(q.trim(), 200);
  const { data, loading, error } = useApi(() => listerAppartementsSyndic(exercice ?? undefined), [exercice, ctx.revision]);

  const lignes = useMemo(() => {
    const concernes = (data ?? []).filter((a) => a.concerne);
    if (recherche.length < 2) return concernes;
    const r = sansAccents(recherche);
    return concernes.filter((a) => sansAccents([a.code, ...a.proprietaires.map((p) => p.nom)].join(' ')).includes(r));
  }, [data, recherche]);

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, propriétaire…" aria-label="Rechercher un appartement" className="pl-8" />
        </div>
        {exercice && items.length > 0 && <ChoixSimple items={items} value={exercice} onChange={setExercice} className="w-52" />}
        <span className="ml-auto flex flex-wrap gap-2">
          <Link to="/outils/syndic/exercices/nouveau" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <CalendarPlus data-icon="inline-start" /> Ouvrir un exercice
          </Link>
          <Link to="/outils/syndic/appartements/nouveau" className={buttonVariants({ size: 'sm' })}>
            <Plus data-icon="inline-start" /> Nouvel appartement
          </Link>
        </span>
      </div>

      {!data && (error ? <ErrorState message={error} /> : <LoadingState />)}
      {!error && data && (
        <ResultsRegion loading={loading}>
          {lignes.length === 0 ? (
            <EmptyState title="Aucun appartement pour ces critères" />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                rows={lignes}
                colonnes={COLONNES}
                cleOrdre="outils-syndic-appartements"
                onOuvrir={(id) => {
                  const a = lignes.find((x) => x.id === id);
                  if (a) void navigate(`/outils/syndic/appartements/${encodeURIComponent(a.code)}`);
                }}
                libelleLigne={(a) => `Ouvrir la fiche de ${a.code}`}
              />
            </div>
          )}
        </ResultsRegion>
      )}
    </>
  );
}
