import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card, ErrorState, LoadingState } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { listerAppartementsSyndic, ouvrirExerciceSyndic, proposerExerciceSyndic } from '../../../lib/syndic';
import { useApi, useDebouncedValue } from '../../../lib/useApi';
import { ChoixSimple } from '../virements/CadreVirements';
import { rafraichir } from '../virements/contexte';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import ChampsPeriode from './ChampsPeriode';
import { montantPourSaisie, periodeLue, type Periode } from './periode';
import { codeNormalise, texteErreur } from './donnees';
import ApercuExercice from './ApercuExercice';
import type { ExerciceOuvert } from './types';

const TOUS = 'TOUS';

export default function OuvrirExerciceSyndic() {
  return <CadreSyndic ecran="Ouvrir un exercice">{(ctx) => <Saisie ctx={ctx} />}</CadreSyndic>;
}

/** Syndic-admod `exercices/nouveau` : le nouvel exercice démarre à zéro, l'ancien reste intact avec ses paiements. */
function Saisie({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const [params] = useSearchParams();
  const [cible, setCible] = useState(() => (params.get('appartement') ? codeNormalise(params.get('appartement') ?? '') : TOUS));
  const appartementsApi = useApi(() => listerAppartementsSyndic(), [ctx.revision]);
  const items = useMemo(
    () => [{ value: TOUS, label: 'Tous les appartements' }, ...(appartementsApi.data ?? []).map((a) => ({ value: a.code, label: a.code }))],
    [appartementsApi.data],
  );
  const [fait, setFait] = useState<ExerciceOuvert | null>(null);

  if (appartementsApi.error) return <ErrorState message={appartementsApi.error} />;
  if (!appartementsApi.data) return <LoadingState />;
  if (fait) return <Resultat fait={fait} cible={cible} onAutre={() => setFait(null)} />;

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Link to={cible === TOUS ? '/outils/syndic/appartements' : `/outils/syndic/appartements/${encodeURIComponent(cible)}`} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'self-start' })}>
        <ArrowLeft data-icon="inline-start" /> Revenir
      </Link>
      <Card title="Ouvrir un exercice">
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="sy-ex-cible">Pour quel appartement ?</FieldLabel>
            <ChoixSimple id="sy-ex-cible" items={items} value={cible} onChange={setCible} className="sm:w-72" />
          </FormField>
          <FormulairePeriode key={cible} cible={cible} onOuvert={setFait} />
        </FieldGroup>
      </Card>
    </div>
  );
}

/** Monté par lot choisi : les valeurs proposées (lendemain du dernier exercice, tarif des réglages) repartent de zéro. */
function FormulairePeriode({ cible, onOuvert }: Readonly<{ cible: string; onOuvert: (r: ExerciceOuvert) => void }>) {
  const [periode, setPeriode] = useState<Periode | null>(null);
  const saisie = useDebouncedValue(periode, 300);
  const appartement = cible === TOUS ? undefined : cible;
  const propositionApi = useApi(
    () => proposerExerciceSyndic({ appartement, debut: saisie?.debut, duree_mois: saisie?.duree, tarif_mensuel: saisie?.tarif }),
    [appartement, saisie],
  );
  const proposition = propositionApi.data;
  // Premières valeurs : celles que propose le service.
  if (periode === null && proposition) {
    setPeriode({ debut: proposition.debut, duree: String(proposition.duree_mois), tarif: montantPourSaisie(proposition.tarif_mensuel) });
  }
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours || !periode) return;
    const lue = periodeLue(periode);
    if (lue.erreur !== null) return setErreur(lue.erreur);
    setEnCours(true);
    setErreur(null);
    try {
      const r = await ouvrirExerciceSyndic(appartement ? { appartement } : { tous: true }, lue.periode);
      rafraichir();
      onOuvert(r);
    } catch (err) {
      setErreur(texteErreur(err));
      setEnCours(false);
    }
  }

  if (!periode) return propositionApi.error ? <ErrorState message={propositionApi.error} /> : <LoadingState />;
  return (
    <form onSubmit={envoyer} autoComplete="off" noValidate className="flex flex-col gap-3">
      <ChampsPeriode prefixe="sy-ex" valeur={periode} onChange={setPeriode} />
      <ApercuExercice proposition={proposition} erreur={propositionApi.error} tous={!appartement} />
      {erreur && (
        <p role="alert" className="text-body text-destructive">
          {erreur}
        </p>
      )}
      <Button type="submit" className="self-start" disabled={enCours}>
        {enCours ? 'Ouverture…' : 'Ouvrir l’exercice'}
      </Button>
    </form>
  );
}

function Resultat({ fait, cible, onAutre }: Readonly<{ fait: ExerciceOuvert; cible: string; onAutre: () => void }>) {
  const fiche = cible === TOUS ? '/outils/syndic/appartements' : `/outils/syndic/appartements/${encodeURIComponent(cible)}`;
  return (
    <Card accent="var(--success)">
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-label text-foreground">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-(--success)" /> {fait.phrase}
        </p>
        {fait.ignores.length > 0 && (
          <ul className="list-inside list-disc text-body text-muted-foreground">
            {fait.ignores.map((i) => (
              <li key={i.appartement}>
                <span className="font-mono">{i.appartement}</span> — {i.raison}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to={fiche} className={buttonVariants({ size: 'sm' })}>
            {cible === TOUS ? 'Voir les appartements' : `Voir ${cible}`}
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={onAutre}>
            Ouvrir un autre exercice
          </Button>
        </div>
      </div>
    </Card>
  );
}
