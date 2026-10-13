import { Field, FieldGrid } from '../../ui';
import { formatDate } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DossierFicheDto } from '../../../types';
import ContenuFiche from './ContenuFiche';

function ouiNon(valeur: boolean | null | undefined): string {
  return valeur ? 'Oui' : 'Non';
}

/** Onglet « Autres » de l'écran OMRAN (aide l.6692-6703), en lecture seule. */
export default function OngletAutres({ fiche }: Readonly<{ fiche: ApiState<DossierFicheDto> }>) {
  return (
    <ContenuFiche fiche={fiche}>
      {({ autres: a }) => (
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
      )}
    </ContenuFiche>
  );
}
