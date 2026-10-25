import Modal from '../Modal';
import { Card, EmptyState } from '../ui';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import SectionRapport from '../rapports/SectionRapport';
import type { ValeursRapport } from '../../lib/apiRapports';
import { getDetailSuiviPrevisions } from '../../lib/apiSuiviPrevisions';
import { useApi } from '../../lib/useApi';

/** Dossiers, mouvements et schémas de financement d'un mois du suivi des prévisions. */
export default function DetailMoisPrevisions({
  titre,
  mois,
  valeurs,
  onClose,
}: Readonly<{ titre: string; mois: number; valeurs: ValeursRapport; onClose: () => void }>) {
  const cle = JSON.stringify(valeurs);
  const { data, loading, error, refetch } = useApi(() => getDetailSuiviPrevisions(valeurs, mois), [cle, mois]);
  return (
    <Modal title={titre} onClose={onClose} width={1100}>
      <div className="flex flex-col gap-4">
        {loading && !data && <Skeleton className="h-48 w-full" />}
        {error && (
          <EmptyState
            title="Impossible de charger le détail du mois"
            message={error}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Réessayer
              </Button>
            }
          />
        )}
        {!error &&
          data?.sections.map((s) =>
            s.lignes.length === 0 ? (
              <Card key={s.id} title={s.titre}>
                <p className="text-center text-body text-muted-foreground">Aucun mouvement ce mois-ci</p>
              </Card>
            ) : (
              <SectionRapport key={s.id} section={s} />
            ),
          )}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
