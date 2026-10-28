import { OngletsLigne, type OngletFiche } from '../FicheShell';
import { Tabs, TabsContent } from '../ui/tabs';

/**
 * Classeur du bas de la fiche : onglets avec compteur, un contenu (grille ou champs) par onglet. L'onglet actif
 * vit dans le parent : les données rechargées ne le réinitialisent pas.
 */
export default function ClasseurBas({
  onglets,
  actif,
  onChange,
}: Readonly<{ onglets: OngletFiche[]; actif: string; onChange: (id: string) => void }>) {
  return (
    <Tabs value={actif} onValueChange={onChange} className="flex min-h-0 min-w-0 flex-1 flex-col gap-0">
      <div className="shrink-0 bg-muted/40 px-3">
        <OngletsLigne onglets={onglets} onChoisir={onChange} />
      </div>
      {onglets.map((o) => (
        <TabsContent key={o.id} value={o.id} className="min-h-0 min-w-0 flex-1 overflow-auto">
          {o.contenu}
        </TabsContent>
      ))}
    </Tabs>
  );
}
