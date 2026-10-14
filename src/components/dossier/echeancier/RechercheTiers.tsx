import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { listProspects } from '../../../lib/api';
import { personDisplayName } from '../../../lib/domain';
import { useApi, useDebouncedValue } from '../../../lib/useApi';

/** Recherche d'un tiers (prospect ou client) par nom, CIN ou téléphone, pour l'ajouter comme co-acquéreur. */
export default function RechercheTiers({
  exclus,
  onChoisir,
}: Readonly<{ exclus: ReadonlySet<string>; onChoisir: (tiers: { id: string; nom: string }) => void }>) {
  const [saisie, setSaisie] = useState('');
  const recherche = useDebouncedValue(saisie.trim());
  const resultats = useApi(
    () => (recherche.length >= 2 ? listProspects({ search: recherche }, { page: 0, size: 8 }) : Promise.resolve(null)),
    [recherche],
  );
  const lignes = (resultats.data?.content ?? []).filter((t) => !exclus.has(t.id));

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        aria-label="Rechercher un co-acquéreur"
        placeholder="Ajouter un co-acquéreur : nom, CIN ou téléphone…"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
      />
      {resultats.error && <p className="text-micro text-(--warning)">{resultats.error}</p>}
      {recherche.length >= 2 && !resultats.error && resultats.data && lignes.length === 0 && (
        <p className="text-micro text-muted-foreground">Aucun tiers trouvé.</p>
      )}
      {lignes.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {lignes.map((t) => {
            const nom = personDisplayName(t);
            return (
              <li key={t.id} className="flex items-center gap-2 px-2 py-1">
                <span className="min-w-0 flex-1 truncate text-label">{nom}</span>
                {t.cin && <span className="text-micro text-muted-foreground">{t.cin}</span>}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChoisir({ id: t.id, nom });
                    setSaisie('');
                  }}
                >
                  <Plus data-icon="inline-start" /> Ajouter
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
