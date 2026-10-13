import { Button } from '../ui/button';

interface Dates {
  du: string;
  au: string;
}

/**
 * En-tête de la carte « À distribuer » : compteur, dates propres à la carte (« Effacer » = revenir à la période du
 * haut de l'écran) et « Voir tout » (FEATURE-a-distribuer-jamais-traitees.md §4.1). Un champ vidé est ignoré : les
 * dates affichées restent toujours les dates effectives.
 */
export default function EnteteADistribuer({
  resume,
  dates,
  datesEcran,
  onDates,
  toutes,
  onToutes,
}: Readonly<{
  resume: string;
  dates: Dates;
  datesEcran: Dates;
  onDates: (dates: Dates) => void;
  toutes: boolean;
  onToutes: () => void;
}>) {
  const modifiees = dates.du !== datesEcran.du || dates.au !== datesEcran.au;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5">
      <span className="text-label text-muted-foreground">{resume}</span>
      <div className="flex items-center gap-1.5 text-label text-foreground">
        <label htmlFor="adist-du">Reçues du</label>
        <input
          id="adist-du"
          type="date"
          className="h-7 rounded-md border border-input bg-background px-1.5 text-label"
          value={dates.du}
          max={dates.au}
          onChange={(e) => {
            if (e.target.value) onDates({ du: e.target.value, au: dates.au });
          }}
        />
        <label htmlFor="adist-au">au</label>
        <input
          id="adist-au"
          type="date"
          className="h-7 rounded-md border border-input bg-background px-1.5 text-label"
          value={dates.au}
          min={dates.du}
          onChange={(e) => {
            if (e.target.value) onDates({ du: dates.du, au: e.target.value });
          }}
        />
        <Button type="button" variant="ghost" size="sm" disabled={!modifiees} onClick={() => onDates(datesEcran)}>
          Effacer
        </Button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-label text-foreground">
        <input type="checkbox" className="size-3.5" checked={toutes} onChange={onToutes} />
        Voir tout (y compris déjà traitées)
      </label>
    </div>
  );
}
