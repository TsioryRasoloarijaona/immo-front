import { Card } from '../ui';
import { Input } from '../ui/input';
import type { CleCase, CleNombre, SaisieDecompte } from '../../lib/saisieDecompte';

const RETENUES: { libelle: string; surMontant: CleCase; taux: CleNombre; montant: CleNombre }[] = [
  { libelle: 'Avance', surMontant: 'avanceSurMontant', taux: 'tauxAvance', montant: 'avanceAmortie' },
  { libelle: 'Retenue de garantie', surMontant: 'retenueGarantieSurMontant', taux: 'tauxRetenueGarantie', montant: 'retenueGarantie' },
  { libelle: 'Assurance DEC', surMontant: 'assuranceDECSurMontant', taux: 'tauxAssuranceDEC', montant: 'assuranceDEC' },
  { libelle: 'Assurance TRC', surMontant: 'assuranceTRCSurMontant', taux: 'tauxAssuranceTRC', montant: 'assuranceTRC' },
  { libelle: 'Compte prorata', surMontant: 'compteProrataSurMontant', taux: 'tauxCompteProrata', montant: 'compteProrata' },
];

const AUTRES: { libelle: string; cle: CleNombre }[] = [
  { libelle: 'Avance sur décompte', cle: 'avanceSurDecompte' },
  { libelle: 'Remboursement compte prorata', cle: 'remboursementCompteProrata' },
  { libelle: 'Fluctuations', cle: 'fluctuations' },
  { libelle: 'Taux d’approvisionnement (%)', cle: 'tauxApprovisionnement' },
  { libelle: 'Régularisation', cle: 'regularisation' },
];

/** Champs de retenues du décompte : case « basé sur montant », taux en % et montant. */
export default function FormulaireRetenuesDecompte({
  saisie,
  lectureSeule,
  onNombre,
  onCase,
}: Readonly<{
  saisie: SaisieDecompte;
  lectureSeule: boolean;
  onNombre: (cle: CleNombre, valeur: string) => void;
  onCase: (cle: CleCase, valeur: boolean) => void;
}>) {
  const champ = (cle: CleNombre, libelle: string) => (
    <Input
      type="number"
      step="any"
      aria-label={libelle}
      className="w-32 text-right"
      value={saisie.nombres[cle]}
      disabled={lectureSeule}
      onChange={(e) => onNombre(cle, e.target.value)}
    />
  );

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <Card title="Avance et retenues" padded={false}>
        <table className="w-full text-body">
          <thead>
            <tr className="text-left text-micro text-muted-foreground">
              <th className="px-3 py-1 font-normal">Retenue</th>
              <th className="px-3 py-1 font-normal">Basé sur montant</th>
              <th className="px-3 py-1 text-right font-normal">Taux (%)</th>
              <th className="px-3 py-1 text-right font-normal">Montant</th>
            </tr>
          </thead>
          <tbody>
            {RETENUES.map((r) => (
              <tr key={r.libelle}>
                <td className="px-3 py-1">{r.libelle}</td>
                <td className="px-3 py-1">
                  <input
                    type="checkbox"
                    aria-label={`${r.libelle} : basé sur montant`}
                    checked={saisie.cases[r.surMontant]}
                    disabled={lectureSeule}
                    onChange={(e) => onCase(r.surMontant, e.target.checked)}
                  />
                </td>
                <td className="px-3 py-1 text-right">{champ(r.taux, `${r.libelle} : taux`)}</td>
                <td className="px-3 py-1 text-right">{champ(r.montant, `${r.libelle} : montant`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Autres montants">
        <div className="flex flex-col gap-2">
          {AUTRES.map((a) => (
            <div key={a.cle} className="flex items-center justify-between gap-3 text-body">
              {a.libelle}
              {champ(a.cle, a.libelle)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
