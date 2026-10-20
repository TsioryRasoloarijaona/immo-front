import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { listGroupesPieceJointe } from '../../lib/apiArticleOnglets';
import { referentielItems, useTypesPieceJointe } from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';
import type { SaisiePieceJointe } from '../../types/articleOnglets';

const IDENTIFIANT_GROUPES = 'groupes-piece-jointe';

/** Type, groupe (texte libre, suggestions du serveur) et description d'un dépôt. */
export default function SaisiePieceChamps({ valeur, onChange, typeObligatoire = false }: Readonly<{
  valeur: SaisiePieceJointe;
  onChange: (v: SaisiePieceJointe) => void;
  typeObligatoire?: boolean;
}>) {
  const types = useTypesPieceJointe();
  const groupes = useApi(() => listGroupesPieceJointe(), []);
  const items = referentielItems(types.data);
  const placeholder = typeObligatoire ? 'Type' : 'Type (optionnel)';
  return (
    <>
      <Select items={items} value={valeur.typeId ?? null} onValueChange={(v) => onChange({ ...valeur, typeId: v ?? undefined })}>
        <SelectTrigger size="sm" className="w-45" aria-label="Type de pièce jointe">
          <SelectValue placeholder={types.loading ? 'Chargement…' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        list={IDENTIFIANT_GROUPES}
        placeholder="Groupe (optionnel)"
        aria-label="Groupe"
        className="w-40"
        value={valeur.groupe ?? ''}
        onChange={(e) => onChange({ ...valeur, groupe: e.target.value || undefined })}
      />
      <datalist id={IDENTIFIANT_GROUPES}>
        {(groupes.data ?? []).map((g) => <option key={g} value={g} />)}
      </datalist>
      <Input
        placeholder="Description (optionnel)"
        aria-label="Description"
        className="w-45"
        value={valeur.description ?? ''}
        onChange={(e) => onChange({ ...valeur, description: e.target.value || undefined })}
      />
    </>
  );
}
