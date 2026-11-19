import { useState } from 'react';
import { CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import BarreIcones from '../BarreIcones';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  creerNoeudNivellement, listerNivellement, modifierNoeudNivellement, supprimerNoeudNivellement,
} from '../../lib/apiProjetConfig';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage, useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { UUID } from '../../types';
import type { NoeudNivellementDto } from '../../types/projetConfig';

/** Parcours profondeur, frères triés par `ordre` ; un nœud dont le parent est absent de la liste devient racine. */
function aplatir(noeuds: NoeudNivellementDto[], parentId: UUID | null = null, profondeur = 0): { noeud: NoeudNivellementDto; profondeur: number }[] {
  const ids = new Set(noeuds.map((n) => n.id));
  return noeuds.filter((n) => (parentId === null ? !n.parentId || !ids.has(n.parentId) : n.parentId === parentId))
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    .flatMap((n) => [{ noeud: n, profondeur }, ...aplatir(noeuds, n.id, profondeur + 1)]);
}

/** Arbre de nivellement d'un projet ; les 400 et 409 du serveur s'affichent tels quels. */
export default function DialogueNivellement({ projetId, onClose }: Readonly<{ projetId: UUID; onClose: () => void }>) {
  const confirmer = useConfirm();
  const ecriture = estAdministrateur(useAuth().user);
  const { data, loading, error, refetch } = useApi(() => listerNivellement(projetId), [projetId]);
  const [selection, setSelection] = useState<UUID | null>(null);
  const [edition, setEdition] = useState<{ id: UUID; code: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function agir(action: () => Promise<unknown>) {
    setErreur(null);
    try {
      await action();
      await refetch();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  async function supprimer() {
    if (!selection) return;
    const ok = await confirmer({ title: 'Supprimer le niveau', message: 'Voulez-vous vraiment supprimer cet enregistrement ?', confirmLabel: 'Supprimer' });
    if (!ok) return;
    await agir(async () => { await supprimerNoeudNivellement(projetId, selection); setSelection(null); });
  }

  async function renommer() {
    if (!edition) return;
    const { id, code } = edition;
    setEdition(null);
    await agir(() => modifierNoeudNivellement(projetId, id, code.trim()));
  }

  const lignes = aplatir(data ?? []);
  const noeudSelectionne = data?.find((n) => n.id === selection);
  return (
    <Modal title="Nivellement" onClose={onClose} width={560}>
      {ecriture && <BarreIcones className="mb-2 flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => void agir(() => creerNoeudNivellement(projetId, null))}>
          <Plus /> Ajouter une racine
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!selection}
          onClick={() => void agir(() => creerNoeudNivellement(projetId, selection))}>
          <CornerDownRight /> Ajouter un enfant
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!selection}
          onClick={() => setEdition(noeudSelectionne ? { id: noeudSelectionne.id, code: noeudSelectionne.code ?? '' } : null)}>
          <Pencil /> Modifier le code
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!selection} onClick={() => void supprimer()}>
          <Trash2 /> Supprimer
        </Button>
      </BarreIcones>}
      {erreur && <p className="mb-2 text-body text-destructive">{erreur}</p>}
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && lignes.length === 0 && <EmptyState title="Aucun niveau défini" />}
      {!error && data && lignes.length > 0 && (
        <ul className="max-h-[50vh] overflow-auto rounded-md border border-border">
          {lignes.map(({ noeud, profondeur }) => (
            <li key={noeud.id}>
              {edition?.id === noeud.id ? (
                <Input ref={(el) => el?.focus()} aria-label="Code du niveau" value={edition.code} style={{ marginLeft: profondeur * 20 }}
                  onChange={(e) => setEdition({ id: noeud.id, code: e.target.value })} onBlur={() => setEdition(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void renommer();
                    if (e.key === 'Escape') setEdition(null);
                  }} />
              ) : (
                <button type="button" aria-pressed={selection === noeud.id}
                  className={cn('block w-full px-2 py-1 text-left text-body hover:bg-muted', selection === noeud.id && 'bg-muted font-medium')}
                  style={{ paddingLeft: 8 + profondeur * 20 }} onClick={() => setSelection(noeud.id)}
                  onDoubleClick={() => ecriture && setEdition({ id: noeud.id, code: noeud.code ?? '' })}>
                  {noeud.code}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
