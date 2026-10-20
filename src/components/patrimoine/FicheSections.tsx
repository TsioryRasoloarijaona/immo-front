import { Card, Field, FieldGrid, TogglePill } from '../ui';
import { valeurFiche, type Choix, type SectionSaisie } from '../../lib/saisiePatrimoine';

type PropsSection = Readonly<{
  section: SectionSaisie;
  source: object;
  /** Choix des champs dont le détail ne porte que l'id (libellé retrouvé par l'id). */
  listes?: Record<string, Choix>;
}>;

/** Une section du catalogue en lecture (un onglet de fiche) : « — » pour un champ vide. */
export function SectionFiche({ section, source, listes = {} }: PropsSection) {
  const valeurs = source as Record<string, unknown>;
  return (
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
  );
}

/** Fiche en lecture tirée du même catalogue que le formulaire : une carte par section. */
export default function FicheSections({ sections, source, listes }: Readonly<{
  sections: SectionSaisie[];
  source: object;
  listes?: Record<string, Choix>;
}>) {
  return (
    <>
      {sections.map((section) => (
        <Card key={section.titre} title={section.titre}>
          <SectionFiche section={section} source={source} listes={listes} />
        </Card>
      ))}
    </>
  );
}
