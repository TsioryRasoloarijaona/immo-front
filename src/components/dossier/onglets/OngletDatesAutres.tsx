import { Field, FieldGrid } from '../../ui';
import BarreEdition from '../edition/BarreEdition';
import { ChampDate, ChampTexte } from '../edition/ChampsSaisie';
import { formatDate } from '../../../lib/format';
import { jourSaisi, useFormulaireEdition, type CleEdition, type ValeursEdition } from '../../../lib/editionDossier';
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

const CLES_DATES = new Set(GROUPES.flatMap((g) => g.dates.map((d) => d.cle as CleEdition)));

function valeursInitiales(d: DatesAutresFicheDto): ValeursEdition {
  const v: ValeursEdition = { numeroTitre: d.numeroTitre ?? '' };
  for (const cle of CLES_DATES) v[cle] = jourSaisi(d[cle as CleDate]);
  return v;
}

function DatesAutres({ fiche }: Readonly<{ fiche: DossierFicheDto }>) {
  const { datesAutres } = fiche;
  const f = useFormulaireEdition(fiche.id, () => valeursInitiales(datesAutres), CLES_DATES);
  const ouvert = f.edition.ouvert;

  return (
    <>
      <BarreEdition edition={f.edition} visible={f.edition.peut('DATES')} onEnregistrer={f.enregistrer} />
      {GROUPES.map((g) => (
        <section key={g.titre}>
          <h3 className="mb-2 text-micro font-medium text-muted-foreground">{g.titre}</h3>
          <FieldGrid>
            {g.dates.map(({ cle, libelle }) =>
              ouvert ? (
                <ChampDate key={cle} label={libelle} value={f.texte(cle)} onChange={(v) => f.changer(cle, v)} />
              ) : (
                <Field key={cle} label={libelle} value={formatDate(datesAutres[cle])} />
              ),
            )}
            {g.titre.startsWith('Conservation') && (
              <NumeroTitre ouvert={ouvert} valeur={datesAutres.numeroTitre} saisi={f.texte('numeroTitre')} onChange={(v) => f.changer('numeroTitre', v)} />
            )}
          </FieldGrid>
        </section>
      ))}
    </>
  );
}

function NumeroTitre({
  ouvert,
  valeur,
  saisi,
  onChange,
}: Readonly<{ ouvert: boolean; valeur?: string | null; saisi: string; onChange: (v: string) => void }>) {
  if (!ouvert) return <Field label="N° de titre" value={valeur} />;
  return <ChampTexte label="N° de titre" value={saisi} maxLength={255} onChange={onChange} />;
}

export default function OngletDatesAutres({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return <ContenuFiche fiche={fiche}>{(f) => <DatesAutres fiche={f} />}</ContenuFiche>;
}
