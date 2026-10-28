import { Download, Eye, X } from 'lucide-react';
import { Badge, Card } from '../../ui';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { pluriel } from '../../../lib/format';

/** Choix du document à générer en lot et récapitulatif des dossiers cochés dans la grille. */
export default function SelecteurDocumentsEnLot({
  types,
  type,
  onType,
  ids,
  libelles,
  occupe,
  erreur,
  onVoir,
  onTelecharger,
  onRetirer,
  onViderSelection,
  onFermer,
}: Readonly<{
  types: { label: string; value: string }[];
  type: string | null;
  onType: (type: string | null) => void;
  ids: Set<string>;
  libelles: Record<string, string>;
  occupe: 'view' | 'download' | null;
  erreur: string | null;
  onVoir: () => void;
  onTelecharger: () => void;
  onRetirer: (id: string) => void;
  onViderSelection: () => void;
  onFermer: () => void;
}>) {
  const aucun = ids.size === 0;
  return (
    <Card padded={false} className="mx-3 mt-2 shrink-0">
      <div className="flex flex-wrap items-center gap-2.5 p-3">
        <Select items={types} value={type} onValueChange={(v) => onType(v || null)}>
          <SelectTrigger className="w-65">
            <SelectValue placeholder="Générer un document…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {types.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {type && (
          <>
            <span className="text-body text-muted-foreground">
              {aucun ? 'Cochez les dossiers à inclure dans le document.' : pluriel(ids.size, 'dossier sélectionné', 'dossiers sélectionnés')}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={aucun || !!occupe} onClick={onVoir}>
              <Eye data-icon="inline-start" /> {occupe === 'view' ? 'Ouverture…' : 'Voir'}
            </Button>
            <Button type="button" size="sm" disabled={aucun || !!occupe} onClick={onTelecharger}>
              <Download data-icon="inline-start" /> {occupe === 'download' ? 'Téléchargement…' : 'Télécharger'}
            </Button>
            {!aucun && (
              <Button type="button" variant="ghost" size="sm" onClick={onViderSelection}>
                Vider la sélection
              </Button>
            )}
            {erreur && <span className="text-body text-destructive">{erreur}</span>}
          </>
        )}
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onFermer}>
          <X data-icon="inline-start" /> Fermer
        </Button>
      </div>
      {type && !aucun && (
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3 pt-2.5">
          {Array.from(ids).map((id) => (
            <Badge key={id} tone="info" className="gap-1">
              {libelles[id] || id}
              <button type="button" aria-label="Retirer de la sélection" onClick={() => onRetirer(id)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
