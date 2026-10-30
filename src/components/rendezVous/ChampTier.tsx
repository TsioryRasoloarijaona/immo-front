import { useMemo, useState } from 'react';
import SearchableSelect from '../SearchableSelect';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { listProspects } from '../../lib/api';
import { nomTiers } from '../../lib/editionDossier';
import { useApi, useDebouncedValue } from '../../lib/useApi';

type Choix = { label: string; value: string };

/** Tiers obligatoire : une zone de recherche alimente la liste de choix, le tiers choisi y reste toujours. */
export default function ChampTier({ valeur, libelleInitial, erreur, onChange }: Readonly<{
  valeur: string;
  libelleInitial: string | null;
  erreur?: string;
  onChange: (id: string) => void;
}>) {
  const [recherche, setRecherche] = useState('');
  const [choisi, setChoisi] = useState<Choix | null>(valeur ? { label: libelleInitial ?? valeur, value: valeur } : null);
  const texte = useDebouncedValue(recherche.trim());
  const tiers = useApi(() => listProspects({ search: texte || undefined }, { page: 0, size: 20 }), [texte]);
  const items = useMemo(() => {
    const trouves = (tiers.data?.content ?? []).map((t) => ({ label: nomTiers(t), value: t.id }));
    return choisi && !trouves.some((t) => t.value === choisi.value) ? [choisi, ...trouves] : trouves;
  }, [tiers.data, choisi]);

  return (
    <Field className="col-span-full">
      <FieldLabel htmlFor="rdv-tier">Tiers *</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Rechercher un tiers" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <SearchableSelect id="rdv-tier" items={items} value={valeur || null} placeholder="Choisir…" emptyMessage="Aucun tiers"
          className="w-full min-w-0"
          onValueChange={(v) => {
            setChoisi(items.find((i) => i.value === v) ?? null);
            onChange(v ?? '');
          }} />
      </div>
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </Field>
  );
}
