import { Ban, ChevronDown, ChevronRight, ClipboardCheck, Download, Eye, Paperclip } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { echeanceCategorieTone } from '../../../lib/domain';
import { formatCurrency, formatDate } from '../../../lib/format';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, EnteteMaquette, FenetreMaquette, OngletsMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const ONGLETS = [['Statut'], ['Schéma de financement'], ['Articles'], ['Acquéreurs'], ['Pièces jointes'], ['Documents générés'], ['Historique']] as const;

const ECHEANCES = [
  { categorie: 'AVANCE', date: '2026-10-15', montant: 105000, statut: 'Partielle', ton: 'info', regle: `Réglé ${formatCurrency(50000)} · Reste ${formatCurrency(55000)}` },
  { categorie: 'AUTO-FINANCEMENT', date: '2027-01-15', montant: 913500, statut: 'À régler', ton: 'neutral', regle: '' },
  { categorie: 'FRAIS SYNDIC', date: '2027-01-15', montant: 6000, statut: 'À régler', ton: 'neutral', regle: '' },
] as const;

function BoutonsDocument({ repere }: Readonly<{ repere?: number }>) {
  return (
    <span className="flex items-center" {...(repere ? cible(repere, 'bas') : {})}>
      <Eye className="size-3.5 text-muted-foreground" />
      <Download className="ml-1 size-3.5 text-muted-foreground" />
    </span>
  );
}

export default function MaquetteEcheancier(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Dossier de vente"
      entree="Dossiers de vente"
      fil={['Dossiers']}
      entete={<EnteteMaquette code="DOS-000321" nom="Hind Chraibi" />}
      {...lien}
    >
      <OngletsMaquette onglets={ONGLETS} actif="Schéma de financement" cibles={{ 'Schéma de financement': [1, 'haut'] }} />
      <div className="relative rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1.5rem_1.4fr_1fr_1fr_1.6fr_auto] items-center gap-x-3 border-b border-border px-3 py-1.5 text-micro font-medium text-muted-foreground">
          <span />
          <span>Catégorie</span>
          <span>Échéance</span>
          <span className="text-right">Montant</span>
          <span>Statut</span>
          <span className="text-right">Actions</span>
        </div>
        {ECHEANCES.map((e, i) => (
          <div key={e.categorie} className="border-b border-border last:border-b-0">
            <div className="grid grid-cols-[1.5rem_1.4fr_1fr_1fr_1.6fr_auto] items-center gap-x-3 px-3 py-2 text-body">
              {i === 0 ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              <span><Badge tone={echeanceCategorieTone(e.categorie)}>{e.categorie}</Badge></span>
              <span className="text-muted-foreground">{formatDate(e.date)}</span>
              <span className="text-right font-semibold tabular-nums">{formatCurrency(e.montant)}</span>
              <span className="flex flex-col gap-0.5">
                <Badge tone={e.ton}>{e.statut}</Badge>
                {e.regle && <span className="text-micro text-muted-foreground">{e.regle}</span>}
              </span>
              <Button type="button" variant="ghost" size="sm" {...(i === 0 ? cible(2, 'gauche') : {})}>+ Règlement</Button>
            </div>
            {i === 0 && (
              <div className="bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-x-3 rounded-md border border-(--info-border) bg-(--info-bg) px-2.5 py-1.5 text-body">
                  <Badge tone="info">En cours</Badge>
                  <span className="font-medium">Chèque</span>
                  <span className="text-muted-foreground">Réf. 0000123</span>
                  <span className="text-muted-foreground">Échéance {formatDate('2026-10-10')}</span>
                  <span className="ml-auto font-semibold tabular-nums">{formatCurrency(50000)}</span>
                  <span {...cible(4, 'bas')}><Paperclip className="size-3.5 text-muted-foreground" /></span>
                  <BoutonsDocument repere={6} />
                  <BoutonsDocument />
                  <Button type="button" variant="outline" size="sm" {...cible(5, 'haut')}>
                    <ClipboardCheck data-icon="inline-start" /> Pointer
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    <Ban data-icon="inline-start" /> Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <FenetreMaquette
        titre="Ajouter un règlement"
        className="ml-auto w-80"
        pied={
          <>
            <Button type="button" variant="outline">Annuler</Button>
            <Button type="button" {...cible(3, 'gauche')}>Ok</Button>
          </>
        }
      >
        <ChampMaquette libelle="Montant" valeur="55000" />
        <ChampMaquette libelle="Réglé par" valeur="Hind Chraibi · AB000000" liste />
        <ChampMaquette libelle="Type de règlement" valeur="Virement" liste />
      </FenetreMaquette>
    </MaquetteEcran>
  );
}
