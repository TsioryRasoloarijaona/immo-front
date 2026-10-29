import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import { SectionFiche } from '../../patrimoine/FicheSections';
import PiecesJointesBloc from '../../patrimoine/PiecesJointesBloc';
import ZonesProjet from '../../patrimoine/ZonesProjet';
import ChampsDe, { PageChamps, PageTrace } from '../../patrimoine/fiche/ChampsDe';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useImprimer, useSuppression } from '../../patrimoine/fiche/outilsFiche';
import Pagination from '../../Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { getProjet, listProjetTranches } from '../../../lib/api';
import { fichePdf } from '../../../lib/apiFichesPdf';
import { deleteProjet } from '../../../lib/apiPatrimoine';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { ongletsTransverses } from '../../../lib/ongletsTransverses';
import { SECTIONS_PROJET } from '../../../lib/saisieProjet';
import { useApi } from '../../../lib/useApi';

const [GENERAL, DELAIS, COORDONNEES, RESPONSABLES, AUTRES] = SECTIONS_PROJET;

function TranchesProjet({ projetId }: Readonly<{ projetId: string }>) {
  const [page, setPage] = useState(0);
  const tranches = useApi(() => listProjetTranches(projetId, { page, size: 20 }), [projetId, page]);
  return (
    <div className="flex flex-col gap-2">
      {tranches.loading && <LoadingState />}
      {tranches.error && <ErrorState message={tranches.error} />}
      {tranches.data && tranches.data.content.length === 0 && <EmptyState title="Aucune tranche" />}
      {tranches.data?.content.map((t) => (
        <Link
          key={t.id}
          to={`/tranches/${t.id}`}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label no-underline hover:bg-muted"
        >
          <span className="font-medium text-foreground">{t.description}</span>
          <span className="text-muted-foreground">{t.code}</span>
          <span className="text-muted-foreground">{t.ville}</span>
        </Link>
      ))}
      {tranches.data && (
        <Pagination page={tranches.data.page} totalPages={tranches.data.totalPages} totalElements={tranches.data.totalElements} onPageChange={setPage} />
      )}
    </div>
  );
}

/** Fiche du programme (projet) en fenêtre flottante ; la saisie reste sur `/projets/:id/modifier`. */
export default function FicheProjetFenetre({ id, voisins, onFermer }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: projet, loading, error } = useApi(() => getProjet(id), [id]);
  const imprimer = useImprimer(() => fichePdf('projets', id));
  const { erreur, supprimer } = useSuppression({
    titre: 'Supprimer le programme',
    message: 'Le programme, ses zones et ses habilitations seront supprimés. Continuer ?',
    action: () => deleteProjet(id),
    apres: onFermer,
  });

  return (
    <FenetrePatrimoine
      type="projet"
      nature="Projet"
      titre={projet?.description || projet?.code || 'Projet'}
      badge={projet?.code}
      voisins={voisins}
      onFermer={onFermer}
      trace={projet ?? undefined}
      etat={{ chargement: loading, erreur: error, pret: !!projet, introuvable: "Ce projet n'existe pas." }}
      erreur={erreur}
      ruban={(aller) => ({
        propres: [],
        enSuite: (
          <>
            <ActionAdmin to={`/projets/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
            <ActionAdmin to={`/tranches/nouveau?projetId=${id}`} libelle="Nouvelle tranche" variant="outline" icone={<Plus data-icon="inline-start" />} />
          </>
        ),
        imprimer,
        piecesJointes: { onClick: () => aller('pieces') },
        supprimer,
      })}
      bande={projet && <ChampsDe sections={[GENERAL]} source={projet} />}
      entete={
        projet
          ? [
              { id: 'responsables', titre: RESPONSABLES.titre, contenu: <PageChamps sections={[RESPONSABLES]} source={projet} /> },
              { id: 'trace', titre: 'Traçabilité', contenu: <PageTrace source={projet} /> },
            ]
          : undefined
      }
      bas={
        projet
          ? [
              { id: 'tranches', libelle: 'Tranches',contenu: <TranchesProjet projetId={id} /> },
              { id: 'zones', libelle: 'Zones', contenu: <ZonesProjet projetId={id} /> },
              { id: 'delais', libelle: DELAIS.titre, contenu: <SectionFiche section={DELAIS} source={projet} /> },
              { id: 'coordonnees', libelle: COORDONNEES.titre, contenu: <SectionFiche section={COORDONNEES} source={projet} /> },
              { id: 'autres', libelle: AUTRES.titre, contenu: <SectionFiche section={AUTRES} source={projet} /> },
              { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="projet" id={id} /> },
              { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="projets" id={id} /> },
              ...ongletsTransverses('projet', id),
            ]
          : []
      }
    />
  );
}
