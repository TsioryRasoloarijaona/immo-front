import { Card, Field, FieldGrid, TogglePill } from '../ui';
import { valeurFiche, type Choix, type SectionSaisie } from '../../lib/saisiePatrimoine';

/**
 * Fiche en lecture tirée du même catalogue que le formulaire : une carte par section, « — » pour un champ vide.
 * `listes` : choix des champs dont le détail ne porte que l'id (libellé retrouvé par l'id).
 */
export default function FicheSections({ sections, source, listes = {} }: Readonly<{
  sections: SectionSaisie[];
  source: object;
  listes?: Record<string, Choix>;
}>) {
  const valeurs = source as Record<string, unknown>;
  return (
    <>
      {sections.map((section) => (
        <Card key={section.titre} title={section.titre}>
          <FieldGrid>
            {section.champs.map((def) => (
              <Field
                key={def.nom}
                label={def.libelle}
                value={def.type === 'booleen'
                  ? <TogglePill on={valeurs[def.nom] === true} onLabel="Oui" offLabel="Non" />
                  : valeurFiche(def, source, listes[def.liste ?? ''])}
              />
            ))}
          </FieldGrid>
        </Card>
      ))}
    </>
  );
}
