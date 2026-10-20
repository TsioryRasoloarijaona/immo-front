/** Messages Verif d'OMRAN (texte exact du serveur) et, en sourdine, l'échec de l'aperçu. */
export default function MessagesVerif({ erreurs, apercuIndisponible }: Readonly<{ erreurs: string[]; apercuIndisponible: string | null }>) {
  if (erreurs.length === 0 && !apercuIndisponible) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {erreurs.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 rounded-lg border border-(--warning) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
          {erreurs.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      {apercuIndisponible && <p className="text-micro text-muted-foreground">Aperçu du calcul indisponible : {apercuIndisponible}</p>}
    </div>
  );
}
