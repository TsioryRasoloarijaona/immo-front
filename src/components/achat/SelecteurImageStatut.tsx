import { Button } from '../ui/button';
import { getImagesStatutAchat, urlImageStatut } from '../../lib/apiAchatConfig';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';

/** Choix de l'image d'un statut parmi celles du catalogue (partagé achat / lot). */
export default function SelecteurImageStatut({ valeur, onChange }: Readonly<{ valeur: UUID | null; onChange: (id: UUID | null) => void }>) {
  const { data, loading, error } = useApi(getImagesStatutAchat, [], 'achat-config-images');
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" size="sm" variant={valeur ? 'outline' : 'default'} onClick={() => onChange(null)}>Aucune</Button>
      {loading && !data && <span className="text-micro text-muted-foreground">Chargement…</span>}
      {error && <span className="text-micro text-destructive">{error}</span>}
      {!error && data?.map((i) => (
        <button key={i.id} type="button" title={i.code ?? undefined} aria-label={i.code ?? 'Image'} aria-pressed={valeur === i.id}
          onClick={() => onChange(i.id)}
          className={`rounded-md border p-0.5 ${valeur === i.id ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}>
          <img src={urlImageStatut(i.id)} alt="" className="size-6 object-contain" />
        </button>
      ))}
    </div>
  );
}
