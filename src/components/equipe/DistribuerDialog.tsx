import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import Modal from '../Modal';
import RefSelect from '../RefSelect';
import LignesSelectionnables from './LignesSelectionnables';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { distribuerPreProspections, listPreProspections } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { basculer, bornesPeriodeEquipe, choixCommerciaux, phraseDistribution } from '../../lib/equipe';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto } from '../../types';

const TAILLE = 100;

/** Les plus anciennes d'abord ; tout le lot ou rien (le serveur n'écrit rien si une ligne est refusée). */
export default function DistribuerDialog({
  periode,
  commerciaux,
  onClose,
  onFait,
}: Readonly<{
  /** Période de l'écran : mêmes lignes que le bloc « À distribuer » (FEATURE-equipe-commerciale.md §10). */
  periode: { du: string; au: string };
  commerciaux: readonly CommercialEquipeDto[];
  onClose: () => void;
  onFait: () => void;
}>) {
  const toast = useToast();
  const { dateDebut, dateFin } = bornesPeriodeEquipe(periode);
  const liste = useApi(
    () => listPreProspections({ ouvertes: true, dateDebut, dateFin }, { page: 0, size: TAILLE, sort: ['docDate,asc'] }),
    [dateDebut, dateFin],
  );
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lignes = useMemo(() => (liste.data?.content ?? []).filter((l) => !l.commercialId), [liste.data]);

  async function distribuer() {
    if (!commercialId || selection.size === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await distribuerPreProspections({ preProspectionIds: [...selection], commercialId });
      toast({ texte: phraseDistribution(r), variante: 'succes' });
      onFait();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la distribution.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Distribuer des pré-prospections" onClose={onClose} width={640}>
      <div className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground">
          Le commercial choisi est posé sur chaque ligne cochée, qui reste une pré-prospection : c’est lui qui la
          qualifiera puis la transformera.
        </p>
        {liste.loading && !liste.data && <LoadingState />}
        {liste.error && <ErrorState message={liste.error} />}
        {!liste.error && liste.data && (
          lignes.length === 0 ? (
            <EmptyState title="Rien à distribuer" message="Toutes les pré-prospections ouvertes de la période ont déjà un commercial." />
          ) : (
            <LignesSelectionnables lignes={lignes} selection={selection} onBasculer={(id) => setSelection((s) => basculer(s, id))} />
          )
        )}
        <FormField>
          <FieldLabel htmlFor="dist-commercial">Commercial *</FieldLabel>
          <RefSelect
            id="dist-commercial"
            value={commercialId}
            onChange={setCommercialId}
            items={choixCommerciaux(commerciaux)}
            placeholder="Choisir…"
          />
        </FormField>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void distribuer()} disabled={busy || !commercialId || selection.size === 0}>
          <Send data-icon="inline-start" /> {busy ? 'Distribution…' : `Distribuer (${selection.size})`}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
