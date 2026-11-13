import { useEffect, useMemo, useState } from 'react';
import { getReferentielsProjetConfig } from '../../../lib/apiProjetConfig';
import { useConfirm } from '../../../lib/confirmContext';
import {
  ajouterGroupe,
  ajouterLigne,
  appliquerCategorie,
  deposer,
  erreurGroupes,
  etatDepuisDto,
  groupeContientDecomptee,
  lignesEnOrdreArbre,
  modifierGroupe,
  modifierLigne,
  regenererCodes,
  supprimerGroupe,
  supprimerLigne,
  totauxEtat,
  versSaisie,
  type Depot,
  type EtatBordereau,
  type Glisse,
  type LigneEditee,
} from '../../../lib/saisieBordereau';
import { useConfirmationSortie } from '../../../lib/useConfirmationSortie';
import { errorMessage, refetchAllApis, useApi } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type { BordereauSaisieDto, GroupeBordereauDto, LigneBordereauDto, TotauxBordereauDto } from '../../../types/projet';
import BordereauAvecArbre from './ArbreBordereau';
import BarreEditionBordereau from './BarreEditionBordereau';
import FormulaireGroupe from './FormulaireGroupe';
import GrilleLignesEditable from './GrilleLignesEditable';

export interface SourceBordereau {
  groupes: GroupeBordereauDto[];
  lignes: LigneBordereauDto[];
  totaux: TotauxBordereauDto;
  tvaParDefaut: number | null;
  categorieParDefautId: UUID | null;
}

interface Props {
  source: SourceBordereau;
  /** Estimatif : `!verrouille` ; définitif : `modifiable`. Le serveur reste juge. */
  editable: boolean;
  cleOrdre: string;
  enregistrer: (corps: BordereauSaisieDto) => Promise<SourceBordereau>;
  onModifie?: (modifie: boolean) => void;
}

function EditeurBordereau({ source, enregistrer, onModifie }: Readonly<Omit<Props, 'editable' | 'cleOrdre'>>) {
  const confirm = useConfirm();
  const categories = useApi(getReferentielsProjetConfig, [], 'projet-config-referentiels').data?.categoriesDepense ?? [];
  const initial = useMemo(() => etatDepuisDto(source.groupes, source.lignes), [source]);
  const [base, setBase] = useState<EtatBordereau>(initial);
  const [etat, setEtat] = useState<EtatBordereau>(initial);
  const [modifie, setModifie] = useState(false);
  const [groupeSel, setGroupeSel] = useState<string | null>(null);
  const [ligneSel, setLigneSel] = useState<string | null>(null);
  const [cible, setCible] = useState<'groupe' | 'ligne'>('groupe');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useConfirmationSortie(modifie);
  useEffect(() => onModifie?.(modifie), [modifie, onModifie]);

  function muter(fn: (e: EtatBordereau) => EtatBordereau) {
    setEtat(fn);
    setModifie(true);
    setErreur(null);
  }

  function remplacer(neuf: EtatBordereau) {
    setEtat(neuf);
    setBase(neuf);
    setModifie(false);
    setGroupeSel(null);
    setLigneSel(null);
  }

  const groupeEdite = etat.groupes.find((g) => g.id === groupeSel);
  const refusSuppression =refus(etat, cible, groupeSel, ligneSel);

  async function supprimer() {
    if (!(await confirm('Êtes-vous sûr de vouloir supprimer ce nœud ?'))) return;
    if (cible === 'ligne' && ligneSel) muter((e) => supprimerLigne(e, ligneSel));
    else if (groupeSel) muter((e) => supprimerGroupe(e, groupeSel));
    setGroupeSel(null);
    setLigneSel(null);
  }

  async function annuler() {
    if (modifie && !(await confirm({ title: 'Abandonner les modifications ?', message: 'Les modifications non enregistrées de cette fiche seront perdues.', confirmLabel: 'Abandonner' }))) return;
    setEtat(base);
    setModifie(false);
    setErreur(null);
  }

  async function sauvegarder() {
    const refusGroupes = erreurGroupes(etat);
    if (refusGroupes) {
      setErreur(refusGroupes);
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await enregistrer(versSaisie(etat));
      remplacer(etatDepuisDto(reponse.groupes, reponse.lignes));
      refetchAllApis();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  const surDepot = (s: Glisse, d: Depot) => muter((e) => deposer(e, s, d));

  return (
    <div className="flex flex-col gap-2">
      <BarreEditionBordereau
        categories={categories}
        groupeSelectionne={groupeSel !== null}
        refusSuppression={refusSuppression}
        enCours={enCours}
        actions={{
          onAjouterLigne: () => muter((e) => ajouterLigne(e, groupeSel, source)),
          onAjouterGroupe: () => muter((e) => ajouterGroupe(e, groupeSel)),
          onSupprimer: () => void supprimer(),
          onRegenerer: () => muter(regenererCodes),
          onCategorie: (id) => groupeSel && muter((e) => appliquerCategorie(e, groupeSel, id)),
          onEnregistrer: () => void sauvegarder(),
          onAnnuler: () => void annuler(),
        }}
      />
      {erreur && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-body text-destructive">
          {erreur}
        </div>
      )}
      {groupeEdite && <FormulaireGroupe groupe={groupeEdite} onChanger={(patch) => muter((e) => modifierGroupe(e, groupeEdite.id, patch))} />}
      <BordereauAvecArbre
        groupes={etat.groupes}
        lignes={[]}
        totaux={totauxEtat(etat.lignes)}
        cleOrdre=""
        edition={{
          selection: groupeSel,
          onSelection: (id) => {
            setGroupeSel(id);
            setCible('groupe');
          },
          onDeposer: surDepot,
          grille: (ids) => (
            <GrilleLignesEditable
              lignes={lignesEnOrdreArbre(etat.groupes, ids ? etat.lignes.filter((l) => l.groupeId !== null && ids.has(l.groupeId)) : etat.lignes)}
              categories={categories}
              selection={ligneSel}
              onSelection={(id) => {
                setLigneSel(id);
                setCible('ligne');
              }}
              onChanger={(id, patch: Partial<LigneEditee>) => muter((e) => modifierLigne(e, id, patch))}
              onDeposer={surDepot}
            />
          ),
        }}
      />
    </div>
  );
}

/** Motif de refus du bouton « Supprimer », ou null s'il est permis. */
function refus(etat: EtatBordereau, cible: 'groupe' | 'ligne', groupeSel: string | null, ligneSel: string | null): string | null {
  if (cible === 'ligne' && ligneSel) {
    return etat.lignes.find((l) => l.id === ligneSel)?.decomptee ? 'Vous ne pouvez pas supprimer cette ligne' : null;
  }
  if (!groupeSel) return 'Sélectionnez un groupe ou une ligne';
  return groupeContientDecomptee(etat, groupeSel) ? 'Vous ne pouvez pas supprimer ce groupe' : null;
}

/** Bordereau en lecture, ou en saisie quand `editable` : l'arbre est rechargé depuis la réponse de l'enregistrement. */
export default function BordereauModifiable({ editable, cleOrdre, ...reste }: Readonly<Props>) {
  if (editable) return <EditeurBordereau {...reste} />;
  const { source } = reste;
  return <BordereauAvecArbre groupes={source.groupes} lignes={source.lignes} totaux={source.totaux} cleOrdre={cleOrdre} />;
}
