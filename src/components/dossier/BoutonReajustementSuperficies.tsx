import { lazy, Suspense, useState } from 'react';
import { Ruler } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { refetchAllApis } from '../../lib/useApi';
import { pluriel } from '../../lib/format';

const ReajustementSuperficiesDialog = lazy(() => import('./ReajustementSuperficiesDialog'));

/** Bouton « Réajuster les superficies » de la liste des dossiers (Administrateur). */
export default function BoutonReajustementSuperficies() {
  const { user } = useAuth();
  const showToast = useToast();
  const [ouvert, setOuvert] = useState(false);

  if (!estAdministrateur(user)) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOuvert(true)}>
        <Ruler data-icon="inline-start" /> Réajuster les superficies
      </Button>
      {ouvert && (
        <Suspense fallback={null}>
          <ReajustementSuperficiesDialog
            onClose={() => setOuvert(false)}
            onDone={(nombre) => {
              setOuvert(false);
              showToast(`${pluriel(nombre, 'dossier réajusté', 'dossiers réajustés')}.`);
              refetchAllApis();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
