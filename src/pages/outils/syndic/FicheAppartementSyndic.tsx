import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, FileText, Pencil, Plus } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { formatCurrency, formatDate } from '../../../lib/format';
import { lienRecuSyndic, lireAppartementSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import { useNotification } from '../virements/useNotification';
import CadreSyndic from './CadreSyndic';
import { MODE_PAIEMENT, PASTILLE } from './donnees';
import ExerciceDialog from './ExerciceDialog';
import InfosAppartementDialog from './InfosAppartementDialog';
import ProprietairesAppartement from './ProprietairesAppartement';
import type { Appartement, ExerciceAppartement } from './types';

export default function FicheAppartementSyndic() {
  const { code = '' } = useParams();
  return <CadreSyndic ecran={code}>{(ctx) => <Fiche key={code} code={code} revision={ctx.revision} />}</CadreSyndic>;
}

function Fiche({ code, revision }: Readonly<{ code: string; revision: number }>) {
  const { data, error } = useApi(() => lireAppartementSyndic(code), [code, revision]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <Contenu appartement={data} />;
}

type Edition = { quoi: 'infos' } | { quoi: 'exercice'; exercice: ExerciceAppartement } | null;

function Contenu({ appartement: a }: Readonly<{ appartement: Appartement }>) {
  // Phrase de la création (NouvelAppartementSyndic la passe dans l'état de navigation).
  const etat = useLocation().state as { phrase?: string } | null;
  const toasts = useNotification();
  const [edition, setEdition] = useState<Edition>(null);
  const notifier = (phrase: string, erreur?: boolean) => toasts.notifier(phrase, erreur ? 'erreur' : 'succes');
  const lienExercice = `/outils/syndic/exercices/nouveau?appartement=${encodeURIComponent(a.code)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/outils/syndic/appartements" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft data-icon="inline-start" /> Appartements
        </Link>
        <Badge tone={PASTILLE[a.pastille].ton}>{PASTILLE[a.pastille].libelle}</Badge>
        <span className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEdition({ quoi: 'infos' })}>
            <Pencil data-icon="inline-start" /> Modifier l’appartement
          </Button>
          <Link to={lienExercice} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <CalendarPlus data-icon="inline-start" /> Ouvrir un exercice
          </Link>
          <Link to={`/outils/syndic/paiement/nouveau?appartement=${encodeURIComponent(a.code)}`} className={buttonVariants({ size: 'sm' })}>
            <Plus data-icon="inline-start" /> Enregistrer un paiement
          </Link>
        </span>
      </div>
      {etat?.phrase && <p className="text-body text-(--success)">{etat.phrase}</p>}

      <ProprietairesAppartement appartement={a} onPhrase={notifier} />

      <Card title="L’appartement">
        <FieldGrid>
          <Field label="N° de dossier" value={a.numero_dossier} />
          <Field label="Date du contrat" value={formatDate(a.date_contrat)} />
          <Field label="Remise des clés" value={formatDate(a.date_remise_cles)} />
        </FieldGrid>
      </Card>

      {a.exercices.length === 0 ? (
        <EmptyState
          title="Aucun exercice"
          message="Tant que son exercice n’est pas ouvert, aucun paiement ne peut être enregistré."
          action={
            <Link to={lienExercice} className={buttonVariants({ size: 'sm' })}>
              <CalendarPlus data-icon="inline-start" /> Ouvrir son exercice
            </Link>
          }
        />
      ) : (
        a.exercices.map((e) => <CarteExercice key={e.id} exercice={e} onCorriger={() => setEdition({ quoi: 'exercice', exercice: e })} />)
      )}

      {edition?.quoi === 'infos' && <InfosAppartementDialog appartement={a} onClose={() => setEdition(null)} onPhrase={notifier} />}
      {edition?.quoi === 'exercice' && <ExerciceDialog code={a.code} exercice={edition.exercice} onClose={() => setEdition(null)} onPhrase={notifier} />}
      {toasts.noeud}
    </div>
  );
}

function CarteExercice({ exercice: e, onCorriger }: Readonly<{ exercice: ExerciceAppartement; onCorriger: () => void }>) {
  const s = e.situation;
  const titre = (
    <span className="flex flex-wrap items-center gap-2">
      Exercice {e.label}
      <Badge tone={PASTILLE[s.pastille].ton}>{PASTILLE[s.pastille].libelle}</Badge>
      {e.repris_en_bloc && <Badge tone="neutral">Repris en bloc</Badge>}
    </span>
  );
  // Un exercice repris en bloc ne se modifie pas.
  const action = e.repris_en_bloc ? undefined : (
    <Button type="button" variant="ghost" size="sm" onClick={onCorriger}>
      <Pencil data-icon="inline-start" /> Corriger
    </Button>
  );
  return (
    <Card title={titre} action={action}>
      <FieldGrid>
        <Field label="Période" value={`du ${formatDate(e.debut)} au ${formatDate(e.fin)}`} />
        <Field label="Dû" value={`${formatCurrency(s.du)} (${e.duree_mois} mois × ${formatCurrency(e.tarif_mensuel)})`} />
        <Field label="Payé" value={formatCurrency(s.paye)} />
        <Field label={s.trop_percu > 0 ? 'Payé d’avance' : 'Reste à payer'} value={formatCurrency(s.trop_percu > 0 ? s.trop_percu : s.reste)} />
      </FieldGrid>
      {e.paiements.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {e.paiements.map((p) => (
            <li key={p.id} className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-body', p.annule && 'text-muted-foreground line-through')}>
              <span className="font-mono">{p.numero}</span>
              <span>{formatDate(p.date)}</span>
              <span>{MODE_PAIEMENT[p.mode]}</span>
              {p.corrections !== 0 && <span className="text-muted-foreground">correction {formatCurrency(p.corrections)}</span>}
              {p.annule && <Badge tone="warning">Annulé</Badge>}
              <span className="ml-auto font-medium text-foreground">{formatCurrency(p.montant_utile)}</span>
              {p.recu_numero && (
                <a href={lienRecuSyndic(p.recu_numero)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" title={`Reçu ${p.recu_numero}`}>
                  <FileText className="size-3.5" aria-hidden /> Reçu
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
