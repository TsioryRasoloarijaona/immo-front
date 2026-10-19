import type { ReactNode } from 'react';
import { Clock, Copy, MapPin } from 'lucide-react';
import { Badge } from '../ui';
import LienFiche from '../LienFiche';
import type { FicheCible } from '../../lib/previewContext';
import { formatDateTime, formatRecuIlYa, formatTelephone } from '../../lib/format';
import type { DoublonTriDto, LigneTriDto } from '../../types';

const CRITERES: Record<string, string> = { TELEPHONE: 'même numéro', EMAIL: 'même e-mail', NOM: 'même nom' };

function cibleDoublon(d: DoublonTriDto): FicheCible {
  return d.nature === 'PROSPECT' ? { type: 'prospect', id: d.id } : { type: 'prospection', id: d.id, pre: false };
}

function Puce({ children }: Readonly<{ children: ReactNode }>) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-micro text-muted-foreground">{children}</span>;
}

/** La pré-prospection en cours de tri : identité, formulaire, doublons (FEATURE-parcours-commercial.md §4). */
export default function CarteTri({ ligne, onOuvrir }: Readonly<{ ligne: LigneTriDto; onOuvrir: () => void }>) {
  const lieu = [ligne.projetCode, ligne.trancheCode].filter(Boolean).join(' · ');
  return (
    <article aria-labelledby="tri-nom" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {/* La fiche s'ouvre en fenêtre : la boîte garde sa position et se relit à la fermeture. */}
        <button id="tri-nom" type="button" onClick={onOuvrir} className="text-left text-hero font-semibold text-foreground hover:text-primary">
          {ligne.nom || ligne.code || 'Sans nom'}
        </button>
        <span className="text-title tabular-nums text-foreground">{formatTelephone(ligne.telephone, ligne.indicatif)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ligne.source && <Puce>{ligne.source}{ligne.sourceSupport ? ` · ${ligne.sourceSupport}` : ''}</Puce>}
        {ligne.campagne && <Puce>{ligne.campagne}</Puce>}
        {lieu && <Puce><MapPin aria-hidden className="size-3" />{lieu}</Puce>}
        {ligne.code && <Puce>{ligne.code}</Puce>}
        <Puce><Clock aria-hidden className="size-3" />{formatRecuIlYa(ligne.ageJours)}</Puce>
      </div>
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <p className="text-micro font-medium text-muted-foreground">Message du formulaire</p>
        <p className="whitespace-pre-line text-body text-foreground">{ligne.message || '—'}</p>
      </div>
      {ligne.prochaineRelance && (
        <Badge tone="info">Relance prévue le {formatDateTime(ligne.prochaineRelance)}</Badge>
      )}
      {ligne.doublons.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-lg border border-(--amber-border) bg-(--amber-bg) px-3 py-2 text-body text-(--amber)">
          <span className="flex items-center gap-1.5 font-semibold"><Copy aria-hidden className="size-3.5" />Doublon possible</span>
          <ul className="flex flex-col gap-0.5">
            {ligne.doublons.map((d) => (
              <li key={`${d.nature}-${d.id}`}>
                <LienFiche cible={cibleDoublon(d)} className="font-medium text-(--amber) underline-offset-2 hover:underline">
                  {d.nature === 'PROSPECT' ? 'Prospect' : 'Prospection'} {d.nom || d.code}
                </LienFiche>
                {' — '}
                {d.criteres.map((c) => CRITERES[c] ?? c).join(', ')}
                {d.fermee ? ' (archivée)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
