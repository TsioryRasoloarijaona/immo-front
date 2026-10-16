import { useState } from 'react';
import DossierStatusStepper from '../../DossierStatusStepper';
import { ErrorState, Field, FieldGrid } from '../../ui';
import { Button } from '../../ui/button';
import type { ConfirmerStatut } from '../ConfirmationStatut';
import { getTransitionSuggeree } from '../../../lib/api';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { formatDate, formatNumber } from '../../../lib/format';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { DossierDetailDto, DossierFicheDto, EtapeSuivanteDto, TransitionSuggereeDto } from '../../../types';

// `null` = jalon non atteint, pas zéro : `undefined` laisse `Field` afficher son tiret.
function formatJours(jours: number | null | undefined) {
  return typeof jours === 'number' ? `${formatNumber(jours)} j` : undefined;
}

/** Passage automatique proposé par le serveur (seuil de versement du statut cible atteint). */
function SuggestionPassage({
  suggestion,
  onConfirm,
}: Readonly<{ suggestion: TransitionSuggereeDto; onConfirm: ConfirmerStatut }>) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const statut = suggestion.statut;
  if (!statut) return null;

  async function passer(cible: string) {
    setEnvoi(true);
    setErreur(null);
    try {
      await onConfirm(cible, '', suggestion.date?.slice(0, 10));
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2 text-micro text-(--info)">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          Le seuil de versement est atteint : le dossier peut passer au statut{' '}
          <strong>{canonicalStatusLabel(statut)}</strong>
          {suggestion.date && <> (dernier règlement le {formatDate(suggestion.date)})</>}.
        </span>
        <Button type="button" size="sm" disabled={envoi} onClick={() => void passer(statut)}>
          Passer au statut {canonicalStatusLabel(statut)}
        </Button>
      </div>
      {erreur && <p role="alert" className="whitespace-pre-line text-destructive">{erreur}</p>}
    </div>
  );
}

export default function OngletStatut({
  dossier: d,
  fiche,
  etapesSuivantes,
  erreurEtapes,
  onConfirm,
}: Readonly<{
  dossier: DossierDetailDto;
  fiche: DossierFicheDto | null;
  etapesSuivantes: EtapeSuivanteDto[];
  /** Échec de `etapes-suivantes` : ne pas le confondre avec « aucune transition pour vos rôles ». */
  erreurEtapes?: string | null;
  onConfirm: ConfirmerStatut;
}>) {
  // `fiche` est relue après un règlement ou un enregistrement : la proposition l'est avec elle.
  const suggestion = useApi(() => getTransitionSuggeree(d.id), [d.id, d.statut, fiche]);

  return (
    <div className="p-3">
      {!suggestion.error && suggestion.data && <SuggestionPassage suggestion={suggestion.data} onConfirm={onConfirm} />}
      {erreurEtapes ? (
        <ErrorState message={erreurEtapes} />
      ) : (
        <DossierStatusStepper currentStatus={d.statut || 'Réservation'} nextSteps={etapesSuivantes} onConfirm={onConfirm} />
      )}
      {/* Délais calculés par le serveur, souvent nuls : tiret plutôt que ligne
          masquée, une case vide dit « pas encore atteint ». */}
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="mb-2 text-micro font-medium text-muted-foreground">Jalons et délais</h3>
        <FieldGrid>
          {/* `dateCompromis` porte `AgreementDate`, la date d'envoi au notaire ; le compromis
              (approbation du crédit) vient de la fiche. */}
          <Field label="Compromis / approbation crédit" value={formatDate(fiche?.dates.compromis)} />
          <Field label="Envoi au notaire" value={formatDate(d.dateCompromis)} />
          <Field label="Livraison réelle" value={formatDate(d.dateLivraisonReelle)} />
          <Field label="Délai de concrétisation" value={formatJours(d.delaiConcretisation)} />
          <Field label="Délai notaire" value={formatJours(d.delaiNotaire)} />
          <Field label="Délai de livraison" value={formatJours(d.delaiLivraison)} />
        </FieldGrid>
      </div>
    </div>
  );
}
