import { useMemo, useState } from 'react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { listCategoriesBilan } from '../../lib/apiFaisabilite';
import { categoriesEnArbre } from '../../lib/financeFaisabilite';
import { useApi } from '../../lib/useApi';

/** Cases à cocher sur l'arbre des catégories du bilan ; le serveur ajoute les catégories parentes. */
export default function DialogueAjoutCategories({ dejaPresentes, onValider, onClose }: Readonly<{
  dejaPresentes: ReadonlySet<string>;
  onValider: (ids: string[]) => void;
  onClose: () => void;
}>) {
  const { data, error } = useApi(listCategoriesBilan, []);
  const [recherche, setRecherche] = useState('');
  const [choisies, setChoisies] = useState<ReadonlySet<string>>(new Set());
  const arbre = useMemo(() => categoriesEnArbre(data ?? []), [data]);
  const texte = recherche.trim().toLowerCase();
  const visibles = texte ? arbre.filter((c) => (c.libelle ?? '').toLowerCase().includes(texte)) : arbre;

  function basculer(id: string, coche: boolean) {
    const suite = new Set(choisies);
    if (coche) suite.add(id);
    else suite.delete(id);
    setChoisies(suite);
  }

  return (
    <Modal title="Ajouter des catégories" onClose={onClose} width={640}>
      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {!error && data && (
        <div className="flex flex-col gap-2">
          <Input aria-label="Rechercher une catégorie" placeholder="Rechercher une catégorie…" value={recherche}
            onChange={(e) => setRecherche(e.target.value)} />
          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border p-2">
            {visibles.length === 0 && <p className="text-micro text-muted-foreground">Aucune catégorie.</p>}
            {visibles.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-0.5 text-body text-foreground" style={{ paddingLeft: c.profondeur * 16 }}>
                <input type="checkbox" disabled={dejaPresentes.has(c.id)} checked={dejaPresentes.has(c.id) || choisies.has(c.id)}
                  onChange={(e) => basculer(c.id, e.target.checked)} />
                {c.libelle ?? c.code}
                {c.estRecette && <span className="text-micro text-muted-foreground">(recette)</span>}
              </label>
            ))}
          </div>
        </div>
      )}
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={choisies.size === 0} onClick={() => onValider([...choisies])}>Ajouter {choisies.size > 0 && `(${choisies.size})`}</Button>
      </DialogFooter>
    </Modal>
  );
}
