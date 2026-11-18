import { useState } from 'react';
import { HardHat } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import DialoguePrevisionsChantier from './DialoguePrevisionsChantier';
import { getPrevisionsChantier } from '../../lib/apiProjet';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';

/** Caché si la lecture est refusée (403, droit BuildingPrevision) ; grisé sans nivellement, comme OMRAN. */
export default function BoutonPrevisionsChantier({ projetId }: Readonly<{ projetId: UUID }>) {
  const { data } = useApi(() => getPrevisionsChantier(projetId), [projetId]);
  const [ouvert, setOuvert] = useState(false);
  if (!data) return null;
  return (
    <>
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={!data.actif}
          title={data.actif ? undefined : 'Projet sans nivellement'} onClick={() => setOuvert(true)}>
          <HardHat /> Prévisions chantier
        </Button>
      </BarreIcones>
      {ouvert && <DialoguePrevisionsChantier projetId={projetId} onClose={() => setOuvert(false)} />}
    </>
  );
}
