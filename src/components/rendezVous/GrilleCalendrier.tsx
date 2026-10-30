import { useMemo } from 'react';
import { JOURS_SEMAINE, type VueCalendrier } from '../../lib/calendrierRendezVous';
import { formatHeure, jourISO } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { RendezVousDto } from '../../types/rendezVous';

const PUCES_PAR_JOUR_EN_MOIS = 3;

function Puce({ rdv, onOuvrir }: Readonly<{ rdv: RendezVousDto; onOuvrir: (id: string) => void }>) {
  const heure = formatHeure(rdv.datePrevue);
  const libelle = [heure, rdv.description].filter(Boolean).join(' ');
  const titre = [libelle, rdv.tierNom, rdv.gestionnaireNom].filter(Boolean).join(' — ');
  return (
    <button
      type="button"
      draggable
      title={titre}
      className="pointer-events-auto mt-0.5 block w-full cursor-grab truncate rounded bg-(--neutral-bg) px-1 text-left text-micro text-foreground hover:bg-muted"
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', rdv.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onOuvrir(rdv.id)}
    >
      {libelle || rdv.code}
    </button>
  );
}

/** Grille mois / semaine / jour : une case par jour, puces glissables d'une case à l'autre (HTML5 draggable). */
export default function GrilleCalendrier({ vue, jours, moisAffiche, rdvs, onOuvrir, onCreer, onVoirJour, onDeposer }: Readonly<{
  vue: VueCalendrier;
  jours: Date[];
  moisAffiche: number;
  rdvs: RendezVousDto[];
  onOuvrir: (id: string) => void;
  onCreer: (jour: string) => void;
  onVoirJour: (jour: string) => void;
  onDeposer: (id: string, jour: string) => void;
}>) {
  const parJour = useMemo(() => {
    const m = new Map<string, RendezVousDto[]>();
    for (const r of rdvs) {
      const jour = (r.datePrevue ?? '').slice(0, 10);
      m.set(jour, [...(m.get(jour) ?? []), r]);
    }
    return m;
  }, [rdvs]);
  const colonnes = { mois: 'grid-cols-7', semaine: 'grid-cols-5', jour: 'grid-cols-1' }[vue];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto border-y border-border">
      {vue === 'mois' && (
        <div className="grid shrink-0 grid-cols-7 gap-px bg-border">
          {JOURS_SEMAINE.map((j) => (
            <div key={j} className="bg-muted/60 px-2 py-1 text-micro font-semibold text-muted-foreground uppercase">
              {j}
            </div>
          ))}
        </div>
      )}
      <div className={cn('grid flex-1 auto-rows-fr gap-px bg-border', colonnes)}>
      {jours.map((d) => {
        const cle = jourISO(d);
        const duJour = parJour.get(cle) ?? [];
        const visibles = vue === 'mois' ? duJour.slice(0, PUCES_PAR_JOUR_EN_MOIS) : duJour;
        const nom = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        return (
          <div
            key={cle}
            className={cn('relative min-h-20 bg-card p-1', vue === 'mois' && d.getMonth() !== moisAffiche && 'bg-muted/40')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) onDeposer(id, cle);
            }}
          >
            <button type="button" className="absolute inset-0 cursor-pointer" aria-label={`Nouveau rendez-vous le ${nom}`} onClick={() => onCreer(cle)} />
            <div className="pointer-events-none relative">
              <span className="text-micro text-muted-foreground">{vue === 'mois' ? d.getDate() : nom}</span>
              {visibles.map((r) => (
                <Puce key={r.id} rdv={r} onOuvrir={onOuvrir} />
              ))}
              {duJour.length > visibles.length && (
                <button
                  type="button"
                  className="pointer-events-auto mt-0.5 text-micro text-muted-foreground hover:text-foreground"
                  onClick={() => onVoirJour(cle)}
                >
                  +{duJour.length - visibles.length}
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
