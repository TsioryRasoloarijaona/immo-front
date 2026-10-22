import { useState } from 'react';
import CourbesTresorerie from './CourbesTresorerie';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { calculerTresorerieEtude, getTresorerieEtude } from '../../lib/apiFaisabilite';
import { SERIES, type CleSerie } from '../../lib/financeFaisabilite';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ApercuTresorerieDto, EtudeFaisabiliteDto } from '../../types/faisabilite';

const ECARTS = [
  { cle: 'ecartTypeTravaux', libelle: 'Écart-type des travaux' },
  { cle: 'ecartTypeConcretisation', libelle: 'Écart-type de la concrétisation' },
  { cle: 'ecartTypeFinalisation', libelle: 'Écart-type de la finalisation' },
] as const;

type CleEcart = (typeof ECARTS)[number]['cle'];

const nombreOuNull = (texte: string) => (texte.trim() === '' ? null : Number(texte));

/** Courbes mensuelles du serveur ; modifier un écart-type affiche un aperçu `/calcul` sans rien écrire. */
export default function OngletAnalyse({ fiche }: Readonly<{ fiche: EtudeFaisabiliteDto }>) {
  const [avecFinancement, setAvecFinancement] = useState(true);
  const [ecarts, setEcarts] = useState<Record<CleEcart, string>>({
    ecartTypeTravaux: String(fiche.ecartTypeTravaux ?? ''),
    ecartTypeConcretisation: String(fiche.ecartTypeConcretisation ?? ''),
    ecartTypeFinalisation: String(fiche.ecartTypeFinalisation ?? ''),
  });
  const [cochees, setCochees] = useState<ReadonlySet<CleSerie>>(new Set(SERIES.map((s) => s.cle)));
  const modifie = ECARTS.some(({ cle }) => nombreOuNull(ecarts[cle]) !== (fiche[cle] ?? null));
  const corps = useDebouncedValue(JSON.stringify({
    ecartTypeTravaux: nombreOuNull(ecarts.ecartTypeTravaux),
    ecartTypeConcretisation: nombreOuNull(ecarts.ecartTypeConcretisation),
    ecartTypeFinalisation: nombreOuNull(ecarts.ecartTypeFinalisation),
    avecFinancement,
    modifie,
  }));
  const etat = useApi(() => {
    const { modifie: apercu, ...demande } = JSON.parse(corps) as ApercuTresorerieDto & { modifie: boolean };
    return apercu ? calculerTresorerieEtude(fiche.id, demande) : getTresorerieEtude(fiche.id, avecFinancement);
  }, [fiche.id, corps]);

  function basculer(cle: CleSerie, coche: boolean) {
    const suite = new Set(cochees);
    if (coche) suite.add(cle);
    else suite.delete(cle);
    setCochees(suite);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {ECARTS.map(({ cle, libelle }) => (
          <Field key={cle}>
            <FieldLabel htmlFor={`an-${cle}`}>{libelle}</FieldLabel>
            <Input id={`an-${cle}`} type="number" step="any" min={0.5} value={ecarts[cle]}
              onChange={(e) => setEcarts({ ...ecarts, [cle]: e.target.value })} />
          </Field>
        ))}
      </div>
      <p className="text-micro text-muted-foreground">
        Modifier un écart-type affiche un aperçu : rien n'est enregistré (l'écart-type de l'étude se change dans l'onglet Phases).
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <label className="flex items-center gap-2 text-label text-foreground">
          <input type="checkbox" checked={avecFinancement} onChange={(e) => setAvecFinancement(e.target.checked)} /> Avec financement
        </label>
        {SERIES.map((s) => (
          <label key={s.cle} className="flex items-center gap-2 text-label text-foreground">
            <input type="checkbox" checked={cochees.has(s.cle)} onChange={(e) => basculer(s.cle, e.target.checked)} />
            <span aria-hidden className="inline-block h-0.5 w-4" style={{ backgroundColor: s.couleur }} />
            {s.libelle}
          </label>
        ))}
      </div>
      {etat.error && <ErrorState message={etat.error} />}
      {!etat.error && !etat.data && <LoadingState />}
      {!etat.error && etat.data && (etat.data.mois.length === 0
        ? <EmptyState title="Aucune trésorerie" message="Aucune ligne de trésorerie : renseignez les prévisions et les phases de l'étude." />
        : <CourbesTresorerie mois={etat.data.mois} series={SERIES.filter((s) => cochees.has(s.cle))} />)}
    </div>
  );
}
