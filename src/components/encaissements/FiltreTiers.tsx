import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/input';
import { listProspects } from '../../lib/api';
import { personDisplayName } from '../../lib/domain';
import { useApi, useDebouncedValue } from '../../lib/useApi';

const MIN_CARACTERES = 2;

/** Le tiers d'un encaissement est surtout un client : sans `type`, seuls les prospects remontent.
 * `type` ne lie qu'une valeur, d'où deux appels (CLI puis PRO). */
async function chercher(texte: string) {
  if (texte.length < MIN_CARACTERES) return null;
  const [clients, prospects] = await Promise.all([
    listProspects({ search: texte, type: ['CLI'] }, { page: 0, size: 8 }),
    listProspects({ search: texte, type: ['PRO'] }, { page: 0, size: 8 }),
  ]);
  return [...clients.content, ...prospects.content];
}

export interface TiersChoisi {
  id: string;
  nom: string;
}

/** Filtre « Tiers » de la liste des encaissements : recherche à la frappe parmi les tiers (CfgTier). */
export default function FiltreTiers({
  choisi,
  onChoisir,
}: Readonly<{ choisi: TiersChoisi | null; onChoisir: (tiers: TiersChoisi | null) => void }>) {
  const [saisie, setSaisie] = useState('');
  const recherche = useDebouncedValue(saisie.trim());
  const resultats = useApi(() => chercher(recherche), [recherche]);
  const lignes = resultats.data ?? [];

  if (choisi) {
    return (
      <span className="inline-flex h-8 max-w-55 items-center gap-1 rounded-md border border-border bg-muted px-2 text-body">
        <span className="text-micro text-muted-foreground">Tiers</span>
        <span className="truncate font-medium text-foreground">{choisi.nom}</span>
        <button
          type="button"
          aria-label="Retirer le filtre Tiers"
          className="rounded-sm text-muted-foreground hover:text-foreground"
          onClick={() => onChoisir(null)}
        >
          <X className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <div className="relative w-48">
      <Input
        aria-label="Filtrer par tiers"
        placeholder="Tiers…"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
      />
      {recherche.length >= MIN_CARACTERES && (resultats.error || resultats.data) && (
        <ul className="absolute top-full left-0 z-20 mt-1 max-h-60 w-72 overflow-auto rounded-md border border-border bg-popover shadow-md">
          {resultats.error && <li className="px-2 py-1 text-micro text-destructive">{resultats.error}</li>}
          {!resultats.error && lignes.length === 0 && (
            <li className="px-2 py-1 text-micro text-muted-foreground">Aucun tiers trouvé.</li>
          )}
          {!resultats.error &&
            lignes.map((t) => {
              const nom = personDisplayName(t);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full truncate px-2 py-1 text-left text-body hover:bg-muted"
                    onClick={() => {
                      onChoisir({ id: t.id, nom });
                      setSaisie('');
                    }}
                  >
                    {nom}
                    {t.code && <span className="ml-1.5 text-micro text-muted-foreground">{t.code}</span>}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
