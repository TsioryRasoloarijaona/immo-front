import { Field, FieldGrid } from '../../ui';
import { formatDate } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

export default function OngletAnnulation({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return (
    <ContenuFiche fiche={fiche}>
      {({ annulation }) => (
        <FieldGrid>
          <Field label="Annulation / résiliation" value={formatDate(annulation.date)} />
          <Field label="Causes" value={annulation.causes} />
        </FieldGrid>
      )}
    </ContenuFiche>
  );
}
