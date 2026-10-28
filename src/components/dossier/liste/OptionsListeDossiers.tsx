import { CadreBoiteFiltre, CLASSE_LIGNE } from '../../liste/BoiteFiltre';

/** Boîte « Options » de la liste des dossiers : dossiers sortis (exclus par défaut, comme OMRAN) et tri d'OMRAN. */
export default function OptionsListeDossiers({
  inclureSortis,
  onInclureSortis,
  ordreOmran,
  onOrdreOmran,
}: Readonly<{
  inclureSortis: boolean;
  onInclureSortis: (v: boolean) => void;
  ordreOmran: boolean;
  onOrdreOmran: (v: boolean) => void;
}>) {
  return (
    <CadreBoiteFiltre titre="Options">
      <label className={CLASSE_LIGNE}>
        <input type="checkbox" className="m-0 accent-(--brand)" checked={inclureSortis} onChange={(e) => onInclureSortis(e.target.checked)} />
        Inclure annulés / désistés
      </label>
      <label className={CLASSE_LIGNE} title="Article, tranche, projet puis entité">
        <input type="checkbox" className="m-0 accent-(--brand)" checked={ordreOmran} onChange={(e) => onOrdreOmran(e.target.checked)} />
        Ordre OMRAN
      </label>
    </CadreBoiteFiltre>
  );
}
