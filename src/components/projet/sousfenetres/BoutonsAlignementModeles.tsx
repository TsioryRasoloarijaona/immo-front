import { useState } from 'react';
import { FileDown, ListChecks, Target } from 'lucide-react';
import { getModelePropose } from '../../../lib/apiProjet';
import { errorMessage } from '../../../lib/useApi';
import type { ModeleSimulationSaisieDto, PropositionPointsDto } from '../../../types/projet';
import { Button } from '../../ui/button';
import FicheModeleSimulation from '../FicheModeleSimulation';
import ModaleAlignementPrevisions from './ModaleAlignementPrevisions';
import ModaleChoixModele from './ModaleChoixModele';

type Fenetre = 'aligner' | 'modele' | null;

/** Boutons Aligner / Appliquer un modèle / Exporter en modèle de la barre de saisie des prévisions (à placer dans une BarreIcones). */
export default function BoutonsAlignementModeles({ lotId, modifie, grilleVide, onProposition, onErreur }: Readonly<{
  lotId: string;
  modifie: boolean;
  grilleVide: boolean;
  onProposition: (p: PropositionPointsDto) => void;
  onErreur: (message: string) => void;
}>) {
  const [fenetre, setFenetre] = useState<Fenetre>(null);
  const [export_, setExport] = useState<ModeleSimulationSaisieDto | null>(null);

  const valide = (p: PropositionPointsDto) => {
    setFenetre(null);
    onProposition(p);
  };

  function aligner() {
    if (modifie) onErreur('Enregistrez d\'abord les modifications.');
    else setFenetre('aligner');
  }

  async function exporter() {
    try {
      setExport(await getModelePropose(lotId));
    } catch (err: unknown) {
      onErreur(errorMessage(err));
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={aligner}><Target /> Aligner les prévisions au réel</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setFenetre('modele')}><ListChecks /> Appliquer un modèle de simulation</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => void exporter()}><FileDown /> Exporter vers modèle de simulation</Button>
      {fenetre === 'aligner' && <ModaleAlignementPrevisions lotId={lotId} onValide={valide} onClose={() => setFenetre(null)} />}
      {fenetre === 'modele' && <ModaleChoixModele lotId={lotId} grilleVide={grilleVide} onValide={valide} onClose={() => setFenetre(null)} />}
      {export_ && <FicheModeleSimulation modele={export_} onClose={() => setExport(null)} onEnregistre={() => setExport(null)} />}
    </>
  );
}
