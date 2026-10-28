import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Plus, Settings2, Wrench, type LucideIcon } from 'lucide-react';
import MenuPersonnaliserOutils, { type LigneMenuOutil } from './MenuPersonnaliserOutils';
import { cn } from '../../lib/utils';
import {
  CLASSE_FAMILLE,
  CLE_DOCK_PLIE,
  ecrireOutils,
  lireOutils,
  OUTILS,
  OUTILS_DEFAUT,
  useBooleenMemorise,
  type DefinitionOutil,
  type IdOutil,
} from '../../lib/outilsListe';

/** Outil commun fourni par la page : sans entrée ici, il n'existe pas pour cet écran (sauf « Imprimer », grisé). */
export interface ActionOutil {
  id: IdOutil;
  onClick: () => void;
  disabled?: boolean;
}

export interface OutilPropre {
  id: string;
  libelle: string;
  icone?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

const BOUTON =
  'relative grid size-8 place-items-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-(--brand) disabled:text-muted-foreground disabled:opacity-45 disabled:hover:bg-transparent';
const INFOBULLE =
  'after:hidden hover:after:block focus-visible:after:block hover:after:content-[attr(data-tip)] focus-visible:after:content-[attr(data-tip)] after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-30 after:-translate-x-1/2 after:rounded-sm after:bg-foreground after:px-2 after:py-0.5 after:text-micro after:font-medium after:whitespace-nowrap after:text-background';

const IMPRESSION_ABSENTE = "Impression indisponible sur cet écran";

function infobulle(o: DefinitionOutil): string {
  return o.raccourci ? `${o.libelle} · ${o.raccourci}` : o.libelle;
}

function BoutonOutil({
  def,
  action,
  ligneSelectionnee,
}: Readonly<{ def: DefinitionOutil; action?: ActionOutil; ligneSelectionnee: boolean }>) {
  const Icone = def.icone;
  const inactif = !action || action.disabled || (def.sel && !ligneSelectionnee);
  return (
    <button
      type="button"
      className={cn(BOUTON, INFOBULLE, def.famille && CLASSE_FAMILLE[def.famille])}
      aria-label={def.libelle}
      data-tip={action ? infobulle(def) : `${def.libelle} · ${IMPRESSION_ABSENTE}`}
      disabled={inactif}
      onClick={action?.onClick}
    >
      <Icone aria-hidden className="size-4" />
    </button>
  );
}

function BoutonPropre({ outil }: Readonly<{ outil: OutilPropre }>) {
  const Icone = outil.icone;
  return (
    <button
      type="button"
      className={cn(BOUTON, INFOBULLE, 'flex h-8 w-auto gap-1.5 px-2 text-body font-medium whitespace-nowrap')}
      aria-label={outil.libelle}
      data-tip={outil.libelle}
      disabled={outil.disabled}
      onClick={outil.onClick}
    >
      {Icone && <Icone aria-hidden className="size-4" />}
      {outil.libelle}
    </button>
  );
}

const SEPARATEUR = <span aria-hidden className="mx-1 h-5 w-px bg-border" />;

/**
 * Barre d'outils flottante d'une liste, ancrée en bas au centre de `PageListe`.
 * Défaut : « Nouveau », supprimer, rafraîchir, exporter, imprimer (si la page les fournit), puis les actions propres.
 */
export default function BarreOutilsFlottante({
  cle,
  nouveau,
  actions,
  propres = [],
  ligneSelectionnee,
}: Readonly<{
  /** Identifiant de l'écran : la personnalisation est mémorisée sous cette clé. */
  cle: string;
  nouveau?: { libelle: string; onClick: () => void };
  actions: ActionOutil[];
  propres?: OutilPropre[];
  ligneSelectionnee: boolean;
}>) {
  const [plie, basculerPlie] = useBooleenMemorise(CLE_DOCK_PLIE);
  const [choix, setChoix] = useState(() => lireOutils(cle));
  const [menuOuvert, setMenuOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);

  // Menu fermé par un clic ailleurs ou Échap.
  useEffect(() => {
    if (!menuOuvert) return;
    const fermerSiHors = (e: PointerEvent) => {
      if (!racine.current?.contains(e.target as Node)) setMenuOuvert(false);
    };
    const fermerSurEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOuvert(false);
    };
    document.addEventListener('pointerdown', fermerSiHors);
    document.addEventListener('keydown', fermerSurEchap);
    return () => {
      document.removeEventListener('pointerdown', fermerSiHors);
      document.removeEventListener('keydown', fermerSurEchap);
    };
  }, [menuOuvert]);

  const parId = new Map(actions.map((a) => [a.id, a]));
  // « Imprimer » reste au catalogue même sans fonction d'impression : il s'affiche alors grisé.
  const communs = OUTILS.filter((o) => (o.id === 'nouveau' ? !!nouveau : parId.has(o.id) || o.id === 'imprimer'));
  const defaut: string[] = [
    ...(nouveau ? ['nouveau'] : []),
    ...OUTILS_DEFAUT.filter((id) => parId.has(id)),
    ...propres.map((p) => `ecran:${p.id}`),
  ];
  const choisis = choix ?? defaut;

  const groupes = [...new Set(communs.map((o) => o.groupe))]
    .map((g) => communs.filter((o) => o.groupe === g && o.id !== 'nouveau' && choisis.includes(o.id)))
    .filter((g) => g.length > 0);
  const propresVisibles = propres.filter((p) => choisis.includes(`ecran:${p.id}`));
  const nouveauVisible = choisis.includes('nouveau') ? nouveau : undefined;
  const nombre = groupes.flat().length + propresVisibles.length + (nouveauVisible ? 1 : 0);

  function memoriser(ids: string[] | null) {
    ecrireOutils(cle, ids);
    setChoix(ids);
  }

  function basculerOutil(id: string) {
    memoriser(choisis.includes(id) ? choisis.filter((x) => x !== id) : [...choisis, id]);
  }

  const lignesCommunes: LigneMenuOutil[] = communs.map((o) => ({ id: o.id, libelle: o.libelle, icone: o.icone, raccourci: o.raccourci }));
  const lignesPropres: LigneMenuOutil[] = propres.map((p) => ({ id: `ecran:${p.id}`, libelle: p.libelle, icone: p.icone }));

  const classeBarre =
    'absolute bottom-9.5 left-1/2 z-20 flex h-10 -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-card shadow-lg';

  if (plie) {
    return (
      <div ref={racine} role="toolbar" aria-label="Barre d'outils de la liste" className={classeBarre}>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-xl px-3 text-body font-medium text-foreground hover:bg-muted"
          aria-label="Déplier la barre d'outils"
          onClick={basculerPlie}
        >
          <Wrench aria-hidden className="size-4" />
          Outils <span className="text-micro text-muted-foreground">{nombre}</span>
          <ChevronUp aria-hidden className="size-3.5" />
        </button>
      </div>
    );
  }

  const blocs: { cle: string; boutons: ReactNode[] }[] = groupes.map((g) => ({
    cle: g[0].id,
    boutons: g.map((o) => <BoutonOutil key={o.id} def={o} action={parId.get(o.id)} ligneSelectionnee={ligneSelectionnee} />),
  }));
  // Les actions propres suivent le premier groupe, comme dans OMRAN.
  if (propresVisibles.length > 0) {
    blocs.splice(blocs.length > 0 ? 1 : 0, 0, {
      cle: 'propres',
      boutons: propresVisibles.map((p) => <BoutonPropre key={p.id} outil={p} />),
    });
  }

  return (
    <div ref={racine} role="toolbar" aria-label="Barre d'outils de la liste" className={cn(classeBarre, 'px-1')}>
      {nouveauVisible && (
        <>
          <button
            type="button"
            className={cn(INFOBULLE, 'relative mx-0.5 flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-body font-semibold text-primary-foreground hover:opacity-90')}
            data-tip="Nouveau · Inser"
            onClick={nouveauVisible.onClick}
          >
            <Plus aria-hidden className="size-4" />
            {nouveauVisible.libelle}
          </button>
          {blocs.length > 0 && SEPARATEUR}
        </>
      )}
      {blocs.map((bloc, i) => (
        <span key={bloc.cle} className="flex items-center gap-0.5">
          {i > 0 && SEPARATEUR}
          {bloc.boutons}
        </span>
      ))}
      {nombre > 0 && SEPARATEUR}
      <button
        type="button"
        className={cn(BOUTON, INFOBULLE)}
        aria-label="Personnaliser la barre"
        aria-expanded={menuOuvert}
        data-tip="Ajouter ou retirer des outils"
        onClick={() => setMenuOuvert((o) => !o)}
      >
        <Settings2 aria-hidden className="size-4" />
      </button>
      <button type="button" className={cn(BOUTON, INFOBULLE)} aria-label="Replier la barre" data-tip="Replier" onClick={basculerPlie}>
        <ChevronDown aria-hidden className="size-4" />
      </button>
      {menuOuvert && (
        <MenuPersonnaliserOutils
          communs={lignesCommunes}
          propres={lignesPropres}
          choisis={choisis}
          onBasculer={basculerOutil}
          onRetablir={() => memoriser(null)}
        />
      )}
    </div>
  );
}
