import BarreEtatListe from '../liste/BarreEtatListe';
import BarreOutilsFlottante from '../liste/BarreOutilsFlottante';
import { oublierLecturesRecentes } from '../../lib/api';
import { cheminExportEtatAchat, type EtatAchat } from '../../lib/apiEtatsAchat';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresEtatsAchat } from '../../types/etatsAchat';

/** Barre d'état et outils d'un état Achat : Rafraîchir, Exporter (xlsx du serveur, mêmes filtres). */
export default function OutilsEtatAchat({
  etat,
  filtres,
  decompte,
  onRafraichir,
}: Readonly<{ etat: EtatAchat; filtres: FiltresEtatsAchat; decompte: string | undefined; onRafraichir: () => Promise<void> }>) {
  const exportListe = useExportListe(cheminExportEtatAchat(etat), { ...filtres }, etat);
  const alerte = exportListe.refuse ? "Accès refusé : vous n'avez pas le droit d'exporter cet état." : exportListe.erreur;
  return (
    <>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={alerte} />
      <BarreOutilsFlottante
        cle={`achat-etat-${etat}`}
        ligneSelectionnee={false}
        actions={[
          {
            id: 'rafraichir',
            onClick: () => {
              oublierLecturesRecentes();
              void onRafraichir();
            },
          },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </>
  );
}
