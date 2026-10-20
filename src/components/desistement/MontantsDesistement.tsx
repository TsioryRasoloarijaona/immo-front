import { Field, FieldGrid } from '../ui';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { DesistementDto } from '../../types';

type Montants = Pick<
  DesistementDto,
  'prixVente' | 'totalRegle' | 'taux' | 'remise' | 'penaliteApresRemise' | 'resteFraisARegler' | 'aRembourser'
>;

/** Pénalité, reste des frais et somme à rembourser : ceux de la simulation ou ceux enregistrés. */
export default function MontantsDesistement({ montants: m }: Readonly<{ montants: Montants }>) {
  return (
    <FieldGrid>
      <Field label="Prix de vente" value={formatCurrency(m.prixVente)} />
      <Field label="Total réglé" value={formatCurrency(m.totalRegle)} />
      <Field label="Taux de pénalité" value={formatPercent(m.taux, 2)} />
      <Field label="Remise sur la pénalité" value={formatPercent(m.remise, 2)} />
      <Field label="Pénalité après remise" value={formatCurrency(m.penaliteApresRemise)} />
      <Field label="Reste des frais à régler" value={formatCurrency(m.resteFraisARegler)} />
      <Field label="À rembourser" value={<span className="font-semibold">{formatCurrency(m.aRembourser)}</span>} />
    </FieldGrid>
  );
}
