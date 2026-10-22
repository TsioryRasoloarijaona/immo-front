import { useEffect, useState, type ReactNode } from 'react';
import type { ValeursRapport } from '../../lib/apiRapports';
import type { DescripteurRapportDto, ResultatRapportDto, SectionRapportDto } from '../../types/rapports';

export interface PropsRendu {
  descripteur: DescripteurRapportDto;
  valeurs: ValeursRapport;
  resultat: ResultatRapportDto;
  /** Rendu générique d'une section, à réutiliser pour celles que le rendu ne dessine pas lui-même. */
  sectionParDefaut: (section: SectionRapportDto) => ReactNode;
}

/** Exporté par défaut par `rendus/<module>/<code>.tsx` : fonction pure (pas de hook), `null` ⇒ rendu générique. */
export type RenduSpecifique = (props: PropsRendu) => ReactNode;

// Un rendu = un fichier ; aucun registre à éditer.
const chargeurs = import.meta.glob<{ default: RenduSpecifique }>('./rendus/*/*.tsx');

/** `null` : pas de rendu propre à ce rapport ; `undefined` : chargement en cours. */
export function useRenduSpecifique(module: string, code: string): RenduSpecifique | null | undefined {
  const chemin = `./rendus/${module}/${code}.tsx`;
  const chargeur = (chargeurs as Partial<typeof chargeurs>)[chemin];
  const [charge, setCharge] = useState<{ chemin: string; rendu: RenduSpecifique } | null>(null);

  useEffect(() => {
    if (!chargeur) return;
    let actif = true;
    void chargeur().then((m) => {
      if (actif) setCharge({ chemin, rendu: m.default });
    });
    return () => {
      actif = false;
    };
  }, [chargeur, chemin]);

  if (!chargeur) return null;
  return charge?.chemin === chemin ? charge.rendu : undefined;
}
