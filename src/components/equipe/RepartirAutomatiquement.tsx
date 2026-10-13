import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { repartirPreProspections } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { phraseRepartition } from '../../lib/equipe';
import { formatNumber, pluriel } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import type { FiltreADistribuer, UUID } from '../../types';

/** Les lignes cochées, ou à défaut tout ce que le filtre de la carte compte (`nombre` = le compteur). */
export type CibleRepartition =
  | { ids: readonly UUID[]; filtre?: undefined; nombre: number }
  | { ids?: undefined; filtre: FiltreADistribuer; nombre: number };

/**
 * « Répartir automatiquement » : aperçu (simulation) obligatoire, puis confirmation
 * (FEATURE-a-distribuer-jamais-traitees.md §4). Le serveur choisit le commercial ligne par ligne.
 */
export default function RepartirAutomatiquement({
  cible,
  rechargement = false,
  onFait,
  onErreur,
}: Readonly<{
  cible: CibleRepartition;
  /** Compteur en cours de rechargement : `nombre` peut encore être celui de l'ancien filtre. */
  rechargement?: boolean;
  onFait: () => void;
  onErreur: (message: string | null) => void;
}>) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const lot = cible.ids ? { preProspectionIds: [...cible.ids] } : { filtre: cible.filtre };

  async function repartir() {
    if (cible.nombre === 0) return;
    setBusy(true);
    onErreur(null);
    try {
      const apercu = await repartirPreProspections({ ...lot, simulation: true });
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
      const resultat = await repartirPreProspections({ ...lot, simulation: false });
      toast({ texte: `Répartition faite : ${phraseRepartition(resultat)}.`, variante: 'succes' });
      onFait();
    } catch (err) {
      onErreur(err instanceof Error ? err.message : 'Échec de la répartition.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void repartir()} disabled={busy || rechargement || cible.nombre === 0}>
      <Shuffle data-icon="inline-start" />{' '}
      {busy ? 'Répartition…' : `Répartir automatiquement (${formatNumber(cible.nombre)})`}
    </Button>
  );
}
