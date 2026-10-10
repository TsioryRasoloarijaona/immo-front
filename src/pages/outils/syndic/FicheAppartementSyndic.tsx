import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../../components/ui';
import { buttonVariants } from '../../../components/ui/button';
import { formatCurrency, formatDate } from '../../../lib/format';
import { lienRecuSyndic, lireAppartementSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import CadreSyndic from './CadreSyndic';
import { MODE_PAIEMENT, PASTILLE } from './donnees';
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

function Contenu({ appartement: a }: Readonly<{ appartement: Appartement }>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/outils/syndic/appartements" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft data-icon="inline-start" /> Appartements
        </Link>
        <Badge tone={PASTILLE[a.pastille].ton}>{PASTILLE[a.pastille].libelle}</Badge>
        <Link
          to={`/outils/syndic/paiement/nouveau?appartement=${encodeURIComponent(a.code)}`}
          className={cn(buttonVariants({ size: 'sm' }), 'ml-auto')}
        >
          <Plus data-icon="inline-start" /> Enregistrer un paiement
        </Link>
      </div>

      <Card title="Propriétaires">
        {a.proprietaires.length === 0 ? (
          <p className="text-body text-muted-foreground">Aucun propriétaire rattaché.</p>
        ) : (
          <FieldGrid>
            {a.proprietaires.map((p) => (
              <Field key={p.id} label={p.est_societe ? 'Société' : 'Propriétaire'} value={[p.nom, p.telephone].filter(Boolean).join(' · ')} />
            ))}
            <Field label="N° de dossier" value={a.numero_dossier} />
            <Field label="Date du contrat" value={formatDate(a.date_contrat)} />
          </FieldGrid>
        )}
        {a.manque && <p className="mt-2 text-body text-(--amber)">{a.manque}</p>}
      </Card>

      {a.exercices.length === 0 ? (
        <EmptyState title="Aucun exercice" message="Cet appartement n’a pas encore d’année de syndic." />
      ) : (
        a.exercices.map((e) => <CarteExercice key={e.id} exercice={e} />)
      )}
    </div>
  );
}

function CarteExercice({ exercice: e }: Readonly<{ exercice: ExerciceAppartement }>) {
  const s = e.situation;
  const titre = (
    <span className="flex flex-wrap items-center gap-2">
      Exercice {e.label}
      <Badge tone={PASTILLE[s.pastille].ton}>{PASTILLE[s.pastille].libelle}</Badge>
      {e.repris_en_bloc && <Badge tone="neutral">Repris en bloc</Badge>}
    </span>
  );
  return (
    <Card title={titre}>
      <FieldGrid>
        <Field label="Période" value={`du ${formatDate(e.debut)} au ${formatDate(e.fin)}`} />
        <Field label="Dû" value={formatCurrency(s.du)} />
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
