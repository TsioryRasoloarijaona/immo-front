import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { repartirPreProspections } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { phraseRepartition } from '../../lib/equipe';
import { pluriel } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import type { UUID } from '../../types';

/**
 * « Répartir automatiquement » : aperçu (simulation) des lignes cochées, ou de toutes si rien n'est coché, puis
 * confirmation (FEATURE-repartition-notifications.md §4). Le serveur choisit le commercial ligne par ligne.
 */
export default function RepartirAutomatiquement({
  ids,
  onFait,
  onErreur,
}: Readonly<{ ids: readonly UUID[]; onFait: () => void; onErreur: (message: string | null) => void }>) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function repartir() {
    if (ids.length === 0) return;
    setBusy(true);
    onErreur(null);
    try {
      const apercu = await repartirPreProspections({ preProspectionIds: [...ids], simulation: true });
      if (apercu.attributions.length === 0) {
        toast({ texte: `Rien à répartir : ${phraseRepartition(apercu)}` });
        return;
      }
      const ok = await confirm({
        title: 'Répartir automatiquement',
        message: `${pluriel(apercu.attributions.length, 'lead attribué', 'leads attribués')} au moins chargé de chaque projet : ${phraseRepartition(apercu)}.`,
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler',
      });
      if (!ok) return;
      const resultat = await repartirPreProspections({ preProspectionIds: [...ids], simulation: false });
      toast({ texte: `Répartition faite : ${phraseRepartition(resultat)}.`, variante: 'succes' });
      onFait();
    } catch (err) {
      onErreur(err instanceof Error ? err.message : 'Échec de la répartition.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void repartir()} disabled={busy || ids.length === 0}>
      <Shuffle data-icon="inline-start" /> {busy ? 'Répartition…' : 'Répartir automatiquement'}
    </Button>
  );
}
