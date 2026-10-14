import { Pencil } from 'lucide-react';
import { Button } from '../../ui/button';
import { formatCurrency } from '../../../lib/format';
import type { EditionDossier } from '../../../lib/editionDossier';

function AvertissementEcart({ ecart }: Readonly<{ ecart: number }>) {
  const sens = ecart > 0 ? 'ajouter au' : 'retirer du';
  return (
    <p role="status" className="text-micro text-(--warning)">
      Le schéma de financement ne correspond plus au prix de vente : {formatCurrency(Math.abs(ecart))} à {sens} schéma
      dans l'échéancier.
    </p>
  );
}

/** « Modifier » si le rôle le permet, puis Annuler / Enregistrer ; erreurs 400/403/409 affichées telles quelles. */
export default function BarreEdition({
  edition,
  visible,
  onEnregistrer,
}: Readonly<{ edition: EditionDossier; visible: boolean; onEnregistrer: () => void }>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-end gap-2">
        {edition.ouvert ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={edition.annuler} disabled={edition.busy}>
              Annuler
            </Button>
            <Button type="button" size="sm" onClick={onEnregistrer} disabled={edition.busy}>
              {edition.busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        ) : (
          visible && (
            <Button type="button" size="sm" variant="outline" onClick={edition.ouvrir}>
              <Pencil aria-hidden />
              Modifier
            </Button>
          )
        )}
      </div>
      {edition.erreur && (
        <p role="alert" className="text-micro text-destructive">
          {edition.erreur}
        </p>
      )}
      {edition.ecart != null && <AvertissementEcart ecart={edition.ecart} />}
    </div>
  );
}
