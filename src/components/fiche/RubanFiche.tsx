import type { ReactNode } from 'react';
import { Paperclip, Printer, Save, Trash2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CLASSE_FAMILLE, type FamilleOutil } from '../../lib/outilsListe';

export interface ActionRuban {
  id: string;
  libelle: string;
  icone: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionSimple {
  onClick: () => void;
  disabled?: boolean;
}

const BOUTON =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-body font-medium whitespace-nowrap text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-(--brand) disabled:opacity-45 disabled:hover:bg-transparent';
const SEPARATEUR = <span aria-hidden className="mx-1 h-[18px] w-px shrink-0 bg-border" />;

function BoutonRuban({
  libelle,
  icone: Icone,
  famille,
  action,
}: Readonly<{ libelle: string; icone: LucideIcon; famille?: FamilleOutil; action: ActionSimple }>) {
  return (
    <button type="button" className={BOUTON} disabled={action.disabled} onClick={action.onClick}>
      <Icone aria-hidden className={cn('size-4', famille && CLASSE_FAMILLE[famille])} />
      {libelle}
    </button>
  );
}

/**
 * Ruban d'une fiche, sur une ligne : Enregistrer (plein) | actions propres | à droite Imprimer, Pièces jointes, Supprimer.
 * Seules les actions que la fiche a réellement sont passées. `enSuite` accueille les actions déjà rendues par leur
 * composant (boutons + boîtes de dialogue).
 */
export default function RubanFiche({
  enregistrer,
  propres,
  enSuite,
  imprimer,
  piecesJointes,
  supprimer,
}: Readonly<{
  enregistrer?: ActionSimple & { aide?: string };
  propres: ActionRuban[];
  enSuite?: ReactNode;
  imprimer?: ActionSimple;
  piecesJointes?: ActionSimple;
  supprimer?: ActionSimple;
}>) {
  const aDroite = [imprimer, piecesJointes, supprimer].some((a) => a !== undefined);
  return (
    <div role="toolbar" aria-label="Actions de la fiche" className="flex shrink-0 flex-wrap items-center gap-0.5 gap-y-1 border-b border-border px-3 py-1.5">
      {enregistrer && (
        <>
          <button
            type="button"
            className="mr-1 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-body font-semibold text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--brand) disabled:opacity-45 disabled:hover:opacity-45"
            title={enregistrer.aide}
            disabled={enregistrer.disabled}
            onClick={enregistrer.onClick}
          >
            <Save aria-hidden className="size-4" />
            Enregistrer
          </button>
          {SEPARATEUR}
        </>
      )}
      {propres.map((p) => (
        <BoutonRuban key={p.id} libelle={p.libelle} icone={p.icone} action={p} />
      ))}
      {enSuite && (
        <div className="flex shrink-0 items-center gap-0.5 [&_button]:border-transparent [&_button]:bg-transparent [&_button]:shadow-none [&_button:hover]:bg-muted">
          {enSuite}
        </div>
      )}
      {aDroite && <span className="flex-1" />}
      {imprimer && <BoutonRuban libelle="Imprimer" icone={Printer} famille="print" action={imprimer} />}
      {piecesJointes && <BoutonRuban libelle="Pièces jointes" icone={Paperclip} famille="import" action={piecesJointes} />}
      {supprimer && <BoutonRuban libelle="Supprimer" icone={Trash2} famille="suppr" action={supprimer} />}
    </div>
  );
}
