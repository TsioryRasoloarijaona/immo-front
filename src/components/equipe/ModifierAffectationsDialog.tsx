import { useState } from 'react';
import { Building2 } from 'lucide-react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { modifierAffectationsEquipe } from '../../lib/api';
import { basculer } from '../../lib/equipe';
import { pluriel } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import type { MembreAffectationDto, ProjetPerimetreDto } from '../../types';

/** Envoie seulement la différence (ajouts / retraits) : jamais un remplacement de toute la liste. */
export default function ModifierAffectationsDialog({
  membre,
  projets,
  onClose,
  onFait,
}: Readonly<{
  membre: MembreAffectationDto;
  projets: readonly ProjetPerimetreDto[];
  onClose: () => void;
  onFait: () => void;
}>) {
  const toast = useToast();
  const [coches, setCoches] = useState<Set<string>>(() => new Set(membre.projetIds));
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ajouter = [...coches].filter((id) => !membre.projetIds.includes(id));
  const retirer = membre.projetIds.filter((id) => !coches.has(id));
  const inchange = ajouter.length === 0 && retirer.length === 0;

  async function enregistrer() {
    setBusy(true);
    setErreur(null);
    try {
      await modifierAffectationsEquipe(membre.admUserId, { ajouter, retirer });
      const morceaux = [
        ajouter.length > 0 ? pluriel(ajouter.length, 'projet ajouté', 'projets ajoutés') : null,
        retirer.length > 0 ? pluriel(retirer.length, 'projet retiré', 'projets retirés') : null,
      ].filter(Boolean);
      toast({ texte: `${membre.nom ?? membre.code ?? '—'} : ${morceaux.join(', ')}.`, variante: 'succes' });
      onFait();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de l’enregistrement.');
      setBusy(false);
    }
  }

  return (
    <Modal title={`Projets de ${membre.nom ?? membre.code ?? '—'}`} onClose={onClose} width={440}>
      <div className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground">
          Seuls vos projets sont listés ; ses autres affectations ne changent pas. Un commercial garde toujours au moins
          un projet.
        </p>
        <div className="flex flex-col gap-1">
          {projets.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60">
              <input
                type="checkbox"
                className="size-3.5 shrink-0"
                checked={coches.has(p.id)}
                onChange={() => setCoches((s) => basculer(s, p.id))}
              />
              <span className="w-14 shrink-0 font-mono text-micro text-muted-foreground">{p.code}</span>
              <span className="truncate text-body text-foreground">{p.libelle}</span>
            </label>
          ))}
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void enregistrer()} disabled={busy || inchange}>
          <Building2 data-icon="inline-start" /> {busy ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
