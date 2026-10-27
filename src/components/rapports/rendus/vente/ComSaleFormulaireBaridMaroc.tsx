import type { RenduSpecifique } from '../../RenduSpecifique';
import BoutonImprimerFormulaires from '../../BoutonImprimerFormulaires';

const rendu: RenduSpecifique = ({ valeurs, resultat, sectionParDefaut }) => (
  <div className="flex flex-col gap-3">
    <BoutonImprimerFormulaires valeurs={valeurs} vide={resultat.sections.every((s) => s.lignes.length === 0)} />
    {resultat.sections.map(sectionParDefaut)}
  </div>
);

export default rendu;
