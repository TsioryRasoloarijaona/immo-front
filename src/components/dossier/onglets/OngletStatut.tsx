import DossierStatusStepper from '../../DossierStatusStepper';
import { Field, FieldGrid } from '../../ui';
import { formatDate, formatNumber } from '../../../lib/format';
import type { DossierDetailDto, DossierFicheDto, EtapeSuivanteDto } from '../../../types';

// `null` = jalon non atteint, pas zéro : `undefined` laisse `Field` afficher son tiret.
function formatJours(jours: number | null | undefined) {
  return typeof jours === 'number' ? `${formatNumber(jours)} j` : undefined;
}

export default function OngletStatut({
  dossier: d,
  fiche,
  etapesSuivantes,
  onConfirm,
}: Readonly<{
  dossier: DossierDetailDto;
  fiche: DossierFicheDto | null;
  etapesSuivantes: EtapeSuivanteDto[];
  onConfirm: (statut: string, note: string, date?: string) => void;
}>) {
  return (
    <div className="p-3">
      <DossierStatusStepper currentStatus={d.statut || 'Réservation'} nextSteps={etapesSuivantes} onConfirm={onConfirm} />
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
