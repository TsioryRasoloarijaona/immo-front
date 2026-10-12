import { AlertTriangle, Clock, EllipsisVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { formatDate, todayISO } from '../../lib/format';
import { initiales } from '../../lib/kanban';
import { prospectionDisplayName } from '../../lib/domain';
import { cn } from '../../lib/utils';
import type { ProspectionListItemDto } from '../../types';

/** Carte glissable (HTML5 natif) ; « Déplacer vers… » est l'alternative clavier et lecteur d'écran. */
export default function CarteKanban({
  carte,
  cibles,
  avecCommercial,
  deplacable,
  enAttente,
  onOuvrir,
  onDeplacer,
  onGlisser,
}: Readonly<{
  carte: ProspectionListItemDto;
  cibles: readonly { id: string; libelle: string }[];
  /** Chef et administration : initiales du commercial. */
  avecCommercial: boolean;
  /** Faux pour la carte d'un autre commercial vue par un commercial simple : visible, pas déplaçable. */
  deplacable: boolean;
  /** Déposée, en attente de sa prochaine action. */
  enAttente: boolean;
  onOuvrir: () => void;
  onDeplacer: (etapeId: string) => void;
  onGlisser: () => void;
}>) {
  const nom = prospectionDisplayName(carte);
  const echeance = carte.derniereAlerteDate?.slice(0, 10) ?? null;
  const enRetard = !!echeance && echeance < todayISO();
  const IconeEcheance = enRetard ? AlertTriangle : Clock;
  let libelleEcheance = 'Aucune prochaine action';
  if (echeance) libelleEcheance = enRetard ? `En retard · ${formatDate(echeance)}` : formatDate(echeance);
  return (
    <li
      draggable={deplacable}
      onDragStart={(e) => {
        if (!deplacable) return;
        e.dataTransfer.setData('text/plain', carte.id);
        e.dataTransfer.effectAllowed = 'move';
        onGlisser();
      }}
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-border bg-card p-2.5 shadow-xs',
        deplacable && 'cursor-grab active:cursor-grabbing',
        enAttente && 'opacity-60 ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <button type="button" className="min-w-0 text-left text-label font-semibold text-foreground hover:text-primary" onClick={onOuvrir}>
          <span className="line-clamp-2">{nom}</span>
        </button>
        {deplacable && <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Déplacer ${nom} vers…`}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <EllipsisVertical className="size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Déplacer vers…</DropdownMenuLabel>
            {cibles.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => onDeplacer(c.id)}>
                {c.libelle}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>}
      </div>
      {carte.trancheCode && <span className="truncate text-micro text-muted-foreground">{carte.trancheCode}</span>}
      <span className={cn('flex items-center gap-1 text-micro', enRetard ? 'font-semibold text-(--warning)' : 'text-muted-foreground')}>
        <IconeEcheance aria-hidden className="size-3 shrink-0" />
        {libelleEcheance}
        {carte.derniereAlerteMessage && <span className="truncate"> · {carte.derniereAlerteMessage}</span>}
      </span>
      <span className="flex items-center justify-between gap-1">
        {carte.origine ? <span className="truncate rounded-full bg-muted px-1.5 text-micro text-muted-foreground">{carte.origine}</span> : <span />}
        {avecCommercial && carte.commercialNom && (
          <span title={carte.commercialNom} className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--brand-bg) text-micro font-semibold text-(--brand)">
            {initiales(carte.commercialNom)}
          </span>
        )}
      </span>
    </li>
  );
}
