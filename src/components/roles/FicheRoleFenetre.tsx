import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import FenetreFiche from '../fiche/FenetreFiche';
import RubanFiche from '../fiche/RubanFiche';
import { useSuppression } from '../patrimoine/fiche/outilsFiche';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import ArbreDroits from './ArbreDroits';
import { creerRole, getArbreDroits, getRole, modifierRole, remplacerDroitsRole, supprimerRole } from '../../lib/apiRoles';
import { memesCodes } from '../../lib/arbreDroits';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { corpsRole, NOUVEAU_ROLE, RESTRICTIONS, saisieDepuisRole, saisieModifiee } from '../../lib/saisieRole';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import { pluriel } from '../../lib/format';
import type { NoeudDroitDto, RoleDto } from '../../types/roles';

type Props = Readonly<{ voisins?: VoisinsFiche; onFermer: () => void; onCree: (id: string) => void }>;

const NATURE = 'Rôle';

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

function FenetreRole({ role, arbre, voisins, onFermer, onCree, onMaj }: Props & Readonly<{
  role: RoleDto | null;
  arbre: NoeudDroitDto[];
  onMaj: (r: RoleDto) => void;
}>) {
  const base = saisieDepuisRole(role);
  const codesBase = new Set(role?.codesDroits ?? []);
  const [saisie, setSaisie] = useState(base);
  const [coches, setCoches] = useState<Set<string>>(codesBase);
  const [idCree, setIdCree] = useState<string | null>(null);
  const [erreurCode, setErreurCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const verrouille = role?.verrouille ?? false;
  const idCourant = role?.id ?? idCree;
  const { erreur: erreurSuppression, supprimer } = useSuppression({
    titre: 'Supprimer le rôle',
    message: 'Le rôle et ses droits seront supprimés. Continuer ?',
    action: () => supprimerRole(role?.id ?? ''),
    apres: onFermer,
  });
  const modifiee = saisieModifiee(saisie, base) || !memesCodes(coches, codesBase);
  const maj = (champ: 'code' | 'description') => (e: { target: { value: string } }) => setSaisie((s) => ({ ...s, [champ]: e.target.value }));

  async function ecrireDroits(id: string, courant: RoleDto): Promise<RoleDto | null> {
    if (memesCodes(coches, new Set(courant.codesDroits))) return courant;
    try {
      return await remplacerDroitsRole(id, { codes: [...coches] });
    } catch (err) {
      setMessage(`Les informations du rôle sont enregistrées, mais pas ses droits : ${errorMessage(err)}`);
      return null;
    }
  }

  async function enregistrer() {
    setMessage(null);
    setErreurCode(null);
    if (!idCourant && !saisie.code.trim()) {
      setErreurCode('Le code est obligatoire');
      return;
    }
    let ecrit: RoleDto;
    try {
      ecrit = idCourant ? await modifierRole(idCourant, corpsRole(saisie, false)) : await creerRole(corpsRole(saisie, true));
    } catch (err) {
      setMessage(errorMessage(err));
      return;
    }
    if (!idCourant) setIdCree(ecrit.id);
    onMaj(ecrit);
    const final = await ecrireDroits(ecrit.id, ecrit);
    refetchAllApis();
    if (final) {
      onMaj(final);
      if (!idCourant) onCree(final.id);
    }
  }

  return (
    <FenetreFiche nature={NATURE} titre={role?.code || 'Nouveau rôle'} voisins={voisins} onFermer={onFermer} enEdition={modifiee}>
      <RubanFiche
        enregistrer={verrouille ? undefined : { onClick: () => void enregistrer(), disabled: !modifiee }}
        propres={[]}
        supprimer={role && !verrouille ? supprimer : undefined}
      />
      {verrouille && (
        <p role="status" className="shrink-0 px-4 pt-2 text-label text-muted-foreground">
          Rôle Administrateur : non modifiable, il protège l'accès à l'administration
        </p>
      )}
      {(message ?? erreurSuppression) && (
        <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message ?? erreurSuppression}</p>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto p-4">
        <Field>
          <FieldLabel htmlFor="role-code">Code{role ? '' : ' *'}</FieldLabel>
          <Input id="role-code" value={saisie.code} maxLength={255} disabled={!!idCourant || verrouille} readOnly={!!idCourant}
            aria-invalid={erreurCode ? true : undefined} onChange={maj('code')} />
          {erreurCode && <p role="alert" className="text-micro text-destructive">{erreurCode}</p>}
        </Field>
        <Field>
          <FieldLabel htmlFor="role-description">Description</FieldLabel>
          <Input id="role-description" value={saisie.description} maxLength={255} disabled={verrouille} onChange={maj('description')} />
        </Field>
        <fieldset className="col-span-full rounded-md border border-border p-3">
          <legend className="px-1 text-label font-medium">Restrictions</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {RESTRICTIONS.map(({ cle, libelle }) => (
              <label key={cle} className="flex items-center gap-2 text-body">
                <input type="checkbox" checked={saisie.restrictions[cle]} disabled={verrouille}
                  onChange={(e) => setSaisie((s) => ({ ...s, restrictions: { ...s.restrictions, [cle]: e.target.checked } }))} />
                {libelle}
              </label>
            ))}
          </div>
        </fieldset>
        {!!role?.droitsHorsArbre && (
          <p className="col-span-full text-body text-muted-foreground">
            {pluriel(role.droitsHorsArbre, "droit hérité d'OMRAN hors de l'arbre, conservé", "droits hérités d'OMRAN hors de l'arbre, conservés")}
          </p>
        )}
        <ArbreDroits noeuds={arbre} coches={coches} onChange={setCoches} desactive={verrouille} />
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'un rôle en fenêtre (`id` = `nouveau` en création) ; l'arbre est chargé une fois par ouverture. */
export default function FicheRoleFenetre({ id, voisins, onFermer, onCree }: Props & Readonly<{ id: string }>) {
  const creation = id === NOUVEAU_ROLE;
  const role = useApi(() => (creation ? Promise.resolve(null) : getRole(id)), [id]);
  const arbre = useApi(() => getArbreDroits(), []);
  const [maj, setMaj] = useState<RoleDto | null>(null);
  const courant = maj?.id === id ? maj : role.data;
  const erreur = role.error ?? arbre.error;

  if (erreur || !arbre.data || (!creation && !courant)) {
    return <Attente erreur={erreur} voisins={voisins} onFermer={onFermer} onReessayer={() => void Promise.all([role.refetch(), arbre.refetch()])} />;
  }
  return <FenetreRole key={id} role={courant} arbre={arbre.data} voisins={voisins} onFermer={onFermer} onCree={onCree} onMaj={setMaj} />;
}
