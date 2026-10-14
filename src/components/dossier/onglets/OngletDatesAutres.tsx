import { Field, FieldGrid } from '../../ui';
import { formatDate } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DatesAutresFicheDto, DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

type CleDate = Exclude<keyof DatesAutresFicheDto, 'numeroTitre'>;

/** Regroupées par acte, comme l'onglet « Dates autres » de l'écran OMRAN. */
const GROUPES: { titre: string; dates: { cle: CleDate; libelle: string }[] }[] = [
  {
    titre: 'Promesse de vente',
    dates: [
      { cle: 'promesseClient', libelle: 'Promesse de vente client' },
      { cle: 'promesseEnregistrement', libelle: 'Enregistrement de la réservation' },
      { cle: 'impressionContrat', libelle: 'Impression contrat réservation / promesse' },
    ],
  },
  {
    titre: 'Minute / signature du contrat',
    dates: [
      { cle: 'minuteClient', libelle: 'Signature client' },
      { cle: 'minuteAvocat', libelle: 'Signature avocat' },
      { cle: 'minuteRemiseLegalisation', libelle: 'Remise pour légalisation' },
      { cle: 'minuteLegalisation', libelle: 'Légalisation' },
      { cle: 'minuteDepotEnregistrement', libelle: 'Dépôt pour enregistrement' },
    ],
  },
  {
    titre: 'Remise des clés',
    dates: [
      { cle: 'remiseClesClient', libelle: 'Remise des clés client' },
      { cle: 'remiseClesEnregistrement', libelle: 'Enregistrement remise des clés' },
    ],
  },
  {
    titre: 'Acte de précision',
    dates: [
      { cle: 'actePrecisionClient', libelle: 'Acte de précision client' },
      { cle: 'actePrecisionAvocat', libelle: 'Acte de précision avocat' },
      { cle: 'actePrecisionRemiseLegalisation', libelle: 'Remise pour légalisation' },
      { cle: 'actePrecisionLegalisation', libelle: 'Légalisation' },
      { cle: 'actePrecisionDepotEnregistrement', libelle: 'Dépôt pour enregistrement' },
      { cle: 'actePrecisionEnregistrement', libelle: 'Enregistrement' },
    ],
  },
  {
    titre: 'Conservation foncière (CPF)',
    dates: [
      { cle: 'cpfDepot', libelle: 'Dépôt à la CPF' },
      { cle: 'cpfRetrait', libelle: 'Retrait du dossier client de la CPF' },
      { cle: 'remiseCertificatPropriete', libelle: 'Remise du certificat de propriété au client' },
    ],
  },
];

export default function OngletDatesAutres({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return (
    <ContenuFiche fiche={fiche}>
      {({ datesAutres }) => (
        <>
          {GROUPES.map((g) => (
            <section key={g.titre}>
              <h3 className="mb-2 text-micro font-medium text-muted-foreground">{g.titre}</h3>
              <FieldGrid>
                {g.dates.map(({ cle, libelle }) => (
                  <Field key={cle} label={libelle} value={formatDate(datesAutres[cle])} />
                ))}
                {g.titre.startsWith('Conservation') && <Field label="N° de titre" value={datesAutres.numeroTitre} />}
              </FieldGrid>
            </section>
          ))}
        </>
      )}
    </ContenuFiche>
  );
}
