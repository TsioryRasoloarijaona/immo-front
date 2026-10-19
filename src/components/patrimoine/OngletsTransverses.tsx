import { useState } from 'react';
import { Card } from '../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import OngletAudit from './OngletAudit';
import PanneauActions from './PanneauActions';
import PanneauNotes from './PanneauNotes';
import type { Porteur } from '../../types/audit';

/** Notes, actions (article seul : aucune colonne pour programme et tranche) et audit d'un objet du patrimoine. */
export default function OngletsTransverses({ porteur, id }: Readonly<{ porteur: Porteur; id: string }>) {
  const [onglet, setOnglet] = useState('notes');
  return (
    <Card padded={false}>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(String(v))} className="gap-0">
        <TabsList className="px-4.5">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          {porteur === 'article' && <TabsTrigger value="actions">Actions</TabsTrigger>}
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <div className="p-4.5">
          <TabsContent value="notes"><PanneauNotes porteur={porteur} id={id} /></TabsContent>
          {porteur === 'article' && <TabsContent value="actions"><PanneauActions articleId={id} /></TabsContent>}
          <TabsContent value="audit"><OngletAudit id={id} /></TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
