import { Field, FieldGrid } from '../../ui';
import LienDesistement from '../../desistement/LienDesistement';
import BarreEdition from '../edition/BarreEdition';
import { ChampDate, ChampTexte } from '../edition/ChampsSaisie';
import { formatDate } from '../../../lib/format';
import { jourSaisi, useFormulaireEdition, type CleEdition, type ValeursEdition } from '../../../lib/editionDossier';
import type { ApiState } from '../../../lib/useApi';
import type { AnnulationFicheDto, DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

const CLES_DATES: ReadonlySet<CleEdition> = new Set<CleEdition>(['annulationDate']);

function valeursInitiales(a: AnnulationFicheDto): ValeursEdition {
  return { annulationDate: jourSaisi(a.date), annulationCauses: a.causes ?? '' };
}

/** Seul onglet modifiable sur un dossier annulé ou désisté (409 ailleurs). */
function Annulation({ fiche, dossierId }: Readonly<{ fiche: DossierFicheDto; dossierId: string }>) {
  const { annulation } = fiche;
  const f = useFormulaireEdition(fiche, () => valeursInitiales(annulation), CLES_DATES);

  return (
    <>
      <LienDesistement dossierId={dossierId} />
      <BarreEdition edition={f.edition} visible={f.edition.peut('ANNULATION')} onEnregistrer={f.enregistrer} />
      {f.edition.ouvert ? (
        <FieldGrid>
          <ChampDate
            label="Annulation / résiliation"
            value={f.texte('annulationDate')}
            onChange={(v) => f.changer('annulationDate', v)}
          />
          <ChampTexte
            label="Causes"
            value={f.texte('annulationCauses')}
            maxLength={1000}
            multiligne
            onChange={(v) => f.changer('annulationCauses', v)}
          />
        </FieldGrid>
      ) : (
        <FieldGrid>
          <Field label="Annulation / résiliation" value={formatDate(annulation.date)} />
          <Field label="Causes" value={annulation.causes} />
        </FieldGrid>
      )}
    </>
  );
}

export default function OngletAnnulation({
  fiche,
  dossierId,
}: Readonly<{ fiche: ApiState<DossierFicheDto>; dossierId: string }>) {
  return <ContenuFiche fiche={fiche}>{(f) => <Annulation fiche={f} dossierId={dossierId} />}</ContenuFiche>;
}
