import { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldLabel } from './ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ProspectionExistanteNotice from './ProspectionExistanteNotice';
import { getArticlesReferentiel, getTranchesReferentiel, prospectionExistanteDepuisErreur } from '../lib/api';
import { useApi } from '../lib/useApi';
import { referentielItems } from '../lib/referentiels';
import type { ProspectionExistanteDto, TransformerProspectionRequest } from '../types';

/** Sans `trancheId` le serveur renvoie 400, d'où la tranche à confirmer ici. La
 * cascade tranche → articles applique la règle serveur « l'article appartient à
 * la tranche » (400 sinon). */
export default function TransformerProspectionDialog({
  initialCommercialId,
  initialTrancheId,
  initialArticleId,
  commercialItems,
  onClose,
  onSubmit,
}: {
  initialCommercialId?: string | null;
  initialTrancheId?: string | null;
  initialArticleId?: string | null;
  commercialItems: { label: string; value: string }[];
  onClose: () => void;
  onSubmit: (body: TransformerProspectionRequest) => Promise<void>;
}) {
  const [commercialId, setCommercialId] = useState<string | null>(initialCommercialId ?? null);
  const [trancheId, setTrancheId] = useState<string | null>(initialTrancheId ?? null);
  const [articleId, setArticleId] = useState<string | null>(initialArticleId ?? null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // 409 « un prospect, un projet, une prospection » : une redirection, pas une
  // erreur de saisie (voir `ProspectionExistanteNotice`).
  const [existante, setExistante] = useState<ProspectionExistanteDto | null>(null);

  const tranches = useApi(() => getTranchesReferentiel(), [], 'referentiel-tranches');
  const articles = useApi(
    () => (trancheId ? getArticlesReferentiel(trancheId) : Promise.resolve([])),
    [trancheId],
  );

  const trancheItems = referentielItems(tranches.data ?? []);
  const articleItems = (articles.data ?? []).map((a) => ({ label: a.code || a.description || a.id, value: a.id }));

  const canSubmit = !!commercialId && !!trancheId;

  async function transformer() {
    if (!canSubmit || !commercialId || !trancheId) return;
    setBusy(true);
    setErreur(null);
    setExistante(null);
    try {
      await onSubmit({ commercialId, trancheId, articleId: articleId || undefined });
      onClose();
    } catch (err) {
      setExistante(prospectionExistanteDepuisErreur(err));
      setErreur(err instanceof Error ? err.message : "Échec de la transformation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Transformer en prospection" onClose={onClose} width={480}>
      <div className="flex flex-col gap-3.5">
        <FormField>
          <FieldLabel htmlFor="tf-commercial">Commercial *</FieldLabel>
          <Select items={commercialItems} value={commercialId} onValueChange={(v) => setCommercialId((v as string) || null)}>
            <SelectTrigger id="tf-commercial" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent><SelectGroup>{commercialItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </FormField>
        <FormField>
          <FieldLabel htmlFor="tf-tranche">Tranche *</FieldLabel>
          <Select
            items={trancheItems}
            value={trancheId}
            onValueChange={(v) => {
              const next = (v as string) || null;
              setTrancheId(next);
              // Autre tranche : l'article n'y appartient plus ; retour à l'origine : il redevient valide.
              setArticleId(next === (initialTrancheId ?? null) ? (initialArticleId ?? null) : null);
            }}
          >
            <SelectTrigger id="tf-tranche" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent><SelectGroup>{trancheItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </FormField>
        <FormField>
          <FieldLabel htmlFor="tf-article">Article (optionnel)</FieldLabel>
          <Select items={articleItems} value={articleId} onValueChange={(v) => setArticleId((v as string) || null)} disabled={!trancheId}>
            <SelectTrigger id="tf-article" className="w-full">
              <SelectValue placeholder={trancheId ? 'Choisir…' : 'Choisir une tranche d\'abord'} />
            </SelectTrigger>
            <SelectContent><SelectGroup>{articleItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </FormField>

        {existante ? (
          <ProspectionExistanteNotice existante={existante} message={erreur} onOuvrir={onClose} />
        ) : (
          erreur && <p className="text-body text-destructive">{erreur}</p>
        )}
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void transformer()} disabled={!canSubmit || busy}>
          <Check data-icon="inline-start" /> {busy ? 'Transformation…' : 'Transformer'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
