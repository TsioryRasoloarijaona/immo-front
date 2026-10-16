import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import type { CatalogueChampsDto, ChampModeleDto } from '../../types/modeles';

function echapper(texte: string): string {
  return texte.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function correspond(champ: ChampModeleDto, recherche: string): boolean {
  if (!recherche) return true;
  const r = recherche.toLowerCase();
  return champ.libelle.toLowerCase().includes(r) || champ.cle.toLowerCase().includes(r);
}

function BoutonChamp({
  champ,
  desactive,
  raison,
  onInserer,
}: Readonly<{ champ: ChampModeleDto; desactive?: boolean; raison?: string; onInserer: (c: ChampModeleDto) => void }>) {
  const exemple = champ.exemple ? ' — ex. ' + champ.exemple : '';
  return (
    <button
      type="button"
      draggable={!desactive}
      disabled={desactive}
      title={desactive ? raison : champ.cle + exemple}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onInserer(champ)}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/html', `<span data-champ="${echapper(champ.cle)}">${echapper(champ.libelle)}</span>`);
        e.dataTransfer.setData('text/plain', champ.libelle);
      }}
      className="modele-champ-bouton flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-body hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="truncate">{champ.libelle}</span>
      {champ.exemple && <span className="shrink-0 truncate text-micro text-muted-foreground">{champ.exemple}</span>}
    </button>
  );
}

/** Champs du catalogue : clic ou glisser = étiquette ; champs ↻ actifs seulement dans un élément répété. */
export default function PanneauChamps({
  catalogue,
  listeActive,
  onInserer,
}: Readonly<{
  catalogue: CatalogueChampsDto;
  listeActive: string | null;
  onInserer: (champ: ChampModeleDto) => void;
}>) {
  const [recherche, setRecherche] = useState('');
  const groupes = useMemo(
    () => catalogue.groupes.map((g) => ({ ...g, champs: g.champs.filter((c) => correspond(c, recherche)) })).filter((g) => g.champs.length > 0),
    [catalogue, recherche],
  );
  const listes = useMemo(
    () => catalogue.listes.map((l) => ({ ...l, champs: l.champs.filter((c) => correspond(c, recherche)) })).filter((l) => l.champs.length > 0),
    [catalogue, recherche],
  );

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un champ"
          aria-label="Rechercher un champ"
          className="pl-7"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {groupes.map((g) => (
          <section key={g.libelle} className="mb-2">
            <h3 className="px-2 pb-0.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">{g.libelle}</h3>
            {g.champs.map((c) => (
              <BoutonChamp key={c.cle} champ={c} onInserer={onInserer} />
            ))}
          </section>
        ))}
        {listes.map((l) => (
          <section key={l.cle} className="mb-2">
            <h3 className="px-2 pb-0.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">↻ {l.libelle}</h3>
            {l.champs.map((c) => (
              <BoutonChamp
                key={c.cle}
                champ={c}
                desactive={listeActive !== l.cle}
                raison={`Placez le curseur dans un élément répété « ${l.libelle} » (bouton Répéter).`}
                onInserer={onInserer}
              />
            ))}
          </section>
        ))}
        {groupes.length === 0 && listes.length === 0 && (
          <p className="px-2 text-body text-muted-foreground">Aucun champ ne correspond.</p>
        )}
      </div>
    </div>
  );
}
