import { useMemo } from 'react';
import RefSelect from './RefSelect';
import { Input } from './ui/input';
import { Field as FormField, FieldLabel } from './ui/field';
import { usePays } from '../lib/referentiels';

/** Indicatif du Maroc — proposé par défaut à la création.
 *
 * Ce n'est pas un raccourci de confort : 99 % des prospections avec rendez-vous
 * portent un numéro marocain, et c'est l'absence d'indicatif qui produit les
 * numéros que le canal WhatsApp rejette. Un défaut qui couvre la quasi-totalité
 * des cas vaut mieux qu'un champ vide que personne ne remplit. */
export const INDICATIF_MAROC = '212';

/**
 * Un numéro de téléphone : indicatif pays + numéro.
 *
 * Le back a séparé les deux (`indicatifTelephone` / `telephone`) parce qu'un
 * numéro sans indicatif n'est pas expédiable par WhatsApp — 43 fiches réelles
 * portent aujourd'hui un numéro inexploitable, et le canal les rejette avec
 * `NUMERO_INEXPLOITABLE`.
 *
 * **Ce composant ne reformate rien.** Il transmet l'indicatif choisi et le
 * numéro saisi tels quels. Les champs `telephone`/`indicatifTelephone` n'ont
 * aucune annotation dans la spec : rien n'y dit si le numéro doit perdre son
 * zéro initial une fois l'indicatif renseigné. Inventer cette règle ici
 * risquerait de fabriquer les `+2120612…` que l'on cherche justement à
 * éliminer. La composition reste au serveur ; le jour où la règle est
 * documentée, elle s'ajoute à un seul endroit.
 */
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

  // Plusieurs pays partagent un même indicatif (+1 pour les États-Unis et le
  // Canada, +212 pour le Maroc et le Sahara occidental…). La valeur d'un
  // <option> devant rester unique, on replie sur l'indicatif et on garde le
  // premier pays rencontré comme libellé.
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
