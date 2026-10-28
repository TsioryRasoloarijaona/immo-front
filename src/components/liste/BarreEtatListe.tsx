/** Pied de liste : effectif, ligne sélectionnée et rappel du clavier (la grille sait déjà `Entrée` et les flèches). */
export default function BarreEtatListe({
  lignes,
  selection,
  alerte,
}: Readonly<{ lignes: string; selection: string; alerte?: string | null }>) {
  return (
    <div className="flex h-6.5 shrink-0 items-center gap-4 border-t border-border bg-muted/40 px-3 text-body text-muted-foreground">
      <span className="font-semibold text-foreground">{lignes}</span>
      <span>
        Sélection : <b className="font-semibold text-foreground">{selection}</b>
      </span>
      {alerte && (
        <span role="alert" className="text-destructive">
          {alerte}
        </span>
      )}
      <span className="flex-1" />
      <span className="hidden md:inline">Clic ou Entrée : ouvrir la fiche · ↑ ↓ : naviguer</span>
    </div>
  );
}
