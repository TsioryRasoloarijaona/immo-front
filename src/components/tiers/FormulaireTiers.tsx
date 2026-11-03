import SectionsSaisie, { type ListesChoix } from '../patrimoine/SectionsSaisie';
import type { ConfigTiers } from '../../lib/colonnesTiers';
import type { useSaisie } from '../../lib/saisiePatrimoine';
import { champsFautifs, sectionsTiers, type OngletSaisie } from '../../lib/saisieTiers';

/** Un onglet de saisie (Général, Autres ou Notes) ; le brouillon appartient à la fiche, il survit au changement d'onglet. */
export default function FormulaireTiers({ cfg, onglet, saisie, listes }: Readonly<{
  cfg: ConfigTiers;
  onglet: OngletSaisie;
  saisie: ReturnType<typeof useSaisie>;
  listes: ListesChoix;
}>) {
  const { brouillon } = saisie;
  return (
    <div className="flex max-w-240 flex-col gap-3 p-3">
      <SectionsSaisie
        sections={sectionsTiers(cfg, onglet, brouillon.personneMorale === true)}
        brouillon={brouillon}
        onChange={saisie.modifier}
        listes={listes}
        champsErreur={champsFautifs(saisie.champErreur)}
        messageErreur={saisie.erreur}
      />
    </div>
  );
}
