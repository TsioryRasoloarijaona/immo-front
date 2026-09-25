import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import HotlineResultat from './HotlineResultat';
import { ErrorState, LoadingState } from './ui';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { rechercherHotline, type CritereHotline } from '../lib/api';
import { useApi } from '../lib/useApi';

/** La hotline en boîte, pour « qui est cette personne ? » sans quitter
 * l'écran d'où l'on vient — d'abord le détail d'une action du suivi. Même
 * appel (`GET /api/hotline/recherche`), même rendu (`HotlineResultat`) que
 * la page : l'utilisateur voit exactement ce qu'il verrait là-bas.
 *
 * Large (960) parce que les fiches portent des tables à sept colonnes et des
 * onglets ; plus étroit, les tables défileraient à l'intérieur d'une boîte
 * qui défile déjà. Le pied propose la page pour continuer la recherche avec
 * un autre critère — la boîte, elle, n'a pas de formulaire. */
export default function HotlineResultDialog({ critere, onClose }: { critere: CritereHotline; onClose: () => void }) {
  const navigate = useNavigate();
  const saisie = 'telephone' in critere ? critere.telephone : critere.nom;
  const { data, loading, error } = useApi(() => rechercherHotline(critere), [saisie, 'telephone' in critere]);

  return (
    <Modal title={`Hotline — ${saisie}`} onClose={onClose} width={960}>
      <div className="flex flex-col gap-3">
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && <HotlineResultat data={data} query={saisie} />}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
        <Button type="button" variant="outline" onClick={() => navigate('/hotline')}>
          Ouvrir la hotline <ArrowUpRight data-icon="inline-end" />
        </Button>
      </DialogFooter>
    </Modal>
  );
}
