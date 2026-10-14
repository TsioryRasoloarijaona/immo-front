import { Field, FieldGrid } from '../../ui';
import BarreEdition from '../edition/BarreEdition';
import { ChampCase, ChampDate } from '../edition/ChampsSaisie';
import { formatDate } from '../../../lib/format';
import { jourSaisi, useFormulaireEdition, type CleEdition, type ValeursEdition } from '../../../lib/editionDossier';
import type { ApiState } from '../../../lib/useApi';
import type { DatesFicheDto, DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

type CleDate = Exclude<keyof DatesFicheDto, 'envoiNotaireConfirme'>;

/** Libellés de l'écran OMRAN, dans son ordre (aide l.6665-6687) ; `modifiable` = champ de `PATCH /api/dossiers/{id}`. */
const DATES: { cle: CleDate; libelle: string; modifiable: boolean }[] = [
  { cle: 'concretisation', libelle: 'Concrétisation', modifiable: true },
  { cle: 'promesseVente', libelle: 'Promesse de vente', modifiable: true },
  { cle: 'visiteTechnique', libelle: 'Visite technique / réception', modifiable: true },
  { cle: 'envoiNotairePrevisionnel', libelle: 'Envoi au notaire prévisionnel', modifiable: true },
  { cle: 'enregistrementContrat', libelle: 'Enregistrement du contrat', modifiable: true },
  { cle: 'envoiNotaire', libelle: 'Envoi au notaire / avocat', modifiable: true },
  { cle: 'minute', libelle: 'Minute / signature du contrat', modifiable: true },
  { cle: 'expedition', libelle: 'Expédition / certificat de propriété', modifiable: true },
  { cle: 'relanceTitreFoncier1', libelle: 'Relance 1 titre foncier', modifiable: true },
  { cle: 'echeanceRelance1', libelle: 'Échéance relance 1', modifiable: true },
  { cle: 'relanceTitreFoncier2', libelle: 'Relance 2 titre foncier', modifiable: true },
  { cle: 'echeanceRelance2', libelle: 'Échéance relance 2', modifiable: true },
  { cle: 'ficheBancaire', libelle: 'Fiche bancaire', modifiable: true },
  { cle: 'compromis', libelle: 'Compromis / approbation crédit', modifiable: true },
  { cle: 'attestation', libelle: 'Attestation de consignation / octroi crédit', modifiable: true },
  { cle: 'intervention', libelle: 'Intervention', modifiable: true },
  { cle: 'assurance', libelle: 'Assurance', modifiable: true },
  { cle: 'remiseClesPrevue', libelle: 'Remise des clés prévue', modifiable: false },
  { cle: 'remiseClesEffective', libelle: 'Remise des clés effective', modifiable: true },
  { cle: 'permisHabiter', libelle: "Permis d'habiter (tranche)", modifiable: false },
  { cle: 'actePrecision', libelle: 'Acte de précision', modifiable: true },
];

const CLES_DATES = new Set(DATES.filter((d) => d.modifiable).map((d) => d.cle as CleEdition));

function confirme(valeur: boolean | null | undefined): string | undefined {
  if (valeur == null) return undefined;
  return valeur ? 'Oui' : 'Non';
}

function valeursInitiales(dates: DatesFicheDto): ValeursEdition {
  const v: ValeursEdition = { envoiNotaireConfirme: !!dates.envoiNotaireConfirme };
  for (const cle of CLES_DATES) v[cle] = jourSaisi(dates[cle as CleDate]);
  return v;
}

function Dates({ fiche }: Readonly<{ fiche: DossierFicheDto }>) {
  const { dates } = fiche;
  const f = useFormulaireEdition(fiche.id, () => valeursInitiales(dates), CLES_DATES);
  const ouvert = f.edition.ouvert;

  return (
    <>
      <BarreEdition edition={f.edition} visible={f.edition.peut('DATES')} onEnregistrer={f.enregistrer} />
      <FieldGrid>
        {DATES.map(({ cle, libelle, modifiable }) =>
          ouvert && modifiable ? (
            <ChampDate key={cle} label={libelle} value={f.texte(cle as CleEdition)} onChange={(v) => f.changer(cle as CleEdition, v)} />
          ) : (
            <Field key={cle} label={libelle} value={formatDate(dates[cle])} />
          ),
        )}
        {ouvert ? (
          <ChampCase
            label="Envoi au notaire confirmé"
            checked={f.saisi.envoiNotaireConfirme === true}
            onChange={(v) => f.changer('envoiNotaireConfirme', v)}
          />
        ) : (
          <Field label="Envoi au notaire confirmé" value={confirme(dates.envoiNotaireConfirme)} />
        )}
      </FieldGrid>
    </>
  );
}

export default function OngletDates({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return <ContenuFiche fiche={fiche}>{(f) => <Dates fiche={f} />}</ContenuFiche>;
}
