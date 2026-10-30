import { CheckCheck, Square } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import {
  basculerHabilitation,
  toutCocherHabilitations,
  toutDecocherHabilitations,
  type ArbreHabilitations as Arbre,
} from '../../lib/habilitations';
import { pluriel } from '../../lib/format';

const LARGEUR_RETRAIT = 20;
const LIBELLES_TYPE: Record<string, string> = {
  SOCIETE: 'Société',
  PROJET: 'Projet',
  TRANCHE: 'Tranche',
  PROJET_TRAVAUX: 'Projet travaux',
};

type Props = Readonly<{
  arbre: Arbre;
  coches: ReadonlySet<string>;
  onChange: (coches: Set<string>) => void;
}>;

/** Habilitations d'un compte : Société > Projet > Tranche et Société > Projet travaux. Cocher descend et remonte. */
export default function ArbreHabilitations({ arbre, coches, onChange }: Props) {
  const { noeuds } = arbre.structure;
  return (
    <section className="flex min-h-0 flex-col gap-2" aria-label="Habilitations">
      <div className="flex flex-wrap items-center gap-2">
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(toutCocherHabilitations(arbre))}>
            <CheckCheck data-icon="inline-start" /> Tout cocher
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(toutDecocherHabilitations(arbre))}>
            <Square data-icon="inline-start" /> Tout décocher
          </Button>
        </BarreIcones>
        <span className="ml-auto text-body text-muted-foreground">{pluriel(coches.size, 'nœud coché', 'nœuds cochés')}</span>
      </div>
      <ul className="max-h-96 min-h-24 overflow-auto rounded-md border border-border p-2">
        {noeuds.map((n, i) => {
          const figee = arbre.figees.has(n.code);
          return (
            <li key={n.code} className="py-0.5" style={{ paddingLeft: (n.profondeur ?? 0) * LARGEUR_RETRAIT }}>
              <label className="flex min-w-0 items-center gap-2 text-body" title={figee ? 'Habilitation multiple gérée dans OMRAN' : undefined}>
                <input
                  type="checkbox"
                  checked={coches.has(n.code)}
                  disabled={figee}
                  onChange={(e) => onChange(basculerHabilitation(arbre, coches, i, e.target.checked))}
                />
                <span className="truncate">{n.description}</span>
                <span className="shrink-0 text-micro text-muted-foreground">{LIBELLES_TYPE[n.type ?? ''] ?? n.type}</span>
              </label>
            </li>
          );
        })}
        {noeuds.length === 0 && <li className="p-2 text-body text-muted-foreground">Aucune habilitation disponible</li>}
      </ul>
    </section>
  );
}
