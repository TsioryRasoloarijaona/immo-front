import { useState } from 'react';
import { Card } from '../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import type { Porteur } from '../../types/audit';

/** Onglets transverses en carte (fiche projet) ; la fiche tranche et la fiche article les prennent dans leurs onglets. */
export default function OngletsTransverses({ porteur, id }: Readonly<{ porteur: Porteur; id: string }>) {
  const [onglet, setOnglet] = useState('notes');
  const onglets = ongletsTransverses(porteur, id);
  return (
    <Card padded={false}>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(String(v))} className="gap-0">
        <TabsList className="px-4.5">
          {onglets.map((o) => <TabsTrigger key={o.id} value={o.id}>{o.libelle}</TabsTrigger>)}
        </TabsList>
        <div className="p-4.5">
          {onglets.map((o) => <TabsContent key={o.id} value={o.id}>{o.contenu}</TabsContent>)}
        </div>
      </Tabs>
    </Card>
  );
}
