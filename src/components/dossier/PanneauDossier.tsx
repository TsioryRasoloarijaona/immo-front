import { useState } from 'react';
import { Card, ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { OngletsLigne } from '../FicheShell';
import SyntheseMontants from '../SyntheseMontants';
import { Tabs, TabsContent } from '../ui/tabs';
import { canonicalStatusLabel } from '../../lib/dossierStatus';
import { formatDate, formatDateTime } from '../../lib/format';
import type { ApiState } from '../../lib/useApi';
import type { DossierDetailDto, MontantsDossierDto } from '../../types';

type OngletPanneau = 'montants' | 'dates' | 'tracabilite';

export default function PanneauDossier({
  dossier: d,
  montants,
}: Readonly<{ dossier: DossierDetailDto; montants: ApiState<MontantsDossierDto> }>) {
  const [onglet, setOnglet] = useState<OngletPanneau>('montants');
  return (
    <Card padded={false} className="flex h-full flex-col">
      <Tabs value={onglet} onValueChange={(v) => setOnglet(v as OngletPanneau)} className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <OngletsLigne
          onglets={[
            { id: 'montants', libelle: 'Montants' },
            { id: 'dates', libelle: 'Dates' },
            { id: 'tracabilite', libelle: 'Traçabilité' },
          ]}
        />

        <TabsContent value="montants" className="min-h-0 flex-1">
          {montants.loading && !montants.data && <LoadingState />}
          {montants.error && <ErrorState message={montants.error} />}
          {montants.data && <SyntheseMontants montants={montants.data} probabiliteFinalisation={d.probabiliteFinalisation} />}
        </TabsContent>

        <TabsContent value="dates" className="min-h-0 flex-1 overflow-auto">
          <FieldGrid>
            <Field label="Réservation" value={formatDate(d.dateDocument)} />
            <Field label="Prospection" value={formatDate(d.dateProspection)} />
            <Field label="Validité du statut" value={formatDate(d.dateValiditeStatut)} />
          </FieldGrid>
          <div className="mt-2 border-t border-border pt-2">
            <FieldGrid>
              <Field label="Statut" value={canonicalStatusLabel(d.statut)} />
              <Field label="Étapes atteignables" value={d.etapesAtteignables?.join(', ')} />
            </FieldGrid>
          </div>
        </TabsContent>

        <TabsContent value="tracabilite" className="min-h-0 flex-1 overflow-auto">
          <FieldGrid>
            <Field label="Saisi par" value={d.creePar} />
            <Field label="Saisi le" value={formatDateTime(d.creeLe)} />
            <Field label="Modifié par" value={d.modifiePar} />
            <Field label="Modifié le" value={formatDateTime(d.modifieLe)} />
          </FieldGrid>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
