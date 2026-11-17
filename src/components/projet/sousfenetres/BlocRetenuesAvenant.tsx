import { montantRetenue, RETENUES, tauxRetenue, type CleRetenue } from '../../../lib/saisieAvenant';
import type { RetenueAvenantDto } from '../../../types/projet';

const CHAMP = 'h-6 w-28 rounded-sm border border-border bg-transparent px-1 text-right text-body focus:border-ring focus:outline-none disabled:border-transparent disabled:opacity-100';

function Nombre({ libelle, valeur, actif, onChange }: Readonly<{ libelle: string; valeur: number; actif: boolean; onChange: (v: number) => void }>) {
  return (
    <input type="number" step="any" aria-label={libelle} disabled={!actif} className={CHAMP} value={Number(valeur.toFixed(6))} onChange={(e) => onChange(Number(e.target.value))} />
  );
}

/** Les 4 retenues : l'un du taux ou du montant est saisi (selon « par montant »), l'autre est calculé en direct. */
export default function BlocRetenuesAvenant({
  retenues,
  ttc,
  parMontantAutorise,
  lectureSeule,
  onChanger,
}: Readonly<{
  retenues: Record<CleRetenue, RetenueAvenantDto>;
  ttc: number;
  parMontantAutorise: boolean;
  lectureSeule: boolean;
  onChanger: (cle: CleRetenue, r: RetenueAvenantDto) => void;
}>) {
  return (
    <fieldset className="rounded-md border px-3 py-2">
      <legend className="px-1 text-micro font-medium text-muted-foreground">Retenues</legend>
      <div className="grid grid-cols-[12rem_auto_auto_auto] items-center gap-x-3 gap-y-1 text-body">
        <span className="text-micro text-muted-foreground" />
        <span className="text-micro text-muted-foreground">Par montant</span>
        <span className="text-micro text-muted-foreground">Taux (%)</span>
        <span className="text-micro text-muted-foreground">Montant</span>
        {RETENUES.map(({ cle, libelle }) => {
          const r = retenues[cle];
          const taux = tauxRetenue(r, ttc);
          const montant = montantRetenue(r, ttc);
          return (
            <div key={cle} className="contents">
              <span>{libelle}</span>
              <input
                type="checkbox"
                aria-label={`${libelle} par montant`}
                disabled={lectureSeule || !parMontantAutorise}
                checked={r.parMontant}
                onChange={(e) => onChanger(cle, { parMontant: e.target.checked, taux, montant })}
              />
              <Nombre libelle={`${libelle} : taux`} valeur={taux} actif={!lectureSeule && !r.parMontant} onChange={(v) => onChanger(cle, { parMontant: false, taux: v, montant: null })} />
              <Nombre libelle={`${libelle} : montant`} valeur={montant} actif={!lectureSeule && r.parMontant && parMontantAutorise} onChange={(v) => onChanger(cle, { parMontant: true, taux, montant: v })} />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
