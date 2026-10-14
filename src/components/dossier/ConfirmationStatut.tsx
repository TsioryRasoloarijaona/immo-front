import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { PopoverClose } from '../ui/popover';
import { estStatutSortie } from '../../lib/dossierStatus';
import { todayISO } from '../../lib/format';
import { errorMessage } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { EtapeSuivanteDto } from '../../types';

/** Appel du changement de statut ; rejette avec le message du serveur (400 / 403 / 409) pour l'afficher ici. */
export type ConfirmerStatut = (statut: string, note: string, date?: string, ignorerSeuil?: boolean) => Promise<void>;

const CONFIANCE_TONE: Record<string, string> = {
  CONFIRME: 'text-(--success)',
  PLAUSIBLE: 'text-(--warning)',
  AUCUN: 'text-muted-foreground',
};

const CONFIANCE_LIBELLE: Record<string, string> = {
  CONFIRME: 'Date associée paramétrée',
  PLAUSIBLE: 'Date associée plausible',
  AUCUN: 'Pas de date associée',
};

function ConfianceBadge({ confiance }: Readonly<{ confiance?: string }>) {
  if (!confiance) return null;
  const cle = confiance.toUpperCase();
  return (
    <span className={cn('text-micro font-medium', CONFIANCE_TONE[cle] ?? 'text-muted-foreground')}>
      {CONFIANCE_LIBELLE[cle] ?? confiance}
    </span>
  );
}

/** Corps du popover de confirmation : date associée, note / cause, seuil (Administrateur), refus du serveur. */
export default function ConfirmationStatut({
  label,
  step,
  administrateur,
  onConfirm,
  close,
}: Readonly<{
  label: string;
  step: EtapeSuivanteDto;
  administrateur: boolean;
  onConfirm: ConfirmerStatut;
  close: () => void;
}>) {
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [ignorerSeuil, setIgnorerSeuil] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // Sortie : le serveur exige la cause (400 sinon) et libère le lot.
  const sortie = estStatutSortie(step.statut);
  const causeManquante = sortie && note.trim() === '';

  async function confirmer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await onConfirm(step.statut, note.trim(), step.champDate ? date || undefined : undefined, ignorerSeuil || undefined);
      setNote('');
      close();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <p className="text-label font-medium text-foreground">Passer à « {label} » ?</p>
      {step.transition && step.transition !== step.statut && (
        <span className="text-micro text-muted-foreground">Transition : {step.transition}</span>
      )}
      <ConfianceBadge confiance={step.confiance} />
      {step.champDate && (
        <label className="flex flex-col gap-1 text-micro font-medium text-muted-foreground">
          {step.libelleChampDate || 'Date'}
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-label" />
        </label>
      )}
      {sortie && (
        <p role="alert" className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-2 py-1.5 text-micro font-medium text-(--warning)">
          Le lot sera libéré et remis en vente.
        </p>
      )}
      <Textarea
        aria-label={sortie ? 'Cause' : 'Motif / note'}
        placeholder={sortie ? 'Cause (obligatoire)' : 'Motif / note (optionnel)'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-17.5 text-label"
      />
      {administrateur && !sortie && (
        <label className="flex items-center gap-1.5 text-micro text-muted-foreground">
          <input
            type="checkbox"
            checked={ignorerSeuil}
            onChange={(e) => setIgnorerSeuil(e.target.checked)}
            className="size-3.5 accent-(--brand)"
          />
          Ignorer le seuil de versement
        </label>
      )}
      {erreur && (
        <p role="alert" className="max-h-48 overflow-y-auto whitespace-pre-line rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-micro text-destructive">
          {erreur}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <PopoverClose render={<Button type="button" variant="outline" size="sm" />}>Annuler</PopoverClose>
        <Button type="button" size="sm" disabled={causeManquante || envoi} onClick={() => void confirmer()}>
          Confirmer
        </Button>
      </div>
    </div>
  );
}
