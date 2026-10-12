import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Modal from '../Modal';
import RefSelect from '../RefSelect';
import LignesSelectionnables from './LignesSelectionnables';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { listProspections, reaffecterProspections } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { basculer, choixCommerciaux, phraseReaffectation } from '../../lib/equipe';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto } from '../../types';

const TAILLE = 100;

/** Prospections ouvertes du commercial ; la sélection part chez un autre membre de l'équipe. */
export default function ReaffecterDialog({
  source,
  commerciaux,
  onClose,
  onFait,
}: Readonly<{
  source: CommercialEquipeDto;
  commerciaux: readonly CommercialEquipeDto[];
  onClose: () => void;
  onFait: () => void;
}>) {
  const toast = useToast();
  const sourceId = source.commercialId ?? '';
  const liste = useApi(
    () => listProspections({ commercial: [sourceId], ouvertes: true }, { page: 0, size: TAILLE, sort: ['docDate,asc'] }),
    [sourceId],
  );
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lignes = liste.data?.content ?? [];
  const total = liste.data?.totalElements ?? lignes.length;

  function toutCocher() {
    setSelection((prev) => (prev.size === lignes.length ? new Set() : new Set(lignes.map((l) => l.id))));
  }

  async function reaffecter() {
    if (!commercialId || selection.size === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await reaffecterProspections({ prospectionIds: [...selection], commercialId, motif: motif.trim() || null });
      toast({ texte: phraseReaffectation(r), variante: 'succes' });
      onFait();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la réaffectation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Prospections de ${source.nom ?? source.code ?? '—'}`} onClose={onClose} width={640}>
      <div className="flex flex-col gap-3">
        {liste.loading && !liste.data && <LoadingState />}
        {liste.error && <ErrorState message={liste.error} />}
        {!liste.error && liste.data && (
          lignes.length === 0 ? (
            <EmptyState title="Aucune prospection ouverte" message="Ce commercial n’a aucune prospection ouverte dans votre périmètre." />
          ) : (
            <>
              <div className="flex items-center justify-between text-micro text-muted-foreground">
                <span>
                  {total > lignes.length ? `Les ${lignes.length} plus anciennes sur ${total}` : `${lignes.length} ouvertes`}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={toutCocher}>
                  {selection.size === lignes.length ? 'Tout décocher' : 'Tout cocher'}
                </Button>
              </div>
              <LignesSelectionnables lignes={lignes} selection={selection} onBasculer={(id) => setSelection((s) => basculer(s, id))} />
            </>
          )
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="reaff-commercial">Nouveau commercial *</FieldLabel>
            <RefSelect
              id="reaff-commercial"
              value={commercialId}
              onChange={setCommercialId}
              items={choixCommerciaux(commerciaux, source.commercialId)}
              placeholder="Choisir…"
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reaff-motif">Motif (facultatif)</FieldLabel>
            <Input id="reaff-motif" value={motif} maxLength={120} onChange={(e) => setMotif(e.target.value)} />
          </FormField>
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void reaffecter()} disabled={busy || !commercialId || selection.size === 0}>
          <ArrowRightLeft data-icon="inline-start" /> {busy ? 'Réaffectation…' : `Réaffecter (${selection.size})`}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
