import { Field, FieldGrid } from '../../ui';
import AutresEdition from '../edition/AutresEdition';
import BarreEdition from '../edition/BarreEdition';
import { listDecisionsMeilleurTaux } from '../../../lib/apiEdition';
import { formatDate } from '../../../lib/format';
import { jourSaisi, useFormulaireEdition, type CleEdition, type ValeursEdition } from '../../../lib/editionDossier';
import { useApi, type ApiState } from '../../../lib/useApi';
import type { AutresFicheDto, DossierFicheDto } from '../../../types';
import type { GroupeEdition } from '../../../types/edition';
import ContenuFiche from './ContenuFiche';

const GROUPES_AUTRES: GroupeEdition[] = ['CLIENT', 'COMMERCIAL', 'GESTIONNAIRES', 'NOTAIRE', 'CREDIT', 'OPTIONS', 'PENALITES', 'PRIX', 'NOTE'];
const CLES_DATES: ReadonlySet<CleEdition> = new Set<CleEdition>(['meilleurTauxEnvoi', 'meilleurTauxDecisionDate']);

function ouiNon(valeur: boolean | null | undefined): string {
  return valeur ? 'Oui' : 'Non';
}

function valeursInitiales(a: AutresFicheDto): ValeursEdition {
  return {
    clientId: '',
    commercialId: a.commercialId ?? '',
    gestionnaire1Id: a.gestionnaire1Id ?? '',
    gestionnaire2Id: a.gestionnaire2Id ?? '',
    notaireId: a.notaireId ?? '',
    banqueCreditId: a.banqueCreditId ?? '',
    agenceCredit: a.agenceCredit ?? '',
    meilleurTauxEnvoi: jourSaisi(a.meilleurTauxEnvoi),
    meilleurTauxDecisionId: a.meilleurTauxDecisionId ?? '',
    meilleurTauxDecisionDate: jourSaisi(a.meilleurTauxDecisionDate),
    ancienClient: !!a.ancienClient,
    cadeauPlusTard: !!a.cadeauPlusTard,
    integrerModificationsAuPrix: !!a.integrerModificationsAuPrix,
    penalitesDesactivees: !!a.penalitesDesactivees,
    note: a.note ?? '',
  };
}

function Lecture({ a }: Readonly<{ a: AutresFicheDto }>) {
  return (
    <>
      <FieldGrid>
        <Field label="Gestionnaire 1" value={a.gestionnaire1Nom} />
        <Field label="Gestionnaire 2" value={a.gestionnaire2Nom} />
        <Field label="Banque crédit / leasing" value={a.banqueCreditNom} />
        <Field label="Agence de crédit" value={a.agenceCredit} />
        <Field label="Notaire / avocat" value={a.notaireNom} />
      </FieldGrid>
      <FieldGrid>
        <Field label="C'est un ancien client" value={ouiNon(a.ancienClient)} />
        <Field label="Cadeau choisi plus tard" value={ouiNon(a.cadeauPlusTard)} />
        <Field label="Modifications intégrées au prix" value={ouiNon(a.integrerModificationsAuPrix)} />
        <Field label="Pénalités désactivées" value={ouiNon(a.penalitesDesactivees)} />
      </FieldGrid>
      <FieldGrid>
        <Field label="Envoi MEILLEURTAUX" value={formatDate(a.meilleurTauxEnvoi)} />
        <Field label="Décision MEILLEURTAUX" value={a.meilleurTauxDecision} />
        <Field label="Date décision MEILLEURTAUX" value={formatDate(a.meilleurTauxDecisionDate)} />
      </FieldGrid>
      {a.note && (
        <div>
          <div className="mb-0 text-micro font-medium text-muted-foreground">Note</div>
          <p className="whitespace-pre-wrap text-label text-foreground">{a.note}</p>
        </div>
      )}
    </>
  );
}

function Autres({ fiche }: Readonly<{ fiche: DossierFicheDto }>) {
  const decisions = useApi(() => listDecisionsMeilleurTaux(), [], 'decisions-meilleurtaux');
  const f = useFormulaireEdition(fiche, () => valeursInitiales(fiche.autres), CLES_DATES);
  const visible = GROUPES_AUTRES.some((g) => f.edition.peut(g));

  return (
    <>
      <BarreEdition edition={f.edition} visible={visible} onEnregistrer={f.enregistrer} />
      {f.edition.ouvert ? <AutresEdition f={f} decisions={decisions.data ?? []} /> : <Lecture a={fiche.autres} />}
    </>
  );
}

/** Onglet « Autres » de l'écran OMRAN (aide l.6692-6703). */
export default function OngletAutres({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return <ContenuFiche fiche={fiche}>{(f) => <Autres fiche={f} />}</ContenuFiche>;
}
