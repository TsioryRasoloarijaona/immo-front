import { useState } from 'react';
import { Badge } from '../../../components/ui';
import FenetreFiche from '../../../components/fiche/FenetreFiche';
import RubanFiche from '../../../components/fiche/RubanFiche';
import ChampFiche, { BandeFiche } from '../../../components/fiche/ChampFiche';
import ClasseurBas from '../../../components/fiche/ClasseurBas';
import DataGrid from '../../../components/DataGrid';
import type { OngletFiche } from '../../../components/FicheShell';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { formatNumber } from '../../../lib/format';
import type { ConfigEcran, Ligne, OngletStatique } from './types';
import { useActionMaquette } from './useActionMaquette';

function texteChamp(v: Ligne[string] | undefined): string {
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  return v ?? '';
}

function ongletsDe(onglets: OngletStatique[]): OngletFiche[] {
  return onglets.map((o) => ({
    id: o.id,
    libelle: o.libelle,
    compteur: o.lignes.length,
    contenu: (
      <div className="p-2">
        <DataGrid rows={o.lignes} colonnes={o.colonnes} bandeauRegroupement={false} />
      </div>
    ),
  }));
}

/** Fiche en fenêtre : champs en lecture seule, onglets éventuels, actions du ruban sans effet. */
export default function FicheStatique({
  config,
  ligne,
  voisins,
  onFermer,
}: Readonly<{ config: ConfigEcran; ligne: Ligne; voisins: VoisinsFiche; onFermer: () => void }>) {
  const agir = useActionMaquette();
  const onglets = config.onglets ? ongletsDe(config.onglets(ligne)) : [];
  const [actif, setActif] = useState(onglets[0]?.id ?? '');
  const a = (outil: ConfigEcran['outils'][number]) => config.outils.includes(outil);
  return (
    <FenetreFiche
      nature={config.nature}
      titre={ligne.id === 'nouveau' ? `Nouveau : ${config.nature}` : config.titreFiche(ligne)}
      badge={<Badge tone="amber">Maquette</Badge>}
      voisins={voisins}
      onFermer={onFermer}
      pied="Maquette : rien n'est enregistré"
    >
      <RubanFiche
        enregistrer={{ onClick: () => agir() }}
        propres={(config.propres ?? []).map((p) => ({ id: p.id, libelle: p.libelle, icone: p.icone, onClick: () => agir(p.confirmation) }))}
        imprimer={a('imprimer') ? { onClick: () => agir() } : undefined}
        supprimer={a('supprimer') ? { onClick: () => agir('Supprimer cette fiche ?') } : undefined}
      />
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <BandeFiche>
          {config.champs.map((c) => (
            <ChampFiche key={c.nom} libelle={c.libelle} type={c.type} large={c.large} valeur={c.type === 'case' ? ligne[c.nom] === true : texteChamp(ligne[c.nom])} />
          ))}
        </BandeFiche>
        {config.extra?.(ligne)}
      </div>
      {onglets.length > 0 && (
        <div className="flex max-h-[45%] min-h-0 flex-col border-t border-border">
          <ClasseurBas onglets={onglets} actif={actif} onChange={setActif} />
        </div>
      )}
    </FenetreFiche>
  );
}
