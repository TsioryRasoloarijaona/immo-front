import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import Modal from '../Modal';
import RefSelect from '../RefSelect';
import LignesSelectionnables from './LignesSelectionnables';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { distribuerPreProspections, getTranchesReferentiel, listPreProspections } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { referentielItems } from '../../lib/referentiels';
import { basculer, choixCommerciaux, phraseDistribution } from '../../lib/equipe';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto, ProspectionListItemDto } from '../../types';

const TAILLE = 100;

// Même règle que « Transformer » côté serveur : sans prospect lié, la ligne serait refusée (400).
function raisonBlocage(l: ProspectionListItemDto): string | null {
  return l.prospectId ? null : 'prospect à créer';
}

/** Les plus anciennes d'abord ; tout le lot ou rien (le serveur n'écrit rien si une ligne est refusée). */
export default function DistribuerDialog({
  commerciaux,
  onClose,
  onFait,
}: Readonly<{
  commerciaux: readonly CommercialEquipeDto[];
  onClose: () => void;
  onFait: () => void;
}>) {
  const toast = useToast();
  const liste = useApi(
    () => listPreProspections({ ouvertes: true }, { page: 0, size: TAILLE, sort: ['docDate,asc'] }),
    [],
  );
  const tranches = useApi(() => getTranchesReferentiel(), [], 'referentiel-tranches');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lignes = useMemo(() => (liste.data?.content ?? []).filter((l) => !l.commercialId), [liste.data]);
  const choix = choixCommerciaux(commerciaux);

  async function distribuer() {
    if (!commercialId || selection.size === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await distribuerPreProspections({ preProspectionIds: [...selection], commercialId, trancheId });
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
          Chaque ligne cochée devient une prospection du commercial choisi. Une pré-prospection sans prospect lié ne
          peut pas être distribuée : créez d’abord le prospect depuis sa fiche.
        </p>
        {liste.loading && !liste.data && <LoadingState />}
        {liste.error && <ErrorState message={liste.error} />}
        {!liste.error && liste.data && (
          lignes.length === 0 ? (
            <EmptyState title="Rien à distribuer" message="Toutes les pré-prospections ouvertes ont déjà un commercial." />
          ) : (
            <LignesSelectionnables lignes={lignes} selection={selection} onBasculer={(id) => setSelection((s) => basculer(s, id))} bloquee={raisonBlocage} />
          )
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="dist-commercial">Commercial *</FieldLabel>
            <RefSelect id="dist-commercial" value={commercialId} onChange={setCommercialId} items={choix} placeholder="Choisir…" />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="dist-tranche">Tranche (si la ligne n’en a pas)</FieldLabel>
            <RefSelect
              id="dist-tranche"
              value={trancheId}
              onChange={setTrancheId}
              items={referentielItems(tranches.data ?? [])}
              placeholder="Garder la tranche de la ligne"
            />
          </FormField>
        </div>
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
