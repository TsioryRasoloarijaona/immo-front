import { useState } from 'react';
import { Card } from '../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DossiersArticle from './DossiersArticle';
import HistoriqueArticle from './HistoriqueArticle';
import OngletAudit from './OngletAudit';
import PanneauActions from './PanneauActions';
import PanneauNotes from './PanneauNotes';
import ProspectionsArticle from './ProspectionsArticle';
import type { Porteur } from '../../types/audit';

/** Notes, audit et, pour l'article seul (aucune colonne pour programme et tranche), actions, prospections, dossiers, historique. */
export default function OngletsTransverses({ porteur, id }: Readonly<{ porteur: Porteur; id: string }>) {
  const [onglet, setOnglet] = useState('notes');
  return (
    <Card padded={false}>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(String(v))} className="gap-0">
        <TabsList className="px-4.5">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          {porteur === 'article' && <TabsTrigger value="actions">Actions</TabsTrigger>}
          {porteur === 'article' && <TabsTrigger value="prospections">Prospections</TabsTrigger>}
          {porteur === 'article' && <TabsTrigger value="dossiers">Dossiers</TabsTrigger>}
          {porteur === 'article' && <TabsTrigger value="historique">Historique</TabsTrigger>}
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <div className="p-4.5">
          <TabsContent value="notes"><PanneauNotes porteur={porteur} id={id} /></TabsContent>
          {porteur === 'article' && <TabsContent value="actions"><PanneauActions articleId={id} /></TabsContent>}
          {porteur === 'article' && <TabsContent value="prospections"><ProspectionsArticle articleId={id} /></TabsContent>}
          {porteur === 'article' && <TabsContent value="dossiers"><DossiersArticle articleId={id} /></TabsContent>}
          {porteur === 'article' && <TabsContent value="historique"><HistoriqueArticle articleId={id} /></TabsContent>}
          <TabsContent value="audit"><OngletAudit id={id} /></TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
