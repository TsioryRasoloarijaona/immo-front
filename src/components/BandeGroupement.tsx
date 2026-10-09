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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import RechercheMenu from './RechercheMenu';
import { filtrerColonnes, libelleGroupe } from '../lib/colonnes';
import { GRANULARITES, LIBELLES_FONCTION, TRIS, jetonAgregat, libelleTri } from '../lib/groupement';
import type { EtatGroupement } from '../lib/groupement';
import type { GranulariteGroupe, TriGroupes } from '../types';

const CLASSE_DECLENCHEUR =
  'flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50';

export default function BandeGroupement({
  etat,
  bloque,
}: Readonly<{
  etat: EtatGroupement;
  bloque?: string;
}>) {
  const { groupables, agregeables, colonneGroupee, actif, estDate, granularite, tri, agregats } = etat;
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [sigmaOuvert, setSigmaOuvert] = useState(false);
  const [requeteSigma, setRequeteSigma] = useState('');

  if (groupables.length === 0) return null;

  if (bloque) {
    return (
      <div className="flex min-h-6 shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-2 py-0.5 text-micro text-muted-foreground">
        <Group aria-hidden className="size-3 shrink-0 opacity-70" />
        <span className="truncate opacity-70">{bloque}</span>
      </div>
    );
  }

  const filtre = filtrerColonnes(groupables, requete);
  const nomsSigma = new Set(filtrerColonnes(agregeables.map((x) => x.colonne), requeteSigma).map((c) => c.nom));
  const sigma = agregeables.filter((x) => nomsSigma.has(x.colonne.nom));
  const sections = [...new Set(filtre.map((c) => c.groupe))];

  return (
    <div className="flex min-h-6 shrink-0 flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-0.5 text-micro text-muted-foreground">
      <Group aria-hidden className="size-3 shrink-0 opacity-70" />

      <DropdownMenu
        open={menuOuvert}
        onOpenChange={(o) => {
          setMenuOuvert(o);
          // Recherche vidée à la fermeture : sinon le menu rouvrirait amputé, sans explication.
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
                        // Le serveur ne groupe que sur un niveau : re-cocher la colonne active dégroupe.
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
          {/* Granularité sur colonne DATE seulement : ailleurs le serveur l'ignore. */}
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
              <span className="text-foreground">{libelleTri(tri, estDate)}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={tri} onValueChange={(v) => etat.changerTri(v as TriGroupes)}>
                {TRIS.map((t) => (
                  <DropdownMenuRadioItem key={t.valeur} value={t.valeur}>
                    {libelleTri(t.valeur, estDate)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Totaux de groupe calculés par le serveur sur tout le périmètre filtré,
              alors que le Σ des en-têtes ne somme que la page chargée : ne pas les unifier. */}
          {agregeables.length > 0 && (
            <DropdownMenu
              open={sigmaOuvert}
              onOpenChange={(o) => {
                setSigmaOuvert(o);
                if (!o) setRequeteSigma('');
              }}
            >
              <DropdownMenuTrigger className={CLASSE_DECLENCHEUR}>
                <Sigma aria-hidden className="size-2.75 shrink-0" />
                <span className={agregats.length > 0 ? 'font-semibold text-(--brand)' : 'opacity-70'}>
                  {agregats.length > 0 ? `${agregats.length} total(aux)` : 'Totaux'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-96 w-64" align="start">
                <RechercheMenu
                  ouvert={sigmaOuvert}
                  valeur={requeteSigma}
                  onChange={setRequeteSigma}
                  placeholder="Rechercher une colonne…"
                  libelle="Rechercher une colonne à totaliser"
                />
                {sigma.length === 0 ? (
                  <p className="px-2 py-3 text-body text-muted-foreground">Aucune colonne ne correspond.</p>
                ) : (
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-micro text-muted-foreground">
                      Totaux par groupe
                    </DropdownMenuLabel>
                    {/* Les fonctions viennent du catalogue, pas du type : une colonne calculée
                        par différence refuse MIN/MAX. Ordre du serveur, ne pas retrier. */}
                    {sigma.map(({ colonne, fonctions }) => {
                      const actives = fonctions.filter((f) => agregats.includes(jetonAgregat(colonne.nom, f)));
                      return (
                        <DropdownMenuSub key={colonne.nom}>
                          <DropdownMenuSubTrigger>
                            <span className="flex min-w-0 flex-1 items-center gap-1.5">
                              <span className="truncate">{colonne.libelle}</span>
                              {actives.length > 0 && (
                                <span className="ml-auto shrink-0 text-micro font-semibold text-(--brand)">
                                  {actives.map((f) => LIBELLES_FONCTION[f]).join(', ')}
                                </span>
                              )}
                            </span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {fonctions.map((f) => (
                              <DropdownMenuCheckboxItem
                                key={f}
                                checked={agregats.includes(jetonAgregat(colonne.nom, f))}
                                onCheckedChange={() => etat.basculerAgregat(colonne.nom, f)}
                              >
                                {LIBELLES_FONCTION[f]}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    })}
                  </DropdownMenuGroup>
                )}
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
