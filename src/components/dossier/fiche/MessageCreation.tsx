/** Message affiché après la création d'un dossier (`?nouveau=1`). */
export default function MessageCreation({ vide }: Readonly<{ vide: boolean }>) {
  if (vide) {
    return (
      <div className="rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-1.5 text-micro text-(--info)">
        Dossier créé. Le schéma de financement est vide ; complétez-le dans l'onglet ci-dessous.
      </div>
    );
  }
  return <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-micro text-muted-foreground">Dossier créé.</div>;
}
