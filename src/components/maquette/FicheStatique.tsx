import { useState } from 'react';
import { Badge } from '../ui';
import FenetreFiche from '../fiche/FenetreFiche';
import RubanFiche from '../fiche/RubanFiche';
import ChampFiche, { BandeFiche } from '../fiche/ChampFiche';
import ClasseurBas from '../fiche/ClasseurBas';
import DataGrid from '../DataGrid';
import type { OngletFiche } from '../FicheShell';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../lib/format';
import type { TypeColonne } from '../../types';
import type { ConfigEcran, Ligne, OngletStatique } from './types';
import { useActionMaquette } from './useActionMaquette';

/** Texte d'un champ : le type de sa colonne (date, montant, pourcentage) décide du format. */
function texteChamp(v: Ligne[string] | undefined, type?: TypeColonne): string {
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (v === undefined || v === '') return '';
  if (type === 'DATE') return formatDate(String(v));
  if (typeof v !== 'number') return v;
  if (type === 'MONTANT') return formatCurrency(v);
  return type === 'POURCENTAGE' ? formatPercent(v, 1) : formatNumber(v);
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
  const onglets = config.onglets && ligne.id !== 'nouveau' ? ongletsDe(config.onglets(ligne)) : [];
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
            <ChampFiche key={c.nom} libelle={c.libelle} type={c.type} large={c.large} valeur={c.type === 'case' ? ligne[c.nom] === true : texteChamp(ligne[c.nom], config.colonnes.find((k) => k.nom === c.nom)?.type)} />
          ))}
        </BandeFiche>
        {ligne.id !== 'nouveau' && config.extra?.(ligne)}
      </div>
      {onglets.length > 0 && (
        <div className="flex max-h-[45%] min-h-0 flex-col border-t border-border">
          <ClasseurBas onglets={onglets} actif={actif} onChange={setActif} />
        </div>
      )}
    </FenetreFiche>
  );
}
