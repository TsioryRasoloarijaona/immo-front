import { useState } from 'react';
import { Building2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import { getProjetsUtilisateur, listProjets, remplacerProjetsUtilisateur } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { estExempte } from '../../lib/roles';
import type { ProjetPerimetreDto } from '../../types';

/** Boîte de dialogue "Projets affectés" ouverte depuis une ligne de
 * `UtilisateursList` — même coquille `Modal` que toutes les autres boîtes de
 * création/édition de l'app (`NouvelleOffreDialog`, `CreateProspectForm`,
 * `InteractionForm`) : le parent la monte/démonte conditionnellement plutôt
 * que de lui passer un `open` piloté, donc le formulaire repart toujours
 * propre à l'ouverture sans effet de re-seed.
 *
 * Deux fetches indépendants au montage : la liste des 8 projets (GET
 * /api/projets, référentiel partagé avec le reste de l'app — pas de
 * recherche/pagination nécessaire ici, voir FEATURE-perimetre-commercial.md
 * §7.3) et le périmètre actuel de cet utilisateur (GET
 * /api/utilisateurs/{id}/projets). Les cases à cocher ne s'affichent qu'une
 * fois les deux résolus, pour ne jamais pré-cocher un état obsolète. */
export default function AffecterProjetsDialog({
  user,
  onClose,
  onSaved,
}: Readonly<{
  user: { id: string; label: string; roles?: string[] };
  onClose: () => void;
  /** Appelé après un PUT réussi — le parent doit rafraîchir sa liste pour
   * que le badge `nombreProjets` reflète le nouvel état. */
  onSaved: () => void;
}>) {
  const {
    data: projetsPage,
    loading: loadingProjets,
    error: errorProjets,
  } = useApi(() => listProjets({ page: 0, size: 50 }), []);
  const {
    data: assignedProjets,
    loading: loadingAssigned,
    error: errorAssigned,
  } = useApi(() => getProjetsUtilisateur(user.id), [user.id]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Seed the checked set from the real assignment exactly once, the moment
  // it arrives — adjusting state during render (React's documented pattern
  // for "derive state from a prop/fetch the first time it's available")
  // instead of an effect, so it applies synchronously on the same render
  // rather than one render late, and never re-seeds on a later refetch
  // (tracked via the object reference, which only ever changes once for
  // this dialog's lifetime).
  const [seededFrom, setSeededFrom] = useState<ProjetPerimetreDto[] | null>(null);
  if (assignedProjets && assignedProjets !== seededFrom) {
    setSeededFrom(assignedProjets);
    setSelected(new Set(assignedProjets.map((p) => p.id)));
  }
  const seeded = seededFrom !== null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isExempt = estExempte(user);
  const projets = projetsPage?.content ?? [];
  const error = errorProjets || errorAssigned;
  const loading = loadingProjets || (loadingAssigned && !seeded);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      // §9bis.6 — l'API 400 sur un corps sans `projetIds` (absent/null) :
      // toujours envoyer un tableau explicite, y compris `[]`.
      await remplacerProjetsUtilisateur(user.id, Array.from(selected));
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue.');
      setSaving(false);
    }
  }

  return (
    <Modal title={`Projets affectés — ${user.label}`} onClose={onClose} width={420}>
      <div className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground">
          Limite les prospections, pré-prospections, dossiers et encaissements visibles par ce compte
          aux projets cochés. Le filtrage est appliqué par le serveur — cet écran ne fait
          qu'enregistrer l'affectation.
        </p>

        {isExempt && (
          <p className="rounded-md bg-(--amber-bg) px-2.5 py-2 text-micro text-(--amber)">
            Ce compte porte un rôle exempté (Administrateur ou Direction Générale) : il continuera de
            tout voir quels que soient les projets cochés ci-dessous.
          </p>
        )}

        {error && <ErrorState message={error} />}

        {!error && loading && <LoadingState />}

        {!error && !loading && (
          <>
            <div className="flex flex-col gap-1.5">
              {projets.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    className="size-3.5 shrink-0"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="w-14 shrink-0 font-mono text-micro text-muted-foreground">{p.code}</span>
                  <span className="truncate text-body text-foreground">{p.description}</span>
                </label>
              ))}
            </div>

            {selected.size === 0 ? (
              <Badge tone="info" className="w-fit">Aucune restriction — voit tous les projets</Badge>
            ) : (
              <Badge tone="progress" className="w-fit">
                Limité à {selected.size} projet{selected.size > 1 ? 's' : ''}
              </Badge>
            )}
          </>
        )}

        {saveError && <p className="text-micro text-destructive">{saveError}</p>}
      </div>

      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || loading || !!error}>
          <Building2 data-icon="inline-start" /> Enregistrer
        </Button>
      </DialogFooter>
    </Modal>
  );
}
