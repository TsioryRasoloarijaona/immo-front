import type { ReactNode } from 'react';
import { Card, Field, FieldGrid, TogglePill } from '../ui';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../lib/format';
import type { DefChamp } from '../../lib/saisiePatrimoine';

/** Texte d'un champ du catalogue tel que la fiche l'affiche ; `undefined` → « — » (rendu par `Field`). */
function texte(genre: DefChamp<unknown>['genre'], valeur: unknown): string | undefined {
  if (valeur === null || valeur === undefined || valeur === '') return undefined;
  switch (genre) {
    case 'montant':
      return typeof valeur === 'number' ? formatCurrency(valeur) : undefined;
    case 'taux':
      return typeof valeur === 'number' ? formatPercent(valeur, 2) : undefined;
    case 'nombre':
      return typeof valeur === 'number' ? formatNumber(valeur, 2) : undefined;
    case 'entier':
      return typeof valeur === 'number' ? formatNumber(valeur) : undefined;
    case 'date':
      return typeof valeur === 'string' ? formatDate(valeur) : undefined;
    default:
      return typeof valeur === 'string' ? valeur : undefined;
  }
}

/** Un bloc de fiche : les mêmes définitions que le formulaire, lues dans le DTO de lecture (mêmes noms). */
export function BlocFiche<T>({
  titre,
  defs,
  fiche,
  accent,
  suite,
}: Readonly<{
  titre: string;
  defs: readonly DefChamp<T>[];
  fiche: object;
  accent?: string;
  /** Champs de lecture seule ajoutés en fin de bloc (trace, calculs). */
  suite?: ReactNode;
}>) {
  const source = fiche as Record<string, unknown>;
  return (
    <Card title={titre} accent={accent}>
      <FieldGrid>
        {defs.map((def) => {
          const valeur = source[def.lu ?? def.nom];
          return (
            <Field
              key={def.nom}
              label={def.libelle}
              value={def.genre === 'case' ? <TogglePill on={valeur === true} onLabel="Oui" offLabel="Non" /> : texte(def.genre, valeur)}
            />
          );
        })}
        {suite}
      </FieldGrid>
    </Card>
  );
}
