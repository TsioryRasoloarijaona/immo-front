import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../ui';
import { Button } from '../../ui/button';
import { TableCell, TableRow } from '../../ui/table';
import { ECHEANCE_STATUT_LABELS, echeanceCategorieTone, echeanceStatut, echeanceStatutTone } from '../../../lib/domain';
import { formatCurrency, formatDate } from '../../../lib/format';
import type { EcheanceDto } from '../../../types';
import AjoutReglement from './AjoutReglement';
import HistoriqueReglementsEcheance from './LigneReglement';

export default function LigneEcheance({
  dossierId,
  echeance,
  versionReglements,
  onReglementAdded,
  onReglementChanged,
  onModifier,
  onSupprimer,
}: Readonly<{
  dossierId: string;
  echeance: EcheanceDto;
  /** Change à chaque règlement saisi ailleurs dans l'onglet : l'historique déplié se relit. */
  versionReglements: number;
  onReglementAdded: () => Promise<void>;
  onReglementChanged: () => Promise<void>;
  onModifier: (echeance: EcheanceDto) => void;
  /** Absent hors Administrateur (403) ; le serveur refuse (409) une ligne réglée, autorisée ou en recouvrement. */
  onSupprimer?: (echeance: EcheanceDto) => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const [reglementsVersion, setReglementsVersion] = useState(0);
  const statut = echeanceStatut(echeance);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} l'échéance ${echeance.categorie || echeance.description || ''}`}
        className="cursor-pointer"
        onClick={() => setExpanded((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((o) => !o); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <Badge tone={echeanceCategorieTone(echeance.categorie)}>{echeance.categorie || echeance.description || 'Échéance'}</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(echeance.dateEcheance)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums text-foreground">{formatCurrency(echeance.montant)}</TableCell>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <Badge tone={echeanceStatutTone(statut)}>{ECHEANCE_STATUT_LABELS[statut]}</Badge>
            {statut !== 'aregler' && (
              <span className="text-micro text-muted-foreground">
                Réglé {formatCurrency(echeance.montantRegle)}{echeance.reste ? ` · Reste ${formatCurrency(echeance.reste)}` : ''}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <AjoutReglement
              dossierId={dossierId}
              echeanceInitiale={echeance.id}
              onCree={async () => {
                await onReglementAdded();
                setReglementsVersion((v) => v + 1);
                setExpanded(true);
              }}
            />
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Modifier l'échéance" onClick={() => onModifier(echeance)}>
              <Pencil />
            </Button>
            {onSupprimer && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer l'échéance" onClick={() => onSupprimer(echeance)}>
                <Trash2 />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/30 py-3">
            <HistoriqueReglementsEcheance
              dossierId={dossierId}
              echeanceId={echeance.id}
              refreshKey={reglementsVersion + versionReglements}
              onChanged={async () => {
                setReglementsVersion((v) => v + 1);
                await onReglementChanged();
              }}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
