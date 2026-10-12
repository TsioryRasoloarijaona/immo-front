import { SelectCellule } from '../components/patrimoine/CellulesOnglet';
import type { ColonneOnglet } from '../components/patrimoine/GrilleOnglet';
import type { OptionSelect } from '../components/patrimoine/SaisiePatrimoine';

interface ItemReference {
  id: string;
  code?: string;
  description?: string;
}

const libelleReference = (code?: string, description?: string) =>
  [code, description].filter(Boolean).join(' — ') || '—';

/**
 * Colonne « liste de référentiel » d'un onglet : `cle` porte l'id choisi, `code`/`description` le libellé relu ;
 * la valeur courante reste proposée même si la liste ne la contient plus (ligne saisie dans OMRAN).
 */
export function colonneReference<E>({
  cle,
  libelle,
  items,
  code,
  description,
  choisir,
}: {
  cle: keyof E & string;
  libelle: string;
  items: readonly ItemReference[] | null;
  code: (l: E) => string | undefined;
  description: (l: E) => string | undefined;
  choisir: (id: string | undefined, item: ItemReference | undefined) => Partial<E>;
}): ColonneOnglet<E> {
  const options: OptionSelect[] = (items ?? []).map((i) => ({ value: i.id, label: libelleReference(i.code, i.description) }));
  return {
    cle,
    libelle,
    lecture: (l) => libelleReference(code(l), description(l)),
    saisie: (l, changer, invalide, etiquette) => {
      const id = l[cle] as string | undefined;
      const courante = !id || options.some((o) => o.value === id)
        ? options
        : [{ value: id, label: libelleReference(code(l), description(l)) }, ...options];
      return (
        <SelectCellule
          etiquette={etiquette}
          invalide={invalide}
          options={courante}
          valeur={id}
          onChange={(v) => changer(choisir(v, items?.find((x) => x.id === v)))}
        />
      );
    },
  };
}
