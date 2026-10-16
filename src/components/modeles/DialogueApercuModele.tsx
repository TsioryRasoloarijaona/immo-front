import { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import Modal from '../Modal';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { listDossiers } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { DossierListItemDto } from '../../types';

/** Choix du dossier qui remplit l'aperçu : recherche par code ou client, dossiers du périmètre seulement. */
export default function DialogueApercuModele({
  onChoisir,
  onClose,
}: Readonly<{
  onChoisir: (dossier: DossierListItemDto) => Promise<void>;
  onClose: () => void;
}>) {
  const [recherche, setRecherche] = useState('');
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const terme = useDebouncedValue(recherche.trim());
  const { data, loading, error } = useApi(
    () => listDossiers({ search: terme || undefined, inclureSortis: true }, { page: 0, size: 8 }),
    [terme],
  );

  async function choisir(d: DossierListItemDto) {
    setEnCours(d.id);
    setErreur(null);
    try {
      await onChoisir(d);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'aperçu.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <Modal title="Aperçu sur un dossier" onClose={onClose} width={520}>
      <div className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground">
          Le contenu affiché dans l'éditeur, même non enregistré, est rempli avec le dossier choisi ; le PDF s'ouvre dans un
          nouvel onglet.
        </p>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Code du dossier ou nom du client"
            aria-label="Rechercher un dossier"
            className="pl-7"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- boîte de dialogue : le focus initial y est attendu
            autoFocus
          />
        </div>
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && (
          <EmptyState title="Aucun dossier" message="Aucun dossier ne correspond à la recherche." />
        )}
        {!error && data && data.content.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {data.content.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-body font-medium text-foreground">{d.code ?? '—'}</span>
                  <span className="block truncate text-micro text-muted-foreground">{d.clientNom ?? '—'}</span>
                </span>
                <Button type="button" variant="outline" size="sm" disabled={enCours !== null} onClick={() => void choisir(d)}>
                  <Eye data-icon="inline-start" /> {enCours === d.id ? 'Génération…' : 'Aperçu'}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
    </Modal>
  );
}
