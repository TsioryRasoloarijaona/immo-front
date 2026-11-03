import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Contact, Trash2, Users } from 'lucide-react';
import FicheShell, { type OngletFiche } from '../../components/FicheShell';
import FormulaireTiers from '../../components/tiers/FormulaireTiers';
import OngletLectureTiers from '../../components/tiers/OngletLectureTiers';
import OngletLiensTiers from '../../components/tiers/OngletLiensTiers';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import AdminGuard from '../utilisateurs/AdminGuard';
import { oublierLecturesRecentes } from '../../lib/api';
import { creerTiers, getTiers, modifierTiers, supprimerTiers, transformerEnContact } from '../../lib/apiAdministration';
import { CONFIG_TIERS, type ConfigTiers } from '../../lib/colonnesTiers';
import { useConfirm } from '../../lib/confirmContext';
import { ongletsLecture } from '../../lib/ongletsTiers';
import { formatDate } from '../../lib/format';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { brouillonTiers, champsTiers, corpsTiers, useListesTiers, verifierTiers } from '../../lib/saisieTiers';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { ListesChoix } from '../../components/patrimoine/SectionsSaisie';
import type { FamilleTiers, FicheTiersDto } from '../../types/administration';

function BoutonIcone({ libelle, onClick, desactive, children }: Readonly<{
  libelle: string;
  onClick: () => void;
  desactive?: boolean;
  children: ReactNode;
}>) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={libelle} title={libelle} disabled={desactive} onClick={onClick}>
      {children}
    </Button>
  );
}

function CorpsFiche({ cfg, fiche, listes, erreurListes, onEnregistre }: Readonly<{
  cfg: ConfigTiers;
  fiche?: FicheTiersDto;
  listes: ListesChoix;
  erreurListes: string | null;
  onEnregistre: () => void;
}>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [onglet, setOnglet] = useState('general');
  const saisie = useSaisie(champsTiers(cfg), brouillonTiers(cfg, fiche));

  function enregistrer() {
    void saisie.envoyer(
      async () => {
        verifierTiers(cfg, saisie.brouillon);
        const corps = corpsTiers(cfg, saisie.brouillon);
        return fiche ? modifierTiers(cfg.famille, fiche.id, corps) : creerTiers(cfg.famille, corps);
      },
      (resultat) => {
        oublierLecturesRecentes();
        if (fiche) {
          toast('Enregistré.');
          onEnregistre();
        } else {
          void navigate(`${cfg.chemin}/${resultat.id}`, { replace: true });
        }
      },
    );
  }

  async function supprimer() {
    if (!fiche) return;
    const message = `Supprimer ${fiche.description || fiche.code || 'cette fiche'} ?`;
    if (!(await confirmer({ message, confirmLabel: 'Supprimer', cancelLabel: 'Annuler' }))) return;
    try {
      await supprimerTiers(cfg.famille, fiche.id);
      oublierLecturesRecentes();
      void navigate(cfg.chemin);
    } catch (err) {
      oublierLecturesRecentes();
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  async function transformer() {
    if (!fiche) return;
    const message = `Transformer ${fiche.description || fiche.code || 'ce personnel'} en contact ?`;
    if (!(await confirmer({ message, confirmLabel: 'Transformer', cancelLabel: 'Annuler' }))) return;
    try {
      await transformerEnContact(fiche.id);
      oublierLecturesRecentes();
      toast('Transformé en contact.');
      void navigate(cfg.chemin);
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  const formulaire = (o: 'general' | 'autres' | 'notes') => <FormulaireTiers cfg={cfg} onglet={o} saisie={saisie} listes={listes} />;
  const onglets: OngletFiche[] = [
    { id: 'general', libelle: 'Général', contenu: formulaire('general') },
    ...(cfg.ficheReduite ? [] : [{ id: 'autres', libelle: 'Autres', contenu: formulaire('autres') }]),
    ...(cfg.ongletContacts && fiche ? [{ id: 'contacts', libelle: 'Contacts', contenu: <OngletLiensTiers tiersId={fiche.id} /> }] : []),
    { id: 'notes', libelle: 'Notes', contenu: formulaire('notes') },
    ...(fiche ? ongletsLecture(cfg.famille).map((o) => ({
      id: o.id, libelle: o.libelle, contenu: <OngletLectureTiers famille={cfg.famille} tiersId={fiche.id} onglet={o} />,
    })) : []),
  ];

  return (
    <FicheShell
      identite={fiche && (
        <p className="px-1 text-body text-muted-foreground">
          <span className="font-medium text-foreground">{fiche.code}</span> · {fiche.description}
          {fiche.creeLe && ` · créé le ${formatDate(fiche.creeLe)}`}
          {fiche.modifieLe && ` · modifié le ${formatDate(fiche.modifieLe)}`}
        </p>
      )}
      onglets={onglets}
      ongletActif={onglet}
      onOngletChange={setOnglet}
      barreAction={
        <div className="flex flex-col gap-1">
          {erreurListes && <p role="alert" className="text-body text-destructive">Listes indisponibles : {erreurListes}</p>}
          {saisie.erreur && <p role="alert" className="text-body text-destructive">{saisie.erreur}</p>}
          <div className="flex items-center gap-0.5">
            <BoutonIcone libelle="Enregistrer" desactive={saisie.envoi} onClick={enregistrer}><Check /></BoutonIcone>
            {fiche && <BoutonIcone libelle="Supprimer" onClick={() => void supprimer()}><Trash2 /></BoutonIcone>}
            {fiche && cfg.transformable && <BoutonIcone libelle="Transformer en contact" onClick={() => void transformer()}><Contact /></BoutonIcone>}
            <BoutonIcone libelle="Retour à la liste" onClick={() => void navigate(cfg.chemin)}><ArrowLeft /></BoutonIcone>
          </div>
        </div>
      }
    />
  );
}

/** `/administration/<famille>/nouveau` et `/administration/<famille>/:id`. */
export default function TiersFiche({ famille }: Readonly<{ famille: FamilleTiers }>) {
  const cfg = CONFIG_TIERS[famille];
  const { id } = useParams();
  const { listes, erreur: erreurListes } = useListesTiers(cfg);
  const { data, loading, error, refetch } = useApi(() => (id ? getTiers(famille, id) : Promise.resolve(null)), [famille, id]);
  const titre = data?.description || data?.code || `Nouveau ${cfg.sujet}`;

  return (
    <AdminGuard title={titre} icon={<Users />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: cfg.titre, to: cfg.chemin }, { label: titre }]}>
      <div className="min-h-0 flex-1 p-3">
        {id && loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && (!id || data) && (
          <CorpsFiche key={`${id ?? 'nouveau'}:${data?.modifieLe ?? ''}`} cfg={cfg} fiche={data ?? undefined} listes={listes}
            erreurListes={erreurListes} onEnregistre={() => void refetch()} />
        )}
      </div>
    </AdminGuard>
  );
}
