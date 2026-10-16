import { TableHead, TableRow } from './ui/table';
import { decomposerJeton, formatAgregat, LIBELLES_COURTS_FONCTION } from '../lib/groupement';
import { formatNumber } from '../lib/format';
import type { TotauxServeurGrille } from '../lib/totauxServeur';
import { cn } from '../lib/utils';
import type { FonctionAgregat, TypeColonne } from '../types';

type ColonneBande = {
  nom: string;
  type?: TypeColonne;
  formatValeur?: (valeur: unknown) => string;
};

const CHARGEMENT = '…';

function libelleBande(totaux: TotauxServeurGrille): string {
  if (totaux.chargement || totaux.nombreTotal === null) return `Totaux sur ${CHARGEMENT} ligne(s) filtrée(s)`;
  return `Totaux sur ${formatNumber(totaux.nombreTotal)} ligne(s) filtrée(s)`;
}

/** Bande « Totaux » sous l'en-tête et la ligne de filtre : une ligne de libellé pleine largeur, puis les
 * résumés empilés sous leur colonne. Rien sans résumé actif. */
export default function BandeTotauxServeur<C extends ColonneBande>({
  totaux,
  colonnes,
  gouttieres,
  nbColonnes,
  plafond,
  aDroite,
}: Readonly<{
  totaux: TotauxServeurGrille;
  colonnes: C[];
  /** Cellules avant la première colonne de données (détail, marque, case, actions). */
  gouttieres: number;
  nbColonnes: number;
  plafond: (c: C) => string;
  aDroite: (c: C) => boolean;
}>) {
  if (totaux.jetons.length === 0) return null;

  if (totaux.erreur) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableHead colSpan={nbColonnes} className="h-auto bg-(--surface-hover) py-0.5 font-normal">
          <span className="flex items-center gap-2 text-micro">
            <span className="text-destructive">Totaux indisponibles</span>
            <button type="button" className="text-(--brand) hover:underline" onClick={totaux.reessayer}>
              Réessayer
            </button>
          </span>
        </TableHead>
      </TableRow>
    );
  }

  const parColonne = new Map<string, { jeton: string; fonction: FonctionAgregat }[]>();
  for (const jeton of totaux.jetons) {
    const { nom, fonction } = decomposerJeton(jeton);
    parColonne.set(nom, [...(parColonne.get(nom) ?? []), { jeton, fonction }]);
  }

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableHead colSpan={nbColonnes} className="h-auto bg-(--surface-hover) py-0.5 text-micro font-semibold">
          {libelleBande(totaux)}
        </TableHead>
      </TableRow>
      <TableRow className="border-b border-border hover:bg-transparent">
        {Array.from({ length: gouttieres }, (_, i) => (
          <TableHead key={i} className="h-auto bg-(--surface-hover) p-0" />
        ))}
        {colonnes.map((c) => (
          <TableHead
            key={c.nom}
            className={cn(
              'h-auto truncate bg-(--surface-hover) py-0.5 align-top text-micro font-normal',
              aDroite(c) && 'text-right',
            )}
            style={{ maxWidth: plafond(c) }}
          >
            {(parColonne.get(c.nom) ?? []).map(({ jeton, fonction }) => (
              <span key={jeton} className="block truncate">
                <span className="text-muted-foreground">{LIBELLES_COURTS_FONCTION[fonction]} </span>
                <span className="font-semibold tabular-nums">
                  {totaux.chargement
                    ? CHARGEMENT
                    : formatAgregat(totaux.totaux[jeton], c.formatValeur, fonction, c.type ?? 'TEXTE')}
                </span>
              </span>
            ))}
          </TableHead>
        ))}
      </TableRow>
    </>
  );
}
