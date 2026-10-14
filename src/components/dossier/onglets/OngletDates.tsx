import { Field, FieldGrid } from '../../ui';
import { formatDate } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DatesFicheDto, DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

/** Libellés de l'écran OMRAN, dans son ordre (aide l.6665-6687). */
const DATES: { cle: Exclude<keyof DatesFicheDto, 'envoiNotaireConfirme'>; libelle: string }[] = [
  { cle: 'concretisation', libelle: 'Concrétisation' },
  { cle: 'promesseVente', libelle: 'Promesse de vente' },
  { cle: 'visiteTechnique', libelle: 'Visite technique / réception' },
  { cle: 'envoiNotairePrevisionnel', libelle: 'Envoi au notaire prévisionnel' },
  { cle: 'enregistrementContrat', libelle: 'Enregistrement du contrat' },
  { cle: 'envoiNotaire', libelle: 'Envoi au notaire / avocat' },
  { cle: 'minute', libelle: 'Minute / signature du contrat' },
  { cle: 'expedition', libelle: 'Expédition / certificat de propriété' },
  { cle: 'relanceTitreFoncier1', libelle: 'Relance 1 titre foncier' },
  { cle: 'echeanceRelance1', libelle: 'Échéance relance 1' },
  { cle: 'relanceTitreFoncier2', libelle: 'Relance 2 titre foncier' },
  { cle: 'echeanceRelance2', libelle: 'Échéance relance 2' },
  { cle: 'ficheBancaire', libelle: 'Fiche bancaire' },
  { cle: 'compromis', libelle: 'Compromis / approbation crédit' },
  { cle: 'attestation', libelle: 'Attestation de consignation / octroi crédit' },
  { cle: 'intervention', libelle: 'Intervention' },
  { cle: 'assurance', libelle: 'Assurance' },
  { cle: 'remiseClesPrevue', libelle: 'Remise des clés prévue' },
  { cle: 'remiseClesEffective', libelle: 'Remise des clés effective' },
  { cle: 'permisHabiter', libelle: "Permis d'habiter (tranche)" },
  { cle: 'actePrecision', libelle: 'Acte de précision' },
];

function confirme(valeur: boolean | null | undefined): string | undefined {
  if (valeur == null) return undefined;
  return valeur ? 'Oui' : 'Non';
}

export default function OngletDates({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return (
    <ContenuFiche fiche={fiche}>
      {({ dates }) => (
        <FieldGrid>
          {DATES.map(({ cle, libelle }) => (
            <Field key={cle} label={libelle} value={formatDate(dates[cle])} />
          ))}
          <Field label="Envoi au notaire confirmé" value={confirme(dates.envoiNotaireConfirme)} />
        </FieldGrid>
      )}
    </ContenuFiche>
  );
}
