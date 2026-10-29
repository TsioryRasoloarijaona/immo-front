import { useState } from 'react';
import FiltreEntiteProjetTranche from '../liste/FiltreEntiteProjetTranche';
import { CASCADE_VIDE, useCascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import type { ValeursRapport } from '../../lib/apiRapports';
import { valeursDe } from '../../lib/rapports';

/** Paramètre `trancheId` d'un rapport : la cascade Entité → Projet → Tranche écrit les tranches effectives dans les valeurs. */
export default function ChampTranchesCascade({
  valeurs,
  changer,
}: Readonly<{ valeurs: ValeursRapport; changer: (nom: string, vals: string[]) => void }>) {
  const [choix, setChoix] = useState<SelectionCascade>(CASCADE_VIDE);
  // Valeurs vidées de l'extérieur (réinitialisation) : la cascade repart de zéro.
  const sel = valeursDe(valeurs, 'trancheId').length === 0 ? CASCADE_VIDE : choix;
  const cascade = useCascadeTranches(sel);

  function modifier(suivante: SelectionCascade) {
    setChoix(suivante);
    changer('trancheId', cascade.tranchesEffectives(suivante) ?? []);
  }

  return <FiltreEntiteProjetTranche valeur={sel} onChange={modifier} cascade={cascade} />;
}
