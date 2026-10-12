import { useState } from 'react';
import { OngletsLigne } from '../FicheShell';
import { Card } from '../ui';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import type { PorteurNote, UUID } from '../../types';
import OngletAudit from './OngletAudit';
import PanneauActions from './PanneauActions';
import PanneauNotes from './PanneauNotes';

type Onglet = 'audit' | 'notes' | 'actions';

/**
 * Onglets communs aux fiches programme, tranche et article : Audit et Notes partout, Actions sur l'article
 * seulement (aucune colonne programme ni tranche dans `ComActionMessage`). Un seul point d'insertion par page.
 */
export default function OngletsTransverses({ porteur, id }: Readonly<{ porteur: PorteurNote; id: UUID }>) {
  const admin = estAdministrateur(useAuth().user);
  const [onglet, setOnglet] = useState<Onglet>(porteur === 'article' ? 'actions' : 'notes');
  const onglets = [
    ...(porteur === 'article' ? [{ id: 'actions', libelle: 'Actions' }] : []),
    { id: 'notes', libelle: 'Notes' },
    { id: 'audit', libelle: 'Audit' },
  ];
  return (
    <Card padded={false}>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(v as Onglet)} className="flex flex-col gap-2 p-3">
        <OngletsLigne onglets={onglets} />
        {porteur === 'article' && (
          <TabsContent value="actions">
            <PanneauActions articleId={id} admin={admin} />
          </TabsContent>
        )}
        <TabsContent value="notes">
          <PanneauNotes porteur={porteur} id={id} admin={admin} />
        </TabsContent>
        <TabsContent value="audit">
          <OngletAudit objetId={id} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
