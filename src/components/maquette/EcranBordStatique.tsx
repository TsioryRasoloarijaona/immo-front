import type { ReactNode } from 'react';
import { Badge, StatCard } from '../ui';
import DataGrid from '../DataGrid';
import PageListe from '../liste/PageListe';
import EnteteListe from '../liste/EnteteListe';
import BarreEtatListe from '../liste/BarreEtatListe';
import BarreOutilsFlottante from '../liste/BarreOutilsFlottante';
import { useActionMaquette } from './useActionMaquette';
import type { ConfigBord } from './types';

/** Coque des tableaux de bord : en-tête « Maquette », corps libre, barre d'outils sans effet. */
export function CoqueBord({ titre, cle, children }: Readonly<{ titre: string; cle: string; children: ReactNode }>) {
  const agir = useActionMaquette();
  return (
    <PageListe titre={titre}>
      <EnteteListe titre={titre}>
        <Badge tone="amber">Maquette</Badge>
      </EnteteListe>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-3 pt-2 pb-16">{children}</div>
      <BarreEtatListe lignes={titre} selection="aucune" />
      <BarreOutilsFlottante
        cle={cle}
        ligneSelectionnee={false}
        actions={(['rafraichir', 'exporter', 'imprimer'] as const).map((id) => ({ id, onClick: () => agir() }))}
      />
    </PageListe>
  );
}

/** Cartes de chiffres puis tableaux, entièrement décrits par `ConfigBord`. */
export default function EcranBordStatique({ config, cle }: Readonly<{ config: ConfigBord; cle: string }>) {
  return (
    <CoqueBord titre={config.titre} cle={cle}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {config.cartes.map((c) => (
          <StatCard key={c.libelle} label={c.libelle} value={c.valeur} sub={c.sous} tone={c.tone} />
        ))}
      </div>
      {config.sections.map((s) => (
        <section key={s.titre} className="flex flex-col gap-1">
          <h2 className="text-body font-medium text-foreground">{s.titre}</h2>
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid rows={s.lignes} colonnes={s.colonnes} bandeauRegroupement={false} />
          </div>
        </section>
      ))}
    </CoqueBord>
  );
}
