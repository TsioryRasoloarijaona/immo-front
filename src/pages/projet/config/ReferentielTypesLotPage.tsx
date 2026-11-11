import { Shapes } from 'lucide-react';
import PageShell from '../../../components/PageShell';
import TableReferentiel from '../../../components/configuration/TableReferentiel';
import ValeursParDefautTypeLot from '../../../components/projet/ValeursParDefautTypeLot';
import { ErrorState, LoadingState } from '../../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { listDescripteursReferentiels } from '../../../lib/apiReferentielsAdmin';
import { useApi } from '../../../lib/useApi';

const SLUG = 'types-lot';

/** Types de lot par le moteur de référentiels (famille PROJET) : lecture pour tous, écriture Administrateur. */
export default function ReferentielTypesLotPage() {
  const { data, loading, error } = useApi(listDescripteursReferentiels, [], 'referentiels-admin-descripteurs');
  const descripteur = data?.find((d) => d.slug === SLUG);

  return (
    <PageShell title="Types de lot" icon={<Shapes />} fullHeight
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Types de lot' }]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && !descripteur && <ErrorState message="Référentiel introuvable." />}
      {!error && descripteur && (
        <Tabs defaultValue="types" className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="types">Types de lot</TabsTrigger>
            <TabsTrigger value="defaut">Valeurs par défaut</TabsTrigger>
          </TabsList>
          <TabsContent value="types" className="flex min-h-0 flex-1 flex-col">
            <TableReferentiel key={SLUG} descripteur={descripteur} />
          </TabsContent>
          <TabsContent value="defaut"><ValeursParDefautTypeLot /></TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
