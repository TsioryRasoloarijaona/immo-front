import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Users } from 'lucide-react';
import Modal from './Modal';
import { Badge } from './ui';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { LIBELLES_GROUPE } from '../lib/colonnes';
import { DISPOSITION_SUIVI_ACTIONS } from '../lib/dispositions';
import { formatDateTime, formatNumber } from '../lib/format';
import type { ColonneDto, SuiviActionDto } from '../types';

/** Formatage d'une valeur d'après le `type` du catalogue — la même règle
 * que la grille, pour qu'un champ se lise pareil en cellule et en boîte. */
function formater(c: ColonneDto, v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  switch (c.type) {
    case 'DATE':
      return formatDateTime(String(v));
    case 'BOOLEEN':
      return v ? 'Oui' : 'Non';
    case 'NOMBRE':
    case 'MONTANT':
      return formatNumber(Number(v));
    default:
      return String(v);
  }
}

/* Le détail d'une action du suivi, en boîte plutôt qu'en navigation : une
 * action n'a pas de fiche à elle, et quitter la liste pour lire une note fait
 * perdre la page, les filtres et le groupe déplié. La boîte montre **ce que
 * la ligne porte** — les colonnes demandées à la liste, groupées comme le
 * sélecteur les groupe — et propose d'ouvrir la prospection ou le dossier
 * rattaché, sans l'imposer. Décision utilisateur du 23/09. */
export default function ActionDetailDialog({
  action,
  catalogue,
  onClose,
}: {
  action: SuiviActionDto;
  /** Le catalogue serveur : libellés, types et groupes des champs. */
  catalogue: ColonneDto[];
  onClose: () => void;
}) {
  const navigate = useNavigate();

  /* Les champs renseignés sur la ligne, dans l'ordre de la disposition puis
     du catalogue, répartis par groupe. Les identifiants sont masqués (ce sont
     les boutons du pied qui les portent), `message` est traité à part. */
  const sections = useMemo(() => {
    const rang = new Map(DISPOSITION_SUIVI_ACTIONS.ordre.map((n, i) => [n, i]));
    const masquees = DISPOSITION_SUIVI_ACTIONS.masquees ?? new Set<string>();
    const colonnes = [...catalogue]
      .filter((c) => !masquees.has(c.nom) && c.nom !== 'message')
      .sort((a, b) => (rang.get(a.nom) ?? 999) - (rang.get(b.nom) ?? 999));
    const parGroupe = new Map<string, { colonne: ColonneDto; valeur: string }[]>();
    for (const c of colonnes) {
      const valeur = formater(c, (action as unknown as Record<string, unknown>)[c.nom]);
      if (!valeur) continue;
      const liste = parGroupe.get(c.groupe) ?? [];
      liste.push({ colonne: c, valeur });
      parGroupe.set(c.groupe, liste);
    }
    return [...parGroupe.entries()];
  }, [action, catalogue]);

  const titre = [action.typeAction, action.tiersNom].filter(Boolean).join(' — ') || 'Action';

  return (
    <Modal title={titre} onClose={onClose} width={640}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-body text-muted-foreground">
          {action.dateAction && <span>{formatDateTime(action.dateAction)}</span>}
          {action.utilisateur && <span>· {action.utilisateur}</span>}
          {action.alerteActive && <Badge tone="warning">Alerte active</Badge>}
          {action.systeme && <Badge tone="neutral">Système</Badge>}
          {action.impaye && <Badge tone="amber">Impayé</Badge>}
        </div>

        {action.message && (
          <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-body whitespace-pre-wrap text-foreground">
            {action.message}
          </div>
        )}

        {sections.map(([groupe, champs]) => (
          <section key={groupe}>
            <h3 className="mb-1.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">
              {LIBELLES_GROUPE[groupe] ?? groupe}
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {champs.map(({ colonne, valeur }) => (
                <div key={colonne.nom} className="flex min-w-0 flex-col">
                  <dt className="text-micro text-muted-foreground">{colonne.libelle}</dt>
                  <dd className="truncate text-body text-foreground" title={valeur}>{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {sections.length === 0 && !action.message && (
          <p className="text-body text-muted-foreground">Aucun champ renseigné sur cette ligne.</p>
        )}
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
        {action.dossierId && (
          <Button type="button" variant="outline" onClick={() => navigate(`/dossiers/${action.dossierId}`)}>
            <Folder data-icon="inline-start" /> Ouvrir le dossier
          </Button>
        )}
        {action.prospectionId && (
          <Button type="button" onClick={() => navigate(`/prospections/${action.prospectionId}`)}>
            <Users data-icon="inline-start" /> Ouvrir la prospection
          </Button>
        )}
      </DialogFooter>
    </Modal>
  );
}
