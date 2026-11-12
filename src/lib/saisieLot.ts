import { useState } from 'react';
import type { LotDetailDto, ModifierLotRequest } from '../types/projet';

/** Les 12 dates contrôlées, dans l'ordre exigé par le serveur (chaque date ≥ celles qui la précèdent). */
export const DATES_LOT = [
  ['dateLancementAppelOffres', "Lancement de l'appel d'offres"],
  ['dateRetraitDossiers', 'Retrait des dossiers'],
  ['dateEcheanceRemiseOffres', 'Échéance de remise des offres'],
  ['dateReportAppelOffres', "Report de l'appel d'offres"],
  ['dateOuverturePlis', 'Ouverture des plis'],
  ['dateRapportDepouillement', 'Rapport de dépouillement'],
  ['dateAdjudication', 'Adjudication'],
  ['dateSignatureMarche', 'Signature du marché'],
  ['dateOrdreService', 'Ordre de service'],
  ['dateLancementTravaux', 'Lancement des travaux'],
  ['dateAchevementTravaux', 'Achèvement des travaux'],
  ['dateRecollement', 'Recollement'],
] as const satisfies readonly (readonly [keyof ModifierLotRequest, string])[];

export type CleDateLot = (typeof DATES_LOT)[number][0];

export type CleChamp =
  | CleDateLot
  | 'description' | 'fournisseurId' | 'categorieId' | 'typeId' | 'dureeGarantieMois'
  | 'remiseSurTravauxSupp' | 'retenueSurTravauxSupp' | 'saisieSurQuantites' | 'avancementParLigne' | 'restitutionGarantieBloquee'
  | 'variationMassePct' | 'tauxRemboursementApproPct' | 'totalPoints'
  | 'tauxAvancePct' | 'tauxRetenueGarantiePct' | 'tauxCompteProrataPct' | 'tauxAssuranceDECPct' | 'montantAssuranceDEC'
  | 'tauxAssuranceTRCPct' | 'montantAssuranceTRC' | 'tvaDefautPct' | 'delaiPaiementJours'
  | 'montantForfaitaireHT' | 'montantForfaitaireTTC' | 'dateDebutBase' | 'delaiBaseJours' | 'dateFinBase'
  | 'dateResiliation' | 'causeResiliation' | 'descriptionDetaillee' | 'notes';

/** Champs saisissables de la fiche (L2a), mêmes noms que le corps du PATCH. */
export type ChampsLot = { [K in CleChamp]: ModifierLotRequest[K] | null };

export type CleNombre = { [K in CleChamp]: ChampsLot[K] extends number | null ? K : never }[CleChamp];

export interface PropsOnglet {
  champs: ChampsLot;
  maj: <K extends CleChamp>(cle: K, valeur: ChampsLot[K]) => void;
  lectureSeule: boolean;
}

export function champsDepuis(lot: LotDetailDto): ChampsLot {
  return {
    description: lot.description,
    fournisseurId: lot.fournisseurId,
    categorieId: lot.categorieId,
    typeId: lot.typeId,
    dureeGarantieMois: lot.garantieMois,
    dateLancementAppelOffres: lot.dateLancementAppelOffres,
    dateRetraitDossiers: lot.dateRetraitDossiers,
    dateEcheanceRemiseOffres: lot.dateEcheanceRemiseOffres,
    dateReportAppelOffres: lot.dateReportAppelOffres,
    dateOuverturePlis: lot.dateOuverturePlis,
    dateRapportDepouillement: lot.dateRapportDepouillement,
    dateAdjudication: lot.dateAdjudication,
    dateSignatureMarche: lot.dateSignatureMarche,
    dateOrdreService: lot.dateOrdreService,
    dateLancementTravaux: lot.dateLancementTravaux,
    dateAchevementTravaux: lot.dateAchevementTravaux,
    dateRecollement: lot.dateRecollement,
    remiseSurTravauxSupp: lot.remiseSurTravauxSupp,
    retenueSurTravauxSupp: lot.retenueSurTravauxSupp,
    saisieSurQuantites: lot.saisieSurQuantites,
    avancementParLigne: lot.avancementParLigne,
    restitutionGarantieBloquee: lot.restitutionGarantieBloquee,
    variationMassePct: lot.variationMassePct,
    tauxRemboursementApproPct: lot.tauxRemboursementApproPct,
    totalPoints: lot.totalPoints,
    tauxAvancePct: lot.tauxAvance,
    tauxRetenueGarantiePct: lot.tauxRetenueGarantie,
    tauxCompteProrataPct: lot.tauxCompteProrata,
    tauxAssuranceDECPct: lot.tauxAssuranceDEC,
    montantAssuranceDEC: null, // absent du détail : saisie seulement
    tauxAssuranceTRCPct: lot.tauxAssuranceTRC,
    montantAssuranceTRC: null,
    tvaDefautPct: lot.tvaDefaut,
    delaiPaiementJours: lot.delaiPaiementJours,
    montantForfaitaireHT: lot.montantForfaitaireHT,
    montantForfaitaireTTC: lot.montantForfaitaireTTC,
    dateDebutBase: lot.dateDebutBase,
    delaiBaseJours: lot.delaiBaseJours,
    dateFinBase: lot.dateFinBase,
    dateResiliation: lot.dateResiliation,
    causeResiliation: lot.causeResiliation,
    descriptionDetaillee: lot.descriptionDetaillee,
    notes: lot.notes,
  };
}

/** Corps du PATCH : seulement les champs modifiés (absent = inchangé). */
export function changements(initial: ChampsLot, courant: ChampsLot): Partial<ModifierLotRequest> {
  const corps: Record<string, unknown> = {};
  for (const cle of Object.keys(courant) as CleChamp[]) {
    if (initial[cle] !== courant[cle]) corps[cle] = courant[cle];
  }
  return corps;
}

export function useChampsLot(lot: LotDetailDto) {
  const [initial, setInitial] = useState(() => champsDepuis(lot));
  const [champs, setChamps] = useState(initial);
  const maj: PropsOnglet['maj'] = (cle, valeur) => setChamps((c) => ({ ...c, [cle]: valeur }));
  const corps = changements(initial, champs);
  const reinitialiser = (source: LotDetailDto) => {
    const nouveau = champsDepuis(source);
    setInitial(nouveau);
    setChamps(nouveau);
  };
  return { champs, maj, corps, modifie: Object.keys(corps).length > 0, reinitialiser };
}
