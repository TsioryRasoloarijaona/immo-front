import { useMemo } from 'react';
import RefSelect from './RefSelect';
import { Input } from './ui/input';
import { Field as FormField, FieldLabel } from './ui/field';
import { usePays } from '../lib/referentiels';

/** Défaut voulu, pas de confort : sans indicatif, le canal WhatsApp rejette le numéro. */
export const INDICATIF_MAROC = '212';

/** Ne reformate rien (zéro initial compris) : la composition reste au serveur,
 * sinon on fabriquerait des `+2120612…`. */
export default function TelephoneField({
  id,
  label,
  numero,
  indicatif,
  onNumeroChange,
  onIndicatifChange,
  required,
}: {
  id: string;
  label: string;
  numero: string;
  indicatif: string | null;
  onNumeroChange: (v: string) => void;
  onIndicatifChange: (v: string | null) => void;
  required?: boolean;
}) {
  const pays = usePays();

  // Plusieurs pays partagent un indicatif (+1…) : la valeur d'option devant être
  // unique, on replie sur l'indicatif avec le premier pays comme libellé.
  const indicatifs = useMemo(() => {
    const vus = new Map<string, string>();
    for (const p of pays.data) {
      if (p.indicatifTelephone === undefined || p.indicatifTelephone === null) continue;
      const code = String(p.indicatifTelephone);
      if (!vus.has(code)) vus.set(code, p.description || p.code || '');
    }
    return [...vus.entries()]
      .map(([code, nom]) => ({ value: code, label: nom ? `+${code} · ${nom}` : `+${code}` }))
      .sort((a, b) => Number(a.value) - Number(b.value));
  }, [pays.data]);

  return (
    <FormField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-1.5">
        <div className="w-40 shrink-0">
          <RefSelect
            id={`${id}-indicatif`}
            value={indicatif}
            onChange={onIndicatifChange}
            items={indicatifs}
            placeholder={pays.loading ? 'Chargement…' : '— Indicatif —'}
          />
        </div>
        <Input
          id={id}
          className="min-w-0 flex-1"
          inputMode="tel"
          value={numero}
          onChange={(e) => onNumeroChange(e.target.value)}
          required={required}
        />
      </div>
    </FormField>
  );
}
