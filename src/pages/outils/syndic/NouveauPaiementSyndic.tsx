import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileText, Plus } from 'lucide-react';
import { Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { lienPdfService, lireExercicesSyndic, listerAppartementsSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { ChoixSimple } from '../virements/CadreVirements';
import { rafraichir } from '../virements/contexte';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import EtapeAppartement from './EtapeAppartement';
import EtapeMontant from './EtapeMontant';
import { lotDe, type Lot } from './lots';
import type { PaiementEnregistre } from './types';

export default function NouveauPaiementSyndic() {
  return <CadreSyndic ecran="Nouveau paiement">{(ctx) => <Saisie ctx={ctx} />}</CadreSyndic>;
}

/** En deux temps (syndic-admod) : quel appartement, puis combien / comment ; une phrase et le reçu à la fin. */
function Saisie({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const [params] = useSearchParams();
  const initial = params.get('appartement');
  const exercicesApi = useApi(lireExercicesSyndic, [ctx.revision]);
  const [choixExercice, setChoixExercice] = useState<string | null>(null);
  const payables = exercicesApi.data?.payables ?? [];
  const parDefaut = exercicesApi.data?.par_defaut ?? null;
  const exercice = choixExercice ?? (parDefaut && payables.includes(parDefaut) ? parDefaut : payables[0] ?? null);

  const appartementsApi = useApi(() => (exercice ? listerAppartementsSyndic(exercice) : Promise.resolve([])), [exercice, ctx.revision]);
  const lots = useMemo(
    () => (exercice ? (appartementsApi.data ?? []).flatMap((a) => lotDe(a, exercice) ?? []) : []),
    [appartementsApi.data, exercice],
  );
  const [choisis, setChoisis] = useState<Lot[] | null>(null);
  const [fait, setFait] = useState<PaiementEnregistre | null>(null);

  function enregistre(r: PaiementEnregistre) {
    setFait(r);
    setChoisis(null);
    rafraichir();
  }

  if (exercicesApi.error) return <ErrorState message={exercicesApi.error} />;
  if (!exercicesApi.data) return <LoadingState />;
  if (!exercice) return <EmptyState title="Aucun exercice ouvert" message="Aucun exercice ne peut recevoir de paiement pour l’instant." />;

  if (fait) {
    return (
      <Card accent="var(--success)">
        <div className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-label text-foreground">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-(--success)" /> {fait.phrase}
          </p>
          <p className="text-body text-muted-foreground">
            Reçu <span className="font-mono">{fait.recu.numero}</span> · {fait.paiements.map((p) => p.numero).join(', ')}
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={lienPdfService(fait.recu.pdf)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'sm' })}>
              <FileText data-icon="inline-start" /> Ouvrir le reçu PDF
            </a>
            <Button type="button" variant="outline" size="sm" onClick={() => setFait(null)}>
              <Plus data-icon="inline-start" /> Un autre paiement
            </Button>
            <Link to="/outils/syndic/paiements" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Voir les paiements
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {payables.length > 1 && !choisis && (
        <ChoixSimple
          items={payables.map((e) => ({ value: e, label: `Exercice ${e}` }))}
          value={exercice}
          onChange={setChoixExercice}
          className="w-52"
        />
      )}
      {appartementsApi.error && <ErrorState message={appartementsApi.error} />}
      {!appartementsApi.error && !appartementsApi.data && <LoadingState />}
      {!appartementsApi.error && appartementsApi.data && !choisis && (
        <EtapeAppartement key={exercice} lots={lots} initial={initial} onValider={setChoisis} />
      )}
      {choisis && <EtapeMontant lots={choisis} onRetour={() => setChoisis(null)} onEnregistre={enregistre} />}
    </div>
  );
}
