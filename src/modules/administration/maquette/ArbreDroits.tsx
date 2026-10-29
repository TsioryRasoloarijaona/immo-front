import { useState } from 'react';
import { CheckSquare, Eye, Square } from 'lucide-react';

const ACTIONS = ['Nouveau', 'Supprimer', 'Imprimer', 'Exporter', 'Importer'];
const MODULES: { nom: string; ecrans: string[] }[] = [
  { nom: 'Vente', ecrans: ['Prospections', 'Dossiers de vente', 'Encaissements'] },
  { nom: 'Patrimoine', ecrans: ['Tranches', 'Articles'] },
  { nom: 'Administration', ecrans: ['Rôles', 'Utilisateurs', 'Historique'] },
];

const cleEcran = (m: string, e: string) => `${m}/${e}`;
const clesActions = (m: string, e: string) => ACTIONS.map((a) => `${m}/${e}/${a}`);
const clesModule = (m: { nom: string; ecrans: string[] }) => m.ecrans.flatMap((e) => [cleEcran(m.nom, e), ...clesActions(m.nom, e)]);
const TOUTES = MODULES.flatMap(clesModule);
const ECRANS = MODULES.flatMap((m) => m.ecrans.map((e) => cleEcran(m.nom, e)));

const BOUTON = 'grid size-7 place-items-center rounded-md text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-(--brand) outline-none';

function Case({ cle, libelle, coches, basculer }: Readonly<{ cle: string; libelle: string; coches: Set<string>; basculer: (cles: string[]) => void }>) {
  return (
    <label className="inline-flex items-center gap-1.5 text-body text-foreground">
      <input type="checkbox" className="accent-(--brand)" checked={coches.has(cle)} onChange={() => basculer([cle])} />
      {libelle}
    </label>
  );
}

/** Arbre des droits d'un rôle : module, écran, actions. Les cases ne sont pas enregistrées. */
export default function ArbreDroits() {
  const [coches, setCoches] = useState<Set<string>>(new Set(ECRANS));

  function basculer(cles: string[]) {
    setCoches((prec) => {
      const suivant = new Set(prec);
      const toutesCochees = cles.every((c) => prec.has(c));
      cles.forEach((c) => (toutesCochees ? suivant.delete(c) : suivant.add(c)));
      return suivant;
    });
  }

  return (
    <section aria-label="Droits du rôle" className="mt-3 rounded-lg border border-border">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <span className="mr-auto text-body font-semibold text-foreground">Droits</span>
        <button type="button" className={BOUTON} title="Tout sélectionner" aria-label="Tout sélectionner" onClick={() => setCoches(new Set(TOUTES))}>
          <CheckSquare aria-hidden className="size-4" />
        </button>
        <button type="button" className={BOUTON} title="Tout désélectionner" aria-label="Tout désélectionner" onClick={() => setCoches(new Set())}>
          <Square aria-hidden className="size-4" />
        </button>
        <button type="button" className={BOUTON} title="En lecture seule" aria-label="En lecture seule" onClick={() => setCoches(new Set(ECRANS))}>
          <Eye aria-hidden className="size-4" />
        </button>
      </div>
      <ul className="max-h-64 overflow-auto p-2">
        {MODULES.map((m) => (
          <li key={m.nom} className="mb-1">
            <Case cle={m.nom} libelle={m.nom} coches={new Set(clesModule(m).every((c) => coches.has(c)) ? [m.nom] : [])} basculer={() => basculer(clesModule(m))} />
            <ul className="ml-5">
              {m.ecrans.map((e) => (
                <li key={e} className="flex flex-wrap items-center gap-x-3 py-0.5">
                  <Case cle={cleEcran(m.nom, e)} libelle={e} coches={coches} basculer={basculer} />
                  {ACTIONS.map((a) => (
                    <Case key={a} cle={`${m.nom}/${e}/${a}`} libelle={a} coches={coches} basculer={basculer} />
                  ))}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
