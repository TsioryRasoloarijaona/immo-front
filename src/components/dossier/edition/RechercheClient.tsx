import { useId, useState } from 'react';
import { Input } from '../../ui/input';
import { listProspects } from '../../../lib/api';
import { nomTiers } from '../../../lib/editionDossier';
import { useApi, useDebouncedValue } from '../../../lib/useApi';

const MIN_CARACTERES = 2;

async function chercher(texte: string) {
  if (texte.length < MIN_CARACTERES) return [];
  // `type` ne lie qu'une valeur : clients et prospects en deux appels.
  const [clients, prospects] = await Promise.all([
    listProspects({ search: texte, type: ['CLI'] }, { page: 0, size: 10 }),
    listProspects({ search: texte, type: ['PRO'] }, { page: 0, size: 10 }),
  ]);
  return [...clients.content, ...prospects.content];
}

/** Nouveau client principal : recherche parmi les clients et prospects (CfgTier CLI / PRO). */
export default function RechercheClient({
  choisi,
  onChoisir,
}: Readonly<{ choisi: { id: string; nom: string } | null; onChoisir: (t: { id: string; nom: string } | null) => void }>) {
  const id = useId();
  const [texte, setTexte] = useState('');
  const recherche = useDebouncedValue(texte.trim());
  const resultats = useApi(() => chercher(recherche), [recherche]);

  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="mb-0.5 block text-micro font-medium text-muted-foreground">
        Changer le client principal
      </label>
      {choisi ? (
        <div className="flex items-center gap-2 text-body">
          <span className="font-medium text-foreground">{choisi.nom}</span>
          <button type="button" className="text-micro text-(--info) hover:underline" onClick={() => onChoisir(null)}>
            Retirer
          </button>
        </div>
      ) : (
        <>
          <Input id={id} value={texte} placeholder="Nom, code ou e-mail (2 caractères min.)" onChange={(e) => setTexte(e.target.value)} />
          {resultats.error && <p role="alert" className="mt-1 text-micro text-destructive">{resultats.error}</p>}
          {!resultats.error && resultats.data && resultats.data.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-auto rounded-md border border-border">
              {resultats.data.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full px-2 py-1 text-left text-body hover:bg-muted"
                    onClick={() => onChoisir({ id: t.id, nom: nomTiers(t) })}
                  >
                    {nomTiers(t)} <span className="text-micro text-muted-foreground">{t.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
