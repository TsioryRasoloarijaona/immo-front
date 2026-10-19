import { Card, Field, FieldGrid, TogglePill } from '../ui';
import { valeurFiche, type SectionSaisie } from '../../lib/saisiePatrimoine';

/** Fiche en lecture tirée du même catalogue que le formulaire : une carte par section, « — » pour un champ vide. */
export default function FicheSections({ sections, source }: Readonly<{ sections: SectionSaisie[]; source: object }>) {
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
                  : valeurFiche(def, source)}
              />
            ))}
          </FieldGrid>
        </Card>
      ))}
    </>
  );
}
