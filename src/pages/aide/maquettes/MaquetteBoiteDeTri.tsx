import CarteTri from '../../../components/parcours/CarteTri';
import ContactBoutons from '../../../components/parcours/ContactBoutons';
import { cn } from '../../../lib/utils';
import type { LigneTriDto } from '../../../types';
import MaquetteEcran from './MaquetteEcran';
import { cible, type LienReperes } from './reperes';

const LEAD: LigneTriDto = {
  prospectionId: 'tri-1',
  code: 'PPR-000101',
  nom: 'Salma Idrissi',
  telephone: '0600000001',
  ageJours: 0,
  message: 'Bonjour, je cherche un appartement de 3 chambres. Merci de me rappeler en fin de journée.',
  source: 'FACEBOOK',
  sourceSupport: 'CAMPAGNE AUTOMNE',
  projetCode: 'LES JARDINS',
  trancheCode: 'TRANCHE 2',
  doublons: [{ nature: 'PROSPECT', id: 'tri-doublon', nom: 'Salma Idrissi', criteres: ['TELEPHONE'] }],
};

// Les quatre tuiles de `GestesTri`, redessinées ici pour viser chacune (étapes 2 à 5).
const GESTES = [
  { touche: '1', titre: 'Appeler / WhatsApp', aide: "Puis noter l'échange" },
  { touche: '2', titre: 'Pas joignable', aide: 'Relance demain 10:00' },
  { touche: '3', titre: 'Qualifier et attribuer', aide: 'Devient une prospection' },
  { touche: '4', titre: 'Archiver', aide: 'Avec une raison' },
] as const;

export default function MaquetteBoiteDeTri(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Boîte de tri"
      entree="Boîte de tri"
      fil={['Ventes', 'Boîte de tri']}
      actions={
        <span className="flex items-center gap-2 text-body">
          <span className="size-3.5 rounded-sm border border-input" />
          Inclure les leads de plus de 6 mois
        </span>
      }
      {...lien}
    >
      <div className="flex items-center justify-between text-body text-muted-foreground">
        <span>Lead 3 sur 12 · le plus récent d'abord</span>
        <span>Raccourcis clavier : <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd></span>
      </div>
      <div {...cible(6, 'haut')} className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/6 rounded-full bg-primary" />
      </div>
      <div {...cible(1, 'gauche', 'a')}>
        <CarteTri ligne={LEAD} onOuvrir={() => undefined} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {GESTES.map((g, i) => (
          <div key={g.touche} {...cible(i + 2)} className="flex min-h-20 flex-col items-start justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-muted px-1.5 text-micro font-semibold text-muted-foreground">{g.touche}</kbd>
              <span className={cn('text-label font-semibold', g.touche === '4' ? 'text-destructive' : 'text-foreground')}>{g.titre}</span>
            </span>
            <span className="text-micro text-muted-foreground">{g.aide}</span>
            {g.touche === '1' && <ContactBoutons nom="Salma Idrissi" telephone={LEAD.telephone} libelles />}
          </div>
        ))}
      </div>
    </MaquetteEcran>
  );
}
