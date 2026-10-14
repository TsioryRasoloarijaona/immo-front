/** Cases de la liste des dossiers : dossiers sortis (exclus par défaut, comme OMRAN) et tri d'OMRAN. */
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
    <div className="flex flex-wrap items-center gap-3 text-body">
      <label className="inline-flex items-center gap-1.5">
        <input
          type="checkbox"
          className="size-3.5 accent-(--primary)"
          checked={inclureSortis}
          onChange={(e) => onInclureSortis(e.target.checked)}
        />
        Inclure annulés / désistés
      </label>
      <label className="inline-flex items-center gap-1.5" title="Article, tranche, projet puis entité">
        <input
          type="checkbox"
          className="size-3.5 accent-(--primary)"
          checked={ordreOmran}
          onChange={(e) => onOrdreOmran(e.target.checked)}
        />
        Ordre OMRAN
      </label>
    </div>
  );
}
