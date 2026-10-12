import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, LockOpen, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ChampsTrace from '../../components/patrimoine/ChampsTrace';
import { BlocFiche } from '../../components/patrimoine/FicheDeclaree';
import { Badge, Card, ErrorState, Field, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AdminGuard from '../utilisateurs/AdminGuard';
import { deleteEntiteJuridique, getEntiteJuridique, listDevises } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EntiteJuridiqueDto } from '../../types';
import { ADMINISTRATION, AUTRES, COORDONNEES, IDENTIFICATION, PARTS, nouvelleEntite, versEcriture } from './champsEntite';
import FormulaireEntite from './FormulaireEntite';
import { TableRepartition } from './RepartitionEntite';

const ENTETE = {
  icon: <Landmark />,
  accent: 'var(--sec-projet)',
  accentBg: 'var(--sec-projet-bg)',
};
const LISTE = { label: 'Entités juridiques', to: '/entites-juridiques' };

/** `/entites-juridiques/nouveau` : création, devise par défaut d'OMRAN présélectionnée. */
export function NouvelleEntiteJuridique() {
  const navigate = useNavigate();
  const devises = useApi(listDevises, []);
  const parDefaut = devises.data?.find((d) => d.parDefaut)?.id;
  return (
    <AdminGuard title="Nouvelle entité juridique" {...ENTETE} crumbs={[LISTE, { label: 'Nouvelle' }]}>
      {devises.error && <ErrorState message={devises.error} />}
      {!devises.error && !devises.data && <LoadingState />}
      {!devises.error && devises.data && (
        <FormulaireEntite
          initial={nouvelleEntite(parDefaut)}
          onEnregistre={(e) => void navigate(`/entites-juridiques/${e.id}`)}
          onAnnuler={() => void navigate('/entites-juridiques')}
        />
      )}
    </AdminGuard>
  );
}

export default function EntiteJuridiqueFiche() {
  const { id = '' } = useParams();
  return <Fiche key={id} id={id} />;
}

/** OMRAN ouvre toute fiche existante verrouillée ; « Débloquer » passe en édition, côté client seulement. */
function Fiche({ id }: Readonly<{ id: string }>) {
  const { data: entite, loading, error, refetch } = useApi(() => getEntiteJuridique(id), [id]);
  const admin = estAdministrateur(useAuth().user);
  const [edition, setEdition] = useState(false);

  if (loading && !entite) return <PageShell title="Entité juridique" {...ENTETE}><LoadingState /></PageShell>;
  if (error) return <PageShell title="Entité juridique" {...ENTETE} crumbs={[LISTE]}><ErrorState message={error} /></PageShell>;
  if (!entite) return null;

  const fermer = () => {
    setEdition(false);
    void refetch();
  };

  return (
    <PageShell title={entite.description || entite.code || 'Entité juridique'} crumbs={[LISTE, { label: entite.code ?? '' }]} {...ENTETE}>
      {edition ? (
        <FormulaireEntite id={entite.id} initial={versEcriture(entite)} onEnregistre={fermer} onAnnuler={fermer} />
      ) : (
        <>
          <ActionsEntite entite={entite} admin={admin} onDebloquer={() => setEdition(true)} />
          <LectureEntite entite={entite} />
        </>
      )}
    </PageShell>
  );
}

function ActionsEntite({ entite, admin, onDebloquer }: Readonly<{ entite: EntiteJuridiqueDto; admin: boolean; onDebloquer: () => void }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    const ok = await confirmer({
      title: "Supprimer l'entité",
      message: `Voulez-vous vraiment supprimer l'entité « ${entite.description ?? entite.code} » ? Ses séquences, habilitations et sa répartition seront supprimées avec elle.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    setSuppression(true);
    try {
      await deleteEntiteJuridique(entite.id);
      toast({ texte: 'Entité supprimée.', variante: 'succes' });
      void navigate('/entites-juridiques');
    } catch (err) {
      // 409 : le message du serveur liste ce qui la référence (programmes, règlements…).
      toast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setSuppression(false);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => void navigate('/entites-juridiques')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>
      {entite.actif ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
      {admin && (
        <>
          <Button variant="outline" size="sm" className="ml-auto" disabled={suppression} onClick={() => void supprimer()}>
            <Trash2 data-icon="inline-start" /> {suppression ? 'Suppression…' : 'Supprimer'}
          </Button>
          <Button size="sm" onClick={onDebloquer}>
            <LockOpen data-icon="inline-start" /> Débloquer
          </Button>
        </>
      )}
    </div>
  );
}

function LectureEntite({ entite }: Readonly<{ entite: EntiteJuridiqueDto }>) {
  const [onglet, setOnglet] = useState('coordonnees');
  return (
    <div className="flex flex-col gap-3">
      <BlocFiche titre="Identification" defs={IDENTIFICATION} fiche={entite} accent="var(--sec-projet)" />
      <Tabs value={onglet} onValueChange={(v) => setOnglet(v as string)}>
        <TabsList>
          <TabsTrigger value="coordonnees">Coordonnées</TabsTrigger>
          <TabsTrigger value="administration">Administration</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="autres">Autres</TabsTrigger>
        </TabsList>
        <TabsContent value="coordonnees"><BlocFiche titre="Coordonnées" defs={COORDONNEES} fiche={entite} /></TabsContent>
        <TabsContent value="administration"><BlocFiche titre="Administration" defs={ADMINISTRATION} fiche={entite} /></TabsContent>
        <TabsContent value="repartition">
          <div className="flex flex-col gap-3">
            <BlocFiche
              titre="Parts"
              defs={PARTS}
              fiche={entite}
              suite={<Field label="Groupe d'actionnaires" value={entite.groupeLibelle || entite.groupeCode || undefined} />}
            />
            <Card title="Répartition">
              <TableRepartition lignes={entite.repartition ?? []} nombreParts={entite.nombreParts} />
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="autres">
          <BlocFiche
            titre="Autres"
            defs={AUTRES}
            fiche={entite}
            suite={
              <ChampsTrace
                creePar={entite.creePar ?? undefined}
                creeLe={entite.creeLe ?? undefined}
                modifiePar={entite.modifiePar ?? undefined}
                modifieLe={entite.modifieLe ?? undefined}
              />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
