import { useState, type ReactNode } from 'react';
import ChoixUnique from '../ChoixUnique';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ApiError } from '../../lib/api';
import { creerLot } from '../../lib/apiProjet';
import { libelleGenre } from '../../lib/genresLot';
import { libelleReferentiel } from '../../pages/projet/hooks';
import type { GenreLot, LotDetailDto, ReferentielsProjetDto } from '../../types/projet';

const LARGEUR = 'w-full';

function Champ({ libelle, children }: Readonly<{ libelle: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-1 text-body">
      <span className="text-micro font-semibold tracking-wide text-muted-foreground uppercase">{libelle}</span>
      {children}
    </div>
  );
}

/** Création minimale d'un lot du genre choisi ; un refus de droit (403) est remonté à la liste, qui grise le bouton. */
export default function ModaleCreationLot({
  genre,
  referentiels,
  projetsVisibles,
  onAnnuler,
  onCree,
  onSansDroit,
}: Readonly<{
  genre: GenreLot;
  referentiels: ReferentielsProjetDto | null;
  projetsVisibles: string[];
  onAnnuler: () => void;
  onCree: (lot: LotDetailDto) => void;
  onSansDroit: () => void;
}>) {
  const [description, setDescription] = useState('');
  const [projetId, setProjetId] = useState<string | null>(null);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const items = (liste: { id: string; code: string | null; description: string | null }[] | undefined) =>
    (liste ?? []).map((e) => ({ value: e.id, label: libelleReferentiel(e) }));
  const projets = (referentiels?.projets ?? []).filter((p) => projetsVisibles.length === 0 || projetsVisibles.includes(p.id));
  const complet = description.trim() !== '' && !!projetId && !!categorieId && !!typeId;

  function creer() {
    if (!projetId || !categorieId || !typeId) return;
    setEnCours(true);
    setErreur(null);
    creerLot({ genre, description: description.trim(), projetId, categorieId, typeId, fournisseurId })
      .then(onCree)
      .catch((err: unknown) => {
        setEnCours(false);
        if (err instanceof ApiError && err.status === 403) onSansDroit();
        else setErreur(err instanceof Error ? err.message : 'La création a échoué.');
      });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau lot — {libelleGenre(genre)}</DialogTitle>
          <DialogDescription>Le lot est créé avec le premier statut du genre ; le reste se saisit sur sa fiche.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Champ libelle="Description">
            <Input aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Champ>
          <Champ libelle="Projet">
            <ChoixUnique items={projets.map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }))} value={projetId} placeholder="Choisir" largeur={LARGEUR} onChange={setProjetId} />
          </Champ>
          <Champ libelle="Catégorie">
            <ChoixUnique items={items(referentiels?.categories)} value={categorieId} placeholder="Choisir" largeur={LARGEUR} onChange={setCategorieId} />
          </Champ>
          <Champ libelle="Type">
            <ChoixUnique items={items(referentiels?.typesLot)} value={typeId} placeholder="Choisir" largeur={LARGEUR} onChange={setTypeId} />
          </Champ>
          <Champ libelle="Fournisseur">
            <ChoixUnique tous="Aucun" items={items(referentiels?.fournisseurs)} value={fournisseurId} placeholder="Aucun" largeur={LARGEUR} onChange={setFournisseurId} />
          </Champ>
          {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours || !complet} onClick={creer}>
            Créer le lot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
