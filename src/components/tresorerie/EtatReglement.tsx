import { AlertTriangle, Lock, XCircle } from 'lucide-react';
import { Badge } from '../ui';
import { libelleStatutTresorerie } from '../../lib/tresorerie';

/** Libellé du statut, glyphes (pointé, non payé, en retard) et pastille « Non affecté ». */
export default function EtatReglement({
  statut,
  libelle,
  enRetard,
  nonAffecte,
}: Readonly<{ statut: string | null; libelle?: string | null; enRetard?: boolean; nonAffecte?: boolean }>) {
  return (
    <span className="inline-flex items-center gap-1">
      {statut === 'POINTED' && <Lock aria-label="Pointé" className="size-3 shrink-0" />}
      {statut === 'NOTPAYED' && <XCircle aria-label="Non payé" className="size-3 shrink-0 text-(--warning)" />}
      {enRetard && <AlertTriangle aria-label="En retard" className="size-3 shrink-0 text-(--amber)" />}
      <span className={statut === 'CANCELED' ? 'text-muted-foreground line-through' : undefined}>{libelleStatutTresorerie(statut, libelle)}</span>
      {nonAffecte && <Badge tone="amber">Non affecté</Badge>}
    </span>
  );
}
