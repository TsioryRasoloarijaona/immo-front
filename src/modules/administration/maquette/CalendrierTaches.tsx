import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui';
import PageListe from '../../../components/liste/PageListe';
import EnteteListe from '../../../components/liste/EnteteListe';
import BarreEtatListe from '../../../components/liste/BarreEtatListe';
import { pluriel } from '../../../lib/format';
import { TACHES } from './donnees';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Vue mois des tâches (échéance), statique : les mois se parcourent, rien ne s'enregistre. */
export default function CalendrierTaches() {
  const [mois, setMois] = useState(new Date(2026, 9, 1));
  const decalage = (mois.getDay() + 6) % 7;
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
  const cases = Array.from({ length: Math.ceil((decalage + nbJours) / 7) * 7 }, (_, i) => i - decalage + 1);
  const prefixe = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`;
  const duJour = (j: number) => TACHES.filter((t) => t.echeance === `${prefixe}-${String(j).padStart(2, '0')}`);
  const titre = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const aller = (delta: number) => setMois(new Date(mois.getFullYear(), mois.getMonth() + delta, 1));
  const total = cases.reduce((n, j) => n + (j >= 1 && j <= nbJours ? duJour(j).length : 0), 0);

  return (
    <PageListe titre="Calendrier">
      <EnteteListe titre="Calendrier" lignes={titre}>
        <Badge tone="amber">Maquette</Badge>
        <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-muted" title="Mois précédent" aria-label="Mois précédent" onClick={() => aller(-1)}>
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-muted" title="Mois suivant" aria-label="Mois suivant" onClick={() => aller(1)}>
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </EnteteListe>
      <div className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-auto border-y border-border bg-border">
        {JOURS.map((j) => (
          <div key={j} className="bg-muted/60 px-2 py-1 text-micro font-semibold text-muted-foreground uppercase">
            {j}
          </div>
        ))}
        {cases.map((j) => {
          const dansMois = j >= 1 && j <= nbJours;
          return (
            <div key={j} className="min-h-20 bg-card p-1">
              {dansMois && <span className="text-micro text-muted-foreground">{j}</span>}
              {dansMois &&
                duJour(j).map((t) => (
                  <div key={t.id} className="mt-0.5 truncate rounded bg-(--neutral-bg) px-1 text-micro text-foreground" title={`${t.objet} — ${t.responsable}`}>
                    {t.objet}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
      <BarreEtatListe lignes={pluriel(total, 'tâche')} selection="aucune" />
    </PageListe>
  );
}
