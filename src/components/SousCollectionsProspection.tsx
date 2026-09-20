import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { EmptyState } from './ui';
import { Button } from './ui/button';
import RefSelect from './RefSelect';
import {
  addProspectionCategorie,
  addProspectionProfil,
  addProspectionTypeBien,
  addProspectionVille,
  listProspectionCategories,
  listProspectionProfils,
  listProspectionTypesBien,
  listProspectionVilles,
  removeProspectionCategorie,
  removeProspectionProfil,
  removeProspectionTypeBien,
  removeProspectionVille,
} from '../lib/api';
import { useApi } from '../lib/useApi';
import { useCategoriesBien, useProfilsProspection, useTypesBienReferentiel } from '../lib/referentiels';
import type { UUID } from '../types';

/* Les quatre sous-collections de la prospection — profils, villes, types de
 * bien, catégories — servies par douze endpoints qui avaient leurs fonctions
 * dans `api.ts` et **aucun appelant**. Elles décrivent ce que le prospect
 * cherche, là où le formulaire principal décrit d'où il vient.
 *
 * Le logiciel de bureau les range dans deux onglets — « Profils » d'un côté,
 * « Autres » de l'autre. On garde ce découpage : ce sont les mêmes gestes, et
 * un commercial qui migre retrouve ses repères.
 *
 * Une même mécanique quatre fois : lister, ajouter depuis un référentiel,
 * retirer. D'où un composant générique plutôt que quatre copies. */

type Ligne = { id: string; libelle: string; secondaire?: string };

function ListeEditable({
  titre,
  aide,
  lignes,
  items,
  onAjouter,
  onRetirer,
  onRafraichir,
  chargement,
  idChamp,
}: {
  titre: string;
  aide: string;
  lignes: Ligne[];
  items: { label: string; value: string }[];
  onAjouter: (id: UUID) => Promise<unknown>;
  onRetirer: (itemId: UUID) => Promise<unknown>;
  onRafraichir: () => void;
  chargement: boolean;
  idChamp: string;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Ce qui est déjà posé ne doit pas être reproposé : le serveur accepterait le
  // doublon et la liste afficherait deux fois la même ville.
  const dejaPose = new Set(lignes.map((l) => l.libelle));
  const disponibles = items.filter((i) => !dejaPose.has(i.label));

  async function agir(action: () => Promise<unknown>) {
    setOccupe(true);
    setErreur(null);
    try {
      await action();
      onRafraichir();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Échec de l’opération.');
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-label font-semibold text-foreground">{titre}</h3>
        <span className="text-micro text-muted-foreground">{aide}</span>
      </div>

      <div className="mb-2 flex items-center gap-1.5">
        <RefSelect
          id={idChamp}
          value={selection}
          onChange={setSelection}
          items={disponibles}
          placeholder="Ajouter…"
          size="sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selection || occupe}
          onClick={() =>
            agir(async () => {
              await onAjouter(selection as UUID);
              setSelection(null);
            })
          }
        >
          <Plus data-icon="inline-start" /> Ajouter
        </Button>
      </div>

      {erreur && <p className="mb-2 text-micro text-(--warning)">{erreur}</p>}

      {lignes.length === 0 ? (
        <p className="text-body text-muted-foreground">{chargement ? 'Chargement…' : 'Rien de renseigné.'}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {lignes.map((l) => (
            <li key={l.id}>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary py-0.5 pr-0.5 pl-2 text-body">
                <span className="text-foreground">{l.libelle}</span>
                {l.secondaire && <span className="text-muted-foreground">· {l.secondaire}</span>}
                <button
                  type="button"
                  aria-label={`Retirer ${l.libelle}`}
                  title={`Retirer ${l.libelle}`}
                  disabled={occupe}
                  onClick={() => agir(() => onRetirer(l.id))}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Onglet « Profils » — les profils recherchés, groupés par catégorie de bien
 * dans le référentiel. */
export function OngletProfils({ prospectionId }: { prospectionId: string }) {
  const profils = useApi(() => listProspectionProfils(prospectionId), [prospectionId], 'prospection-profils');
  const referentiel = useProfilsProspection();

  const lignes: Ligne[] = (profils.data ?? []).map((p) => ({
    id: p.id,
    libelle: p.profil || p.profilId || p.id,
    secondaire: p.categorie ?? undefined,
  }));

  /* Le référentiel est **imbriqué** — une liste de catégories portant chacune
     ses profils — alors que la sous-collection est plate et ne référence que
     le profil. On l'aplatit, en gardant la catégorie dans le libellé : sans
     elle, « 2 chambres » ne dit pas s'il s'agit d'un appartement ou d'une
     villa, et deux profils homonymes deviennent indiscernables. */
  const optionsProfils = (referentiel.data ?? []).flatMap((cat) =>
    (cat.profils ?? []).map((pr) => ({
      label: `${pr.description || pr.code || pr.id} — ${cat.description || cat.code || ''}`.replace(/ — $/, ''),
      value: pr.id,
    })),
  );

  return (
    <div className="p-3">
      <ListeEditable
        idChamp="ajout-profil"
        titre="Profils recherchés"
        aide={`${lignes.length} profil${lignes.length > 1 ? 's' : ''}`}
        lignes={lignes}
        items={optionsProfils}
        onAjouter={(profilId) => addProspectionProfil(prospectionId, { profilId })}
        onRetirer={(itemId) => removeProspectionProfil(prospectionId, itemId)}
        onRafraichir={profils.refetch}
        chargement={profils.loading}
      />
    </div>
  );
}

/** Onglet « Autres » — villes visées, types de bien, catégories. Trois listes
 * du même geste, côte à côte plutôt qu'empilées : elles sont courtes, et les
 * empiler ferait défiler un onglet qui tient largement dans sa hauteur. */
export function OngletAutres({ prospectionId }: { prospectionId: string }) {
  const villes = useApi(() => listProspectionVilles(prospectionId), [prospectionId], 'prospection-villes');
  const typesBien = useApi(() => listProspectionTypesBien(prospectionId), [prospectionId], 'prospection-types-bien');
  const categories = useApi(() => listProspectionCategories(prospectionId), [prospectionId], 'prospection-categories');

  const refTypesBien = useTypesBienReferentiel();
  const refCategories = useCategoriesBien();

  const lignesVilles: Ligne[] = (villes.data ?? []).map((v) => ({ id: v.id, libelle: v.ville || v.villeId || v.id }));
  const lignesTypes: Ligne[] = (typesBien.data ?? []).map((t) => ({ id: t.id, libelle: t.typeBien || t.typeBienId || t.id }));
  const lignesCats: Ligne[] = (categories.data ?? []).map((c) => ({ id: c.id, libelle: c.categorie || c.categorieId || c.id }));

  return (
    <div className="grid gap-5 p-3 lg:grid-cols-3">
      {/* Les villes ont leur propre référentiel paginé et cherchable, que ce
          composant ne sait pas alimenter en une liste plate. Tant qu'il n'est
          pas branché, la liste reste consultable et supprimable — c'est déjà
          plus que l'écran n'en montrait, où ces données n'existaient nulle
          part. */}
      <ListeEditable
        idChamp="ajout-ville"
        titre="Villes visées"
        aide={`${lignesVilles.length}`}
        lignes={lignesVilles}
        items={[]}
        onAjouter={(villeId) => addProspectionVille(prospectionId, { villeId })}
        onRetirer={(itemId) => removeProspectionVille(prospectionId, itemId)}
        onRafraichir={villes.refetch}
        chargement={villes.loading}
      />
      <ListeEditable
        idChamp="ajout-type-bien"
        titre="Types de bien"
        aide={`${lignesTypes.length}`}
        lignes={lignesTypes}
        items={(refTypesBien.data ?? []).map((r) => ({ label: r.description || r.code || r.id, value: r.id }))}
        onAjouter={(typeBienId) => addProspectionTypeBien(prospectionId, { typeBienId })}
        onRetirer={(itemId) => removeProspectionTypeBien(prospectionId, itemId)}
        onRafraichir={typesBien.refetch}
        chargement={typesBien.loading}
      />
      <ListeEditable
        idChamp="ajout-categorie"
        titre="Catégories"
        aide={`${lignesCats.length}`}
        lignes={lignesCats}
        items={(refCategories.data ?? []).map((r) => ({ label: r.description || r.code || r.id, value: r.id }))}
        onAjouter={(categorieId) => addProspectionCategorie(prospectionId, { categorieId })}
        onRetirer={(itemId) => removeProspectionCategorie(prospectionId, itemId)}
        onRafraichir={categories.refetch}
        chargement={categories.loading}
      />
    </div>
  );
}

/** Onglet « Contacts » — la fiche tiers derrière la prospection. Omran y liste
 * les contacts rattachés au prospect ; ici on affiche ce que la fiche porte, et
 * le lien vers elle. */
export function OngletVide({ message }: { message: string }) {
  return (
    <div className="p-3">
      <EmptyState title="Rien à afficher" message={message} />
    </div>
  );
}
