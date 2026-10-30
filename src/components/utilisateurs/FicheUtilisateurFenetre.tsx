import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, RotateCcw } from 'lucide-react';
import FenetreFiche from '../fiche/FenetreFiche';
import RubanFiche from '../fiche/RubanFiche';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import ArbreHabilitations from './ArbreHabilitations';
import OngletInformations from './OngletInformations';
import { ListeCases, RestrictionsLues } from './OngletsCases';
import { useConfirm } from '../../lib/confirmContext';
import { aplatirHabilitations, ciblesCochees, projetsCoches, type ArbreHabilitations as Arbre } from '../../lib/habilitations';
import { memesCodes } from '../../lib/arbreDroits';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { estExempte } from '../../lib/roles';
import { corpsUtilisateur, memesIds, NOUVEAU_UTILISATEUR, saisieDepuisFiche, saisieModifiee, type SaisieUtilisateur } from '../../lib/saisieUtilisateur';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import {
  creerUtilisateur, getHabilitations, getUtilisateur, getUtilisateursReferences, modifierUtilisateur,
  remplacerComptesDepot, remplacerHabilitations, remplacerRolesUtilisateur,
} from '../../lib/apiUtilisateurs';
import type { CompteAReinitialiser } from '../../pages/utilisateurs/ReinitialiserMotDePasse';
import type { NoeudHabilitationDto, UtilisateurFicheDto, UtilisateurReferencesDto } from '../../types/utilisateurs';

type Props = Readonly<{ voisins?: VoisinsFiche; onFermer: () => void; onCree: (id: string) => void }>;
type Onglet = 'informations' | 'roles' | 'comptes' | 'restrictions' | 'habilitations';

const NATURE = 'Compte utilisateur';
const SANS_RESTRICTION = 'Ce compte n\'aura plus de restriction : il verra tous les projets';

function Attente({ erreur, voisins, onFermer, onReessayer }: Readonly<{ erreur: string | null; voisins?: VoisinsFiche; onFermer: () => void; onReessayer: () => void }>) {
  return (
    <FenetreFiche nature={NATURE} titre={NATURE} voisins={voisins} onFermer={onFermer}>
      {erreur ? (
        <div className="flex flex-col items-center gap-2 p-4">
          <ErrorState message={erreur} />
          <Button type="button" variant="outline" size="sm" onClick={onReessayer}>
            <RotateCcw data-icon="inline-start" /> Réessayer
          </Button>
        </div>
      ) : (
        <LoadingState />
      )}
    </FenetreFiche>
  );
}

function Onglets({ actif, habilitationsActives, onChoisir }: Readonly<{ actif: Onglet; habilitationsActives: boolean; onChoisir: (o: Onglet) => void }>) {
  const onglets: ReadonlyArray<[Onglet, string, boolean]> = [
    ['informations', 'Informations', true],
    ['roles', 'Rôles', true],
    ['comptes', 'Comptes de dépôt', true],
    ['restrictions', 'Restrictions', true],
    ['habilitations', 'Habilitations', habilitationsActives],
  ];
  return (
    <div role="tablist" aria-label="Fiche du compte" className="flex shrink-0 gap-1 border-b border-border px-3">
      {onglets.map(([id, libelle, actifPossible]) => (
        <button key={id} type="button" role="tab" aria-selected={actif === id} disabled={!actifPossible}
          title={actifPossible ? undefined : 'Enregistrez le compte pour gérer ses habilitations'}
          className={`h-8 border-b-2 px-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-(--brand) disabled:opacity-45 ${actif === id ? 'border-(--brand) font-semibold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => onChoisir(id)}>
          {libelle}
        </button>
      ))}
    </div>
  );
}

function FenetreUtilisateur({ initiale, refs, habilitations, voisins, onFermer, onCree }: Props & Readonly<{
  initiale: UtilisateurFicheDto | null;
  refs: UtilisateurReferencesDto;
  habilitations: NoeudHabilitationDto[] | null;
}>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const [fiche, setFiche] = useState(initiale);
  const base = saisieDepuisFiche(fiche);
  const [saisie, setSaisie] = useState<SaisieUtilisateur>(base);
  const [roleIds, setRoleIds] = useState<string[]>(initiale?.roleIds ?? []);
  const [compteIds, setCompteIds] = useState<string[]>(initiale?.compteDepotIds ?? []);
  const [arbre] = useState<Arbre | null>(() => (habilitations ? aplatirHabilitations(habilitations) : null));
  const [cochesBase, setCochesBase] = useState<Set<string>>(() => arbre?.initiaux ?? new Set());
  const [coches, setCoches] = useState<Set<string>>(cochesBase);
  const [onglet, setOnglet] = useState<Onglet>('informations');
  const [erreurs, setErreurs] = useState<Partial<Record<keyof SaisieUtilisateur, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [avertissement, setAvertissement] = useState<string | null>(null);

  const modifiee = saisieModifiee(saisie, base) || !memesIds(roleIds, fiche?.roleIds ?? []) || !memesIds(compteIds, fiche?.compteDepotIds ?? []) || !memesCodes(coches, cochesBase);

  async function choisirPersonnel(id: string) {
    setSaisie((s) => ({ ...s, personnelId: id }));
    const personnel = refs.personnels.find((p) => p.id === id);
    if (!personnel) return;
    const oui = await confirmer({ title: 'Personnel', message: 'Voulez-vous charger les informations du personnel ?', confirmLabel: 'Oui', cancelLabel: 'Non' });
    if (oui) setSaisie((s) => ({ ...s, description: personnel.description ?? s.description }));
  }

  function valider(): boolean {
    const e: Partial<Record<keyof SaisieUtilisateur, string>> = {};
    if (!fiche && !saisie.code.trim()) e.code = 'Le code est obligatoire';
    if (!saisie.description.trim()) e.description = 'La description est obligatoire';
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function ecrireHabilitations(courant: UtilisateurFicheDto) {
    if (!arbre || memesCodes(coches, cochesBase)) return;
    const avant = projetsCoches(arbre, cochesBase);
    const rendu = await remplacerHabilitations(courant.id, { noeuds: ciblesCochees(arbre, coches) });
    const apres = aplatirHabilitations(rendu).initiaux;
    setCochesBase(apres);
    setCoches(apres);
    const roles = courant.roleIds.map((r) => ({ roles: [refs.roles.find((x) => x.id === r)?.code ?? ''] }));
    if (avant > 0 && projetsCoches(arbre, apres) === 0 && !roles.some(estExempte)) setAvertissement(SANS_RESTRICTION);
  }

  async function enregistrer() {
    setMessage(null);
    setAvertissement(null);
    if (!valider()) return;
    let courant = fiche;
    let ecrit = false;
    try {
      if (!courant) {
        courant = await creerUtilisateur(corpsUtilisateur(saisie, true));
        setFiche(courant);
        ecrit = true;
      } else if (saisieModifiee(saisie, base)) {
        courant = await modifierUtilisateur(courant.id, corpsUtilisateur(saisie, false));
        setFiche(courant);
        ecrit = true;
      }
      if (!memesIds(roleIds, courant.roleIds)) {
        courant = await remplacerRolesUtilisateur(courant.id, { roleIds });
        setFiche(courant);
        ecrit = true;
      }
      if (!memesIds(compteIds, courant.compteDepotIds)) {
        courant = await remplacerComptesDepot(courant.id, { compteIds });
        setFiche(courant);
        ecrit = true;
      }
      await ecrireHabilitations(courant);
    } catch (err) {
      setMessage(ecrit ? `Enregistrement partiel, le reste n'a pas été écrit : ${errorMessage(err)}` : errorMessage(err));
      if (ecrit) refetchAllApis();
      return;
    }
    refetchAllApis();
    if (!initiale) onCree(courant.id);
  }

  function reinitialiserMotDePasse() {
    if (!fiche) return;
    const compte: CompteAReinitialiser = { username: fiche.code ?? undefined, description: fiche.description ?? undefined, email: fiche.email ?? undefined };
    void navigate(`/utilisateurs/reinitialiser-mot-de-passe?admUserId=${fiche.id}`, { state: compte });
  }

  return (
    <FenetreFiche nature={NATURE} titre={fiche?.code || 'Nouveau compte'} voisins={voisins} onFermer={onFermer} enEdition={modifiee}>
      <RubanFiche
        enregistrer={{ onClick: () => void enregistrer(), disabled: !modifiee }}
        propres={fiche ? [{ id: 'mot-de-passe', libelle: 'Mot de passe', icone: KeyRound, onClick: reinitialiserMotDePasse }] : []}
      />
      {message && <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message}</p>}
      {avertissement && <p role="status" className="shrink-0 px-4 pt-2 text-label text-amber-700">{avertissement}</p>}
      <Onglets actif={onglet} habilitationsActives={!!arbre} onChoisir={setOnglet} />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {onglet === 'informations' && (
          <OngletInformations saisie={saisie} refs={refs} codeFige={!!fiche} erreurs={erreurs}
            onChange={(patch) => setSaisie((s) => ({ ...s, ...patch }))} onPersonnel={(id) => void choisirPersonnel(id)} />
        )}
        {onglet === 'roles' && <ListeCases titre="Rôles" items={refs.roles} coches={roleIds} onChange={setRoleIds} />}
        {onglet === 'comptes' && <ListeCases titre="Comptes de dépôt" items={refs.comptesDepot} coches={compteIds} onChange={setCompteIds} />}
        {onglet === 'restrictions' && fiche && <RestrictionsLues restrictions={fiche.restrictions} />}
        {onglet === 'restrictions' && !fiche && <p className="text-body text-muted-foreground">Calculées à partir des rôles, après enregistrement du compte.</p>}
        {onglet === 'habilitations' && arbre && <ArbreHabilitations arbre={arbre} coches={coches} onChange={setCoches} />}
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'un compte en fenêtre (`id` = `nouveau` en création) ; références et arbre sont chargés à l'ouverture. */
export default function FicheUtilisateurFenetre({ id, voisins, onFermer, onCree }: Props & Readonly<{ id: string }>) {
  const creation = id === NOUVEAU_UTILISATEUR;
  const refs = useApi(() => getUtilisateursReferences(), []);
  const fiche = useApi(() => (creation ? Promise.resolve(null) : getUtilisateur(id)), [id]);
  const habilitations = useApi(() => (creation ? Promise.resolve(null) : getHabilitations(id)), [id]);
  const erreur = refs.error ?? fiche.error ?? habilitations.error;

  if (erreur || !refs.data || (!creation && (!fiche.data || !habilitations.data))) {
    return (
      <Attente erreur={erreur} voisins={voisins} onFermer={onFermer}
        onReessayer={() => void Promise.all([refs.refetch(), fiche.refetch(), habilitations.refetch()])} />
    );
  }
  return <FenetreUtilisateur key={id} initiale={fiche.data} refs={refs.data} habilitations={habilitations.data} voisins={voisins} onFermer={onFermer} onCree={onCree} />;
}
