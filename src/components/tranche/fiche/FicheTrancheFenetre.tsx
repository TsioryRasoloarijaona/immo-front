import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Download, Map, Pencil, Plus, Printer, TrendingUp } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import DialogueChargerDepuisTranche from '../../patrimoine/DialogueChargerDepuisTranche';
import DialogueMiseAJourSchemas from '../../patrimoine/DialogueMiseAJourSchemas';
import DialoguePremieresRelances from '../../patrimoine/DialoguePremieresRelances';
import DialoguePrevisionsBase from '../../patrimoine/DialoguePrevisionsBase';
import DialogueFicheReservation from '../../patrimoine/impressions/DialogueFicheReservation';
import DialogueRelance2 from '../../patrimoine/impressions/DialogueRelance2';
import MenuImprimerTranche from '../../patrimoine/impressions/MenuImprimerTranche';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useSuppression } from '../../patrimoine/fiche/outilsFiche';
import { Badge } from '../../ui';
import { bandeTranche, basTranche, enteteTranche } from './ongletsTranche';
import { getTranche } from '../../../lib/api';
import { deleteTranche } from '../../../lib/apiPatrimoine';
import { useAuth } from '../../../lib/auth';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { estAdministrateur } from '../../../lib/roles';
import { useApi } from '../../../lib/useApi';
import { useOngletsTranche } from '../../../lib/useOngletsTranche';

type DialogueTranche = 'previsions' | 'schemas' | 'charger' | 'relances' | 'relance2' | 'reservation';

function FicheTranche({ id, voisins, onFermer, onChargee }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void; onChargee: () => void }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTranche(id), [id]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const [dialogue, setDialogue] = useState<DialogueTranche | null>(null);
  const grilles = useOngletsTranche(id, () => void refetch());
  const fermerDialogue = () => setDialogue(null);
  const { erreur, supprimer } = useSuppression({
    titre: 'Supprimer la tranche',
    message: 'La tranche, ses onglets, ses habilitations, pièces jointes et notes seront supprimés. Continuer ?',
    action: () => deleteTranche(id),
    apres: onFermer,
  });
  // `!t` : un rechargement (plancher couvert enregistré) garde la fiche et l'onglet ouvert.
  const adminPropres = [
    { id: 'previsions', libelle: 'Prévisions de base', icone: TrendingUp, onClick: () => setDialogue('previsions') },
    { id: 'schemas', libelle: 'Mise à jour des schémas', icone: CalendarClock, onClick: () => setDialogue('schemas') },
    { id: 'charger', libelle: 'Charger depuis une tranche', icone: Download, onClick: () => setDialogue('charger') },
    { id: 'relances', libelle: 'Premières relances', icone: Printer, onClick: () => setDialogue('relances') },
  ];

  return (
    <>
      <FenetrePatrimoine
        type="tranche"
        nature="Tranche"
        titre={t?.description || t?.code || 'Tranche'}
        badge={
          t && (
            <>
              <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
              {t.standingLibelle && <Badge tone="info">{t.standingLibelle}</Badge>}
              {t.estEnVente && <Badge tone="info">Vente</Badge>}
              {t.estEnLocation && <Badge tone="info">Location</Badge>}
            </>
          )
        }
        voisins={voisins}
        onFermer={onFermer}
        trace={t ?? undefined}
        etat={{ chargement: loading && !t, erreur: t ? null : error, pret: !!t, introuvable: "Cette tranche n'existe pas." }}
        erreur={erreur}
        ruban={(aller) => ({
          propres: [
            { id: 'plans', libelle: 'Plans', icone: Map, onClick: () => void navigate(`/tranches/${id}/plans`) },
            ...(admin ? adminPropres : []),
          ],
          enSuite: (
            <>
              <MenuImprimerTranche trancheId={id} onDialogue={setDialogue} />
              <ActionAdmin to={`/tranches/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
              <ActionAdmin to={`/articles/nouveau?trancheId=${id}`} libelle="Nouvel article" variant="outline" icone={<Plus data-icon="inline-start" />} />
            </>
          ),
          piecesJointes: { onClick: () => aller('pieces') },
          supprimer,
        })}
        bande={t && bandeTranche(t)}
        entete={t ? enteteTranche(t) : undefined}
        bas={t ? basTranche(t, id, grilles) : []}
      />
      {dialogue === 'previsions' && <DialoguePrevisionsBase trancheId={id} onClose={fermerDialogue} />}
      {dialogue === 'schemas' && <DialogueMiseAJourSchemas trancheId={id} onClose={fermerDialogue} />}
      {dialogue === 'relances' && <DialoguePremieresRelances trancheId={id} onClose={fermerDialogue} />}
      {dialogue === 'relance2' && <DialogueRelance2 trancheId={id} onClose={fermerDialogue} />}
      {dialogue === 'reservation' && <DialogueFicheReservation trancheId={id} onClose={fermerDialogue} />}
      {dialogue === 'charger' && <DialogueChargerDepuisTranche trancheId={id} onClose={fermerDialogue} onCharge={onChargee} />}
    </>
  );
}

/** Fiche de la tranche en fenêtre flottante ; « Charger depuis une tranche » remonte les onglets (grilles relues). */
export default function FicheTrancheFenetre(props: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const [version, setVersion] = useState(0);
  return <FicheTranche key={version} {...props} onChargee={() => setVersion((v) => v + 1)} />;
}
