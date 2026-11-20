import Champ from '../../dossier/echeancier/Champ';
import { Input } from '../../ui/input';
import { formatCurrency } from '../../../lib/format';
import type { CleChamp, SaisieJour } from '../../../lib/saisieTravauxChantier';

type Props = Readonly<{
  /** `''` = premier bloc, `'1'` = bloc « 1 ». */
  suffixe: '' | '1';
  saisie: SaisieJour;
  erreurs: Partial<Record<CleChamp, string>>;
  maj: (cle: CleChamp) => (valeur: string) => void;
  total: number | null | undefined;
}>;

/** Quantité, unité, prix unitaire HT, TVA et total HT (lecture seule) d'un bloc de la fiche. */
export default function BlocQuantitePrix({ suffixe, saisie, erreurs, maj, total }: Props) {
  const cle = (base: string) => `${base}${suffixe}` as CleChamp;
  const lib = suffixe ? ` ${suffixe}` : '';
  const quantite = cle('quantite');
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Champ id={`jour-${quantite}`} libelle={`Quantité${lib} *`}>
        <Input id={`jour-${quantite}`} type="number" step="any" value={saisie[quantite]} onChange={(e) => maj(quantite)(e.target.value)}
          aria-invalid={erreurs[quantite] ? true : undefined} />
        {erreurs[quantite] && <p role="alert" className="text-micro text-destructive">{erreurs[quantite]}</p>}
      </Champ>
      <Champ id={`jour-${cle('unite')}`} libelle={`Unité${lib}`}>
        <Input id={`jour-${cle('unite')}`} value={saisie[cle('unite')]} maxLength={50} onChange={(e) => maj(cle('unite'))(e.target.value)} />
      </Champ>
      <Champ id={`jour-${cle('prixUnitaireHT')}`} libelle={`PU HT${lib}`}>
        <Input id={`jour-${cle('prixUnitaireHT')}`} type="number" step="any" value={saisie[cle('prixUnitaireHT')]}
          onChange={(e) => maj(cle('prixUnitaireHT'))(e.target.value)} />
      </Champ>
      <Champ id={`jour-${cle('tva')}`} libelle={`TVA${lib} (%)`}>
        <Input id={`jour-${cle('tva')}`} type="number" step="any" value={saisie[cle('tva')]} onChange={(e) => maj(cle('tva'))(e.target.value)} />
      </Champ>
      <Champ id={`jour-total${suffixe}`} libelle={`Total HT${lib}`}>
        <Input id={`jour-total${suffixe}`} value={formatCurrency(total)} disabled readOnly />
      </Champ>
    </div>
  );
}
