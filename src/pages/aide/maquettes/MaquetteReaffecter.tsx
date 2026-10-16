import { ArrowRightLeft } from 'lucide-react';
import LignesADistribuer from '../../../components/equipe/LignesADistribuer';
import { Badge, Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatDate } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import type { LeadActiviteDto, LigneADistribuerDto } from '../../../types';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, FenetreMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const rien = () => undefined;

const COLONNES = ['Commercial', 'Projets', 'Portefeuille ouvert', 'Sans action > 7 j', 'Relances en retard', 'Dossiers'] as const;

const EQUIPE = [
  ['Amine Kettani', 'LES JARDINS', 42, 6, 3, 4],
  ['Sara Benjelloun', 'LES JARDINS, AL WAHA', 35, 0, 1, 6],
] as const;

const LEADS: LigneADistribuerDto[] = [
  { id: '31', code: 'PPR-000131', nom: 'Leila Bennis', trancheCode: 'TRANCHE 2', dateDocument: '2026-09-22', dejaTraitee: false },
  { id: '32', code: 'PPR-000132', nom: 'Mehdi Squalli', trancheCode: 'TRANCHE 1', dateDocument: '2026-09-25', dejaTraitee: false },
  { id: '33', code: 'PPR-000133', nom: 'Ghita Fassi', trancheCode: 'TRANCHE 2', dateDocument: '2026-10-02', dejaTraitee: false },
  { id: '34', code: 'PPR-000134', nom: 'Rachid Amrani', trancheCode: 'TRANCHE 1', dateDocument: '2026-10-08', dejaTraitee: false },
];

const ACTIVITES = new Map<string, LeadActiviteDto>([
  ['31', { id: '31', nombreActions: 0, joursSansAction: 21, endormi: true, jamaisTraite: true }],
  ['32', { id: '32', nombreActions: 2, joursSansAction: 12, endormi: true, jamaisTraite: false }],
  ['33', { id: '33', nombreActions: 3, joursSansAction: 2, endormi: false, jamaisTraite: false }],
  ['34', { id: '34', nombreActions: 1, joursSansAction: 0, endormi: false, jamaisTraite: false }],
]);

const COCHES: ReadonlySet<string> = new Set(['31', '32']);

function TableauEquipe() {
  return (
    <Card title="Par commercial" padded={false}>
      <div className="grid grid-cols-[1.4fr_1.6fr_repeat(4,1fr)] text-body">
        {COLONNES.map((c, i) => (
          <span key={c} className={cn('border-b border-border px-3 py-1.5 text-micro font-medium text-muted-foreground', i > 1 && 'text-right')}>{c}</span>
        ))}
        {EQUIPE.map(([nom, projets, ouvert, sansAction, retard, dossiers], ligne) => (
          <div key={nom} className="contents">
            <span {...(ligne === 0 ? cible(2, 'gauche') : {})} className="px-3 py-1.5 font-medium text-foreground">{nom}</span>
            <span className="px-3 py-1.5 text-micro text-muted-foreground">{projets}</span>
            <span className="px-3 py-1.5 text-right tabular-nums">{ouvert}</span>
            <span className="px-3 py-1.5 text-right">{sansAction > 0 ? <Badge tone="warning">{sansAction}</Badge> : 0}</span>
            <span className="px-3 py-1.5 text-right">{retard > 0 ? <Badge tone="warning">{retard}</Badge> : 0}</span>
            <span className="px-3 py-1.5 text-right font-medium tabular-nums">{dossiers}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function MaquetteReaffecter(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran titre="Mon équipe" entree="Distribution & équipe" fil={['Ventes', 'Mon équipe']} {...lien}>
      <div {...cible(1)}>
        <TableauEquipe />
      </div>
      <FenetreMaquette
        titre="Leads de Amine Kettani"
        className="mx-auto w-[92%]"
        pied={
          <>
            <Button type="button" variant="outline">Annuler</Button>
            <Button type="button" {...cible(5, 'gauche')}>
              <ArrowRightLeft data-icon="inline-start" /> Réaffecter (2)
            </Button>
          </>
        }
      >
        <span className="text-micro text-muted-foreground">
          Reçues du {formatDate('2026-09-13')} au {formatDate('2026-10-13')} · Tous mes projets
        </span>
        <div className="flex rounded-lg bg-muted p-0.5 text-body font-medium">
          <span className="flex-1 rounded-md bg-background py-0.5 text-center text-foreground shadow-sm">Pré-prospections (4)</span>
          <span className="flex-1 py-0.5 text-center text-foreground/60">Prospections (3)</span>
        </div>
        <div className="flex items-center justify-between text-micro text-muted-foreground">
          <span>4 ouvertes · 1 jamais traitée · 1 endormie (&gt; 7 j)</span>
          <span className="flex items-center gap-2 text-label text-foreground">
            <span className="size-3.5 rounded-sm border border-input" /> Tout cocher
          </span>
        </div>
        <div className="flex items-center gap-1 text-micro font-medium">
          <span className="rounded bg-secondary px-2 py-0.5 text-foreground">Toutes</span>
          <span {...cible(4, 'haut')} className="rounded px-2 py-0.5 text-muted-foreground">Jamais traitées</span>
          <span className="rounded px-2 py-0.5 text-muted-foreground">Endormies</span>
        </div>
        <div {...cible(3, 'haut', '.text-destructive')}>
          <LignesADistribuer lignes={LEADS} selection={COCHES} onBasculer={rien} onOuvrir={rien} activites={ACTIVITES} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChampMaquette libelle="Nouveau commercial *" valeur="Sara Benjelloun" liste />
          <ChampMaquette libelle="Motif (facultatif)" valeur="Congé" />
        </div>
      </FenetreMaquette>
    </MaquetteEcran>
  );
}
