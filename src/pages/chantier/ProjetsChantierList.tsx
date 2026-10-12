import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, HardHat } from 'lucide-react';
import PageShell from '../../components/PageShell';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { EmptyState, ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { listProjetsChantier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { pluriel } from '../../lib/format';
import type { ProjetChantierListItemDto } from '../../types';
import { SqueletteGrille } from './chantierUi';

const COLONNES: ColonneGrille<ProjetChantierListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 10, classe: 'text-muted-foreground' },
  { nom: 'description', libelle: 'Désignation', largeur: 20, classe: 'font-medium text-foreground', titre: (r) => r.description ?? undefined },
  { nom: 'societeCode', libelle: 'Société', largeur: 10, classe: 'text-muted-foreground', titre: (r) => r.societeDescription ?? undefined },
  { nom: 'statutDescription', libelle: 'Statut', largeur: 9, classe: 'text-muted-foreground' },
  { nom: 'nbLots', libelle: 'Lots', type: 'NOMBRE', largeur: 6, classe: 'text-muted-foreground' },
  { nom: 'totalMarchesTTC', libelle: 'Marchés TTC', type: 'MONTANT', largeur: 13, classe: 'text-foreground' },
  { nom: 'totalDecomptesTTC', libelle: 'Décomptes TTC', type: 'MONTANT', largeur: 13, classe: 'text-muted-foreground' },
  { nom: 'totalFacture', libelle: 'Facturé', type: 'MONTANT', largeur: 13, classe: 'text-muted-foreground' },
  { nom: 'totalRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 13, classe: 'text-(--success)' },
  { nom: 'totalResteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 13, classe: 'text-destructive' },
];

export default function ProjetsChantierList() {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(() => listProjetsChantier(), [], 'chantier-projets');
  const [centresVisibles, setCentresVisibles] = useState(false);

  const projets = data ?? [];
  const chantiers = projets.filter((p) => !p.estCentreDeCouts);
  const centres = projets.filter((p) => p.estCentreDeCouts);
  const ouvrir = (id: string) => void navigate(`/chantier/projets/${id}`);
  const libelleLigne = (r: ProjetChantierListItemDto) => `Ouvrir le projet ${r.code ?? r.id}`;

  return (
    <PageShell
      title="Projets"
      crumbs={[{ label: 'Chantier' }, { label: 'Projets' }]}
      icon={<HardHat />}
      accent="var(--sec-chantier-projet)"
      accentBg="var(--sec-chantier-projet-bg)"
      fullHeight
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pt-1">
        {loading && !data && <SqueletteGrille />}
        {error && <ErrorState message={error} />}
        {!error && data && projets.length === 0 && (
          <EmptyState
            title="Aucun projet dans votre périmètre"
            message="Les projets de travaux visibles sont ceux sur lesquels votre compte est habilité."
          />
        )}
        {!error && data && projets.length > 0 && (
          <>
            <section className="flex shrink-0 flex-col gap-1.5">
              <h2 className="text-label font-semibold text-foreground">Chantiers · {pluriel(chantiers.length, 'projet')}</h2>
              {chantiers.length === 0 ? (
                <EmptyState title="Aucun chantier" message="Seuls des centres de coûts sont visibles." />
              ) : (
                <div className="min-w-0 overflow-auto rounded-xl border border-border bg-card">
                  <DataGrid cleOrdre="chantier-projets" rows={chantiers} colonnes={COLONNES} onOuvrir={ouvrir} libelleLigne={libelleLigne} />
                </div>
              )}
            </section>

            {centres.length > 0 && (
              <section className="flex shrink-0 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-(--neutral-bg) px-3 py-1.5">
                  <h2 className="text-label font-semibold text-foreground">
                    Centres de coûts · {pluriel(centres.length, 'projet')}
                    <span className="ml-2 font-normal text-muted-foreground">projets annuels sans lot, pour les dépenses</span>
                  </h2>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCentresVisibles((v) => !v)} aria-expanded={centresVisibles}>
                    {centresVisibles ? <ChevronDown data-icon="inline-start" /> : <ChevronRight data-icon="inline-start" />}
                    {centresVisibles ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                {centresVisibles && (
                  <div className="min-w-0 overflow-auto rounded-xl border border-border bg-card">
                    <DataGrid cleOrdre="chantier-projets" rows={centres} colonnes={COLONNES} onOuvrir={ouvrir} libelleLigne={libelleLigne} />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
