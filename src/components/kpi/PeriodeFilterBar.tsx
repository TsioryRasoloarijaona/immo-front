import { RotateCcw } from 'lucide-react';
import { Card } from '../ui';
import { Button } from '../ui/button';
import { InputGroup, InputGroupInput } from '../ui/input-group';
import { aujourdHuiISO, emptyPeriode, ilYA, premierJourDuMois, type Periode } from './periode';

/** Sélecteur de période des écrans KPI.
 *
 * Volontairement séparé de `ProspectionFilterBar`, qui est soudé à
 * `ProspectionFilterBarState` (recherche, étape, origine, commercial, tranche…) :
 * le généraliser ferait bouger quatre pages de liste sans rien gagner ici.
 *
 * La période par défaut du serveur — les 30 derniers jours — est écrite en
 * toutes lettres quand les deux champs sont vides : un intervalle implicite
 * qu'aucun libellé n'affiche est la façon la plus simple de faire lire un
 * chiffre sur la mauvaise période. */
export default function PeriodeFilterBar({
  value,
  onChange,
}: {
  value: Periode;
  onChange: (next: Periode) => void;
}) {
  const parDefaut = !value.du && !value.au;
  // Le serveur refuse `du` postérieure à `au` (400). Le signaler ici évite un
  // aller-retour réseau dont le seul retour serait un bandeau d'erreur.
  const intervalleInverse = !!value.du && !!value.au && value.du > value.au;

  return (
    <Card padded={false} className="shrink-0">
      <div className="flex flex-wrap items-center gap-2.5 p-3">
        <span className="text-body font-medium text-muted-foreground">Période</span>
        <div className="flex items-center gap-1.5">
          <InputGroup className="w-32.5">
            <InputGroupInput
              type="date"
              aria-label="Du"
              value={value.du}
              max={value.au || undefined}
              onChange={(e) => onChange({ ...value, du: e.target.value })}
            />
          </InputGroup>
          <span className="text-body text-muted-foreground">au</span>
          <InputGroup className="w-32.5">
            <InputGroupInput
              type="date"
              aria-label="Au"
              value={value.au}
              min={value.du || undefined}
              onChange={(e) => onChange({ ...value, au: e.target.value })}
            />
          </InputGroup>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ du: ilYA(30), au: aujourdHuiISO() })}>
            30 jours
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ du: ilYA(90), au: aujourdHuiISO() })}>
            90 jours
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ du: premierJourDuMois(), au: aujourdHuiISO() })}>
            Ce mois
          </Button>
        </div>

        <Button type="button" variant="ghost" size="sm" disabled={parDefaut} onClick={() => onChange(emptyPeriode())}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>

        {parDefaut && <span className="text-micro text-muted-foreground">Par défaut : les 30 derniers jours.</span>}
        {intervalleInverse && (
          <span role="alert" className="text-micro text-destructive">
            La date de début est postérieure à la date de fin.
          </span>
        )}
      </div>
    </Card>
  );
}
