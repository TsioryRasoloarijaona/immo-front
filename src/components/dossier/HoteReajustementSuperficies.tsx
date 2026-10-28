import { lazy, Suspense } from 'react';
import { useToast } from '../../lib/toastContext';
import { refetchAllApis } from '../../lib/useApi';
import { pluriel } from '../../lib/format';

const ReajustementSuperficiesDialog = lazy(() => import('./ReajustementSuperficiesDialog'));

/** Dialogue « Réajuster les superficies » de la liste des dossiers ; la page décide qui le déclenche (Administrateur). */
export default function HoteReajustementSuperficies({ ouvert, onFermer }: Readonly<{ ouvert: boolean; onFermer: () => void }>) {
  const showToast = useToast();
  if (!ouvert) return null;
  return (
    <Suspense fallback={null}>
      <ReajustementSuperficiesDialog
        onClose={onFermer}
        onDone={(nombre) => {
          onFermer();
          showToast(`${pluriel(nombre, 'dossier réajusté', 'dossiers réajustés')}.`);
          refetchAllApis();
        }}
      />
    </Suspense>
  );
}
