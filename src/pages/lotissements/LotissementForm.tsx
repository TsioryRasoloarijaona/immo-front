import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Grid2x2 } from 'lucide-react';
import PiedSaisie from '../../components/patrimoine/PiedSaisie';
import PrixArticleSaisie from '../../components/patrimoine/PrixArticleSaisie';
import SectionsSaisie from '../../components/patrimoine/SectionsSaisie';
import { ErrorState, LoadingState } from '../../components/ui';
import { createLotissement, getLotissement, updateLotissement } from '../../lib/apiLotissements';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { brouillonLot, CHAMPS_LOT, CHAMPS_PROTEGES_LOT, corpsLot, SECTIONS_LOT, useListesLot } from '../../lib/saisieLotissement';
import { useApi } from '../../lib/useApi';
import AdminGuard from '../utilisateurs/AdminGuard';
import type { LotissementDetailDto } from '../../types/lotissements';

/** `/lotissements/nouveau?trancheId=` et `/lotissements/:id/modifier`. */
export default function LotissementForm() {
  const { id } = useParams();
  const titre = id ? 'Modifier le lotissement' : 'Nouveau lotissement';
  return (
    <AdminGuard
      title={titre}
      crumbs={[{ label: 'Patrimoine' }, { label: 'Lotissements', to: '/lotissements' }, { label: titre }]}
      icon={<Grid2x2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {id ? <LotCharge key={id} id={id} /> : <CreationLot />}
    </AdminGuard>
  );
}

function CreationLot() {
  const [params] = useSearchParams();
  return <SaisieLot trancheDepart={params.get('trancheId') ?? undefined} />;
}

function LotCharge({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => getLotissement(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <SaisieLot lot={data} />;
}

function SaisieLot({ lot, trancheDepart }: Readonly<{ lot?: LotissementDetailDto; trancheDepart?: string }>) {
  const navigate = useNavigate();
  const depart = brouillonLot(lot, trancheDepart);
  const saisie = useSaisie(CHAMPS_LOT, depart);
  const listes = useListesLot(String(saisie.brouillon.trancheId));
  const occupe = lot?.estOccupe === true;
  // Les présentations sont propres à la tranche : en changer vide le choix.
  const modifierIdentite = (nom: string, valeur: string | boolean) => {
    if (nom === 'trancheId') saisie.setBrouillon((b) => ({ ...b, trancheId: valeur, presentationId: '' }));
    else saisie.modifier(nom, valeur);
  };

  function enregistrer() {
    const corps = corpsLot(saisie.brouillon, lot ? depart : undefined);
    const action = () => (lot ? updateLotissement(lot.id, corps) : createLotissement(corps));
    void saisie.envoyer(action, (l) => void navigate(`/lotissements/${l.id}`));
  }

  const partage = {
    brouillon: saisie.brouillon,
    listes,
    verrouilles: occupe ? CHAMPS_PROTEGES_LOT : [],
    champErreur: saisie.champErreur,
    messageErreur: saisie.erreur,
  };

  return (
    <div className="flex max-w-240 flex-col gap-3">
      {occupe && (
        <p role="note" className="text-body text-muted-foreground">
          Le lot est affecté à un dossier : ses surfaces, prix et titre foncier ne se modifient plus.
        </p>
      )}
      <SectionsSaisie sections={SECTIONS_LOT.slice(0, 1)} onChange={modifierIdentite} {...partage} />
      <PrixArticleSaisie brouillon={saisie.brouillon} onChange={saisie.modifier} verrouille={occupe} />
      <SectionsSaisie sections={SECTIONS_LOT.slice(1)} onChange={saisie.modifier} {...partage} />
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer} libelle={lot ? 'Enregistrer' : 'Créer'} />
    </div>
  );
}
