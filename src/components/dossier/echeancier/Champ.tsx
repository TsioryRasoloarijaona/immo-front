import type { ReactNode } from 'react';
import { Field as FormField, FieldLabel } from '../../ui/field';

/** Libellé + contrôle des formulaires des sous-listes du dossier. */
export default function Champ({ id, libelle, children }: Readonly<{ id: string; libelle: string; children: ReactNode }>) {
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      {children}
    </FormField>
  );
}
