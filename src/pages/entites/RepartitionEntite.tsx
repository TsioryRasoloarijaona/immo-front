import { Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ChampCadre, ChampSelect, type OptionSelect } from '../../components/patrimoine/SaisiePatrimoine';
import { formatNumber, formatPercent } from '../../lib/format';
import type { LigneRepartitionDto, LigneRepartitionEcritureDto } from '../../types';

const ENTETE = 'border-b border-border px-2 py-1.5 text-left text-micro font-medium text-muted-foreground';
const CELLULE = 'border-b border-border px-2 py-1.5 text-body';

/** Part d'un actionnaire dans le total déclaré ; rien si le total est nul. */
function part(parts: number | null | undefined, total: number): string {
  if (!total || parts === null || parts === undefined) return '—';
  return formatPercent(parts / total, 2);
}

/** Onglet « Répartition » en lecture : une ligne par actionnaire, total en pied. */
export function TableRepartition({ lignes, nombreParts }: Readonly<{ lignes: LigneRepartitionDto[]; nombreParts: number }>) {
  if (lignes.length === 0) {
    return <EmptyState title="Aucune répartition" message="Aucun actionnaire n'est réparti sur cette entité." />;
  }
  const total = lignes.reduce((s, l) => s + (l.nombreParts ?? 0), 0);
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" className={ENTETE}>Actionnaire</th>
          <th scope="col" className={`${ENTETE} text-right`}>Parts (actions)</th>
          <th scope="col" className={`${ENTETE} text-right`}>Part</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((l) => (
          <tr key={l.id}>
            <td className={CELLULE}>
              <span className="font-medium text-foreground">{l.actionnaireLibelle || '—'}</span>
              {l.actionnaireCode && <span className="ml-2 text-muted-foreground">{l.actionnaireCode}</span>}
            </td>
            <td className={`${CELLULE} text-right tabular-nums`}>{formatNumber(l.nombreParts ?? 0)}</td>
            <td className={`${CELLULE} text-right tabular-nums`}>{part(l.nombreParts, nombreParts)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className={`${CELLULE} text-left font-medium`}>Total</th>
          <td className={`${CELLULE} text-right font-medium tabular-nums`}>{formatNumber(total)}</td>
          <td className={`${CELLULE} text-right tabular-nums`}>{part(total, nombreParts)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/** Saisie des lignes : un actionnaire une seule fois (sinon 400 « L'actionnaire existe déjà dans la liste !!! »). */
export function SaisieRepartition({
  lignes,
  onChange,
  actionnaires,
  message,
}: Readonly<{
  lignes: LigneRepartitionEcritureDto[];
  onChange: (lignes: LigneRepartitionEcritureDto[]) => void;
  actionnaires: OptionSelect[];
  message: string | null;
}>) {
  const modifier = (index: number, ligne: LigneRepartitionEcritureDto) =>
    onChange(lignes.map((l, i) => (i === index ? ligne : l)));

  return (
    <div className="flex flex-col gap-2.5">
      {lignes.map((ligne, index) => (
        <div key={index} className="grid grid-cols-[1fr_9rem_auto] items-end gap-2">
          <ChampSelect
            id={`rep-actionnaire-${index}`}
            libelle="Actionnaire"
            options={actionnaires}
            valeur={ligne.actionnaireId}
            onChange={(v) => modifier(index, { ...ligne, actionnaireId: v })}
          />
          <ChampCadre id={`rep-parts-${index}`} libelle="Parts">
            <Input
              id={`rep-parts-${index}`}
              type="number"
              inputMode="numeric"
              min={0}
              value={ligne.nombreParts ?? ''}
              onChange={(e) =>
                modifier(index, { ...ligne, nombreParts: e.target.value === '' ? undefined : Math.trunc(Number(e.target.value)) })
              }
            />
          </ChampCadre>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Retirer la ligne ${index + 1}`}
            onClick={() => onChange(lignes.filter((_, i) => i !== index))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      {message && <p role="alert" className="text-label text-destructive">{message}</p>}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lignes, { nombreParts: 0 }])}>
          <Plus data-icon="inline-start" /> Ajouter un actionnaire
        </Button>
      </div>
    </div>
  );
}
