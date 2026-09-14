import { Fragment, useState } from 'react';
import { Group, Sigma, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import RechercheMenu from './RechercheMenu';
import { filtrerColonnes, libelleGroupe } from '../lib/colonnes';
import { GRANULARITES, TRIS } from '../lib/groupement';
import type { EtatGroupement } from '../lib/groupement';
import type { GranulariteGroupe, TriGroupes } from '../types';

/** La bande de groupement de la grille légataire, rendue réelle.
 *
 * Omran fait poser un en-tête de colonne dans cette bande pour regrouper. Le
 * glisser-déposer n'existe pas ici, et un menu explicite est de toute façon
 * l'équivalent accessible : il s'atteint au clavier, ce qu'une cible de dépôt
 * ne fait pas. La bande énonce donc ce qu'elle sait faire au lieu de mimer un
 * geste qu'elle ne recevrait pas.
 *
 * Elle ne s'affiche que sur les trois listes qui ont un endpoint `/groupes`.
 * Les autres gardent la bande inerte de `DataGrid`, qui dit « Bientôt » — ce
 * qui reste exact : le serveur n'y sait pas grouper. */

const CLASSE_DECLENCHEUR =
  'flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50';

export default function BandeGroupement({
  etat,
  bloque,
}: {
  etat: EtatGroupement;
  /** Raison pour laquelle le groupement est indisponible, le cas échéant.
   *
   * Affichée telle quelle à la place des commandes. Une bande simplement
   * grisée dirait « indisponible » sans dire pourquoi, et le seul cas réel —
   * le filtre statut des dossiers — a une cause que l'utilisateur peut lever
   * lui-même en retirant ce filtre. Autant le lui dire. */
  bloque?: string;
}) {
  const { groupables, agregeables, colonneGroupee, actif, estDate, granularite, tri, agregats } = etat;
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [requete, setRequete] = useState('');

  // Catalogue pas encore arrivé, ou serveur sans colonne groupable : il n'y a
  // rien à proposer, et une bande vide vaut mieux qu'un menu vide.
  if (groupables.length === 0) return null;

  if (bloque) {
    return (
      <div className="flex min-h-6 shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-2 py-0.5 text-micro text-muted-foreground">
        <Group aria-hidden className="size-3 shrink-0 opacity-70" />
        <span className="truncate opacity-70">{bloque}</span>
      </div>
    );
  }

  /* Même recherche que le sélecteur de colonnes, et pour la même raison, en
     plus marquée : ce menu liste **35 colonnes sur les encaissements**, 21 sur
     les prospections, 22 sur les dossiers. Parcourir cinq sections à l'œil y
     coûte plus cher que taper trois lettres.

     `filtrerColonnes` est multi-mots et cherche dans le libellé, le **nom
     technique** — qui a lu la spec cherchera `dateDocument` avant « Date
     pièce » — et le libellé de section, ce qui fait de « suivi » un moyen
     d'afficher le bloc entier. */
  const filtre = filtrerColonnes(groupables, requete);
  // Ordre de première apparition, pour que les sections du menu suivent
  // l'ordre du catalogue — même règle que le sélecteur de colonnes.
  const sections = [...new Set(filtre.map((c) => c.groupe))];

  return (
    <div className="flex min-h-6 shrink-0 flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-0.5 text-micro text-muted-foreground">
      <Group aria-hidden className="size-3 shrink-0 opacity-70" />

      <DropdownMenu
        open={menuOuvert}
        onOpenChange={(o) => {
          setMenuOuvert(o);
          // Une recherche laissée en place rouvrirait le menu amputé de la
          // plupart de ses colonnes, sans que rien n'explique pourquoi.
          if (!o) setRequete('');
        }}
      >
        <DropdownMenuTrigger className={CLASSE_DECLENCHEUR}>
          {actif ? (
            <>
              <span className="opacity-70">Regroupé par</span>
              <span className="font-semibold text-(--brand)">{colonneGroupee?.libelle}</span>
            </>
          ) : (
            <span className="opacity-70">Regrouper par une colonne…</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-96 w-64" align="start">
          <RechercheMenu
            ouvert={menuOuvert}
            valeur={requete}
            onChange={setRequete}
            placeholder="Rechercher une colonne…"
            libelle="Rechercher une colonne à regrouper"
          />
          {filtre.length === 0 ? (
            <p className="px-2 py-3 text-body text-muted-foreground">Aucune colonne ne correspond.</p>
          ) : (
            sections.map((section, i) => (
              <Fragment key={section}>
                {i > 0 && <DropdownMenuSeparator />}
                {/* `DropdownMenuLabel` lit un contexte que seul `DropdownMenuGroup`
                    fournit — hors de lui, Base UI jette et l'écran entier tombe. */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-micro text-muted-foreground">
                    {libelleGroupe(section)}
                  </DropdownMenuLabel>
                  {filtre
                    .filter((c) => c.groupe === section)
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.nom}
                        checked={etat.colonne === c.nom}
                        // Un seul niveau de groupement est supporté côté serveur :
                        // choisir une colonne remplace la précédente, et re-cocher
                        // celle qui est active dégroupe.
                        onCheckedChange={() => etat.choisirColonne(etat.colonne === c.nom ? null : c.nom)}
                      >
                        {c.libelle}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
              </Fragment>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {actif && (
        <>
          {/* La granularité n'apparaît que sur une colonne DATE — ailleurs le
              serveur l'ignore, et l'offrir laisserait croire qu'elle agit.
              Grouper sur la date exacte rendrait 214 groupes pour 358 dossiers,
              d'où le défaut mensuel. */}
          {estDate && (
            <DropdownMenu>
              <DropdownMenuTrigger className={CLASSE_DECLENCHEUR}>
                <span className="text-foreground">
                  {GRANULARITES.find((g) => g.valeur === granularite)?.libelle}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={granularite}
                  onValueChange={(v) => etat.changerGranularite(v as GranulariteGroupe)}
                >
                  {GRANULARITES.map((g) => (
                    <DropdownMenuRadioItem key={g.valeur} value={g.valeur}>
                      {g.libelle}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className={CLASSE_DECLENCHEUR}>
              <span className="text-foreground">{TRIS.find((t) => t.valeur === tri)?.libelle}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={tri} onValueChange={(v) => etat.changerTri(v as TriGroupes)}>
                {TRIS.map((t) => (
                  <DropdownMenuRadioItem key={t.valeur} value={t.valeur}>
                    {t.libelle}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Les bandes « Total : » sous chaque en-tête de groupe. Le serveur
              les calcule sur tout le périmètre filtré ; le Σ des en-têtes de
              colonne, lui, ne somme que la page chargée. Deux totaux
              différents, deux questions différentes. */}
          {agregeables.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className={CLASSE_DECLENCHEUR}>
                <Sigma aria-hidden className="size-2.75 shrink-0" />
                <span className={agregats.length > 0 ? 'font-semibold text-(--brand)' : 'opacity-70'}>
                  {agregats.length > 0 ? `${agregats.length} total(aux)` : 'Totaux'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-micro text-muted-foreground">
                    Sommes par groupe
                  </DropdownMenuLabel>
                  {agregeables.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.nom}
                      checked={agregats.includes(c.nom)}
                      onCheckedChange={() => etat.basculerAgregat(c.nom)}
                    >
                      {c.libelle}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            type="button"
            className="flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 hover:bg-muted hover:text-foreground"
            onClick={etat.reinitialiser}
            title="Revenir à la liste complète"
          >
            <X aria-hidden className="size-3" />
            Dégrouper
          </button>
        </>
      )}
    </div>
  );
}
