import { Plus, Trash2 } from 'lucide-react';
import SearchableSelect, { type SearchableSelectOption } from '../SearchableSelect';
import { Button } from '../ui/button';
import { FieldError } from '../ui/field';
import { ChampNombre } from './champsSaisieAchat';
import { formatPercent, formatPercentValue } from '../../lib/format';
import type { VentilationDocumentAchatDto } from '../../types/achat';
import { partVide, totalVentilation, ventilationComplete, type PartBrouillon } from '../../lib/saisiePieceAchat';
import { cn } from '../../lib/utils';

/** Ventilation de la pièce entre projets : un projet et un taux (%) par part. */
export default function VentilationProjetsSaisie({ parts, onChange, projets, parCategorie, erreur }: Readonly<{
  parts: PartBrouillon[];
  onChange: (parts: PartBrouillon[]) => void;
  projets: SearchableSelectOption[];
  /** Lecture seule, calculée par le serveur : vide en création. */
  parCategorie: VentilationDocumentAchatDto[];
  erreur?: string;
}>) {
  const maj = (cle: number, champ: Partial<PartBrouillon>) => onChange(parts.map((p) => (p.cle === cle ? { ...p, ...champ } : p)));
  const total = totalVentilation(parts);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-label font-semibold">Ventilation par projet</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...parts, partVide()])}>
          <Plus /> Ajouter une part
        </Button>
      </div>
      {parts.length === 0 ? (
        <p className="text-body text-muted-foreground">Aucune ventilation.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {parts.map((p, i) => (
            <li key={p.cle} className="grid grid-cols-[minmax(0,1fr)_8rem_auto] items-center gap-2">
              <SearchableSelect
                label={`Projet, part ${i + 1}`}
                items={projets}
                value={p.projetId}
                onValueChange={(v) => maj(p.cle, { projetId: v })}
                placeholder="Choisir…"
                size="sm"
              />
              <ChampNombre libelle={`Taux %, part ${i + 1}`} valeur={p.taux} onChange={(v) => maj(p.cle, { taux: v })} />
              <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la part ${i + 1}`} onClick={() => onChange(parts.filter((x) => x.cle !== p.cle))}>
                <Trash2 />
              </Button>
            </li>
          ))}
          <li className="text-body text-muted-foreground">
            Total : <span className={cn('tabular-nums', !ventilationComplete(parts) && 'font-semibold text-destructive')}>{formatPercentValue(total)}</span>
          </li>
        </ul>
      )}
      <FieldError>{erreur}</FieldError>
      <h3 className="text-label font-semibold">Ventilation par catégorie</h3>
      {parCategorie.length === 0 ? (
        <p className="text-body text-muted-foreground">Calculée par le serveur, visible après enregistrement.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-body">
          {parCategorie.map((c) => (
            <li key={`${c.categorieCode ?? ''}-${c.categorieDescription ?? ''}`} className="flex justify-between gap-4">
              <span>{c.categorieDescription ?? c.categorieCode ?? '—'}</span>
              <span className="tabular-nums">{formatPercent(c.taux, 2)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
