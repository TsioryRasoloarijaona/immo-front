import { useState } from 'react';
import { AlertTriangle, Check, Circle, FileText, Paperclip, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { Badge, Field, FieldGrid } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { formatCurrency, formatDate, todayISO } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { ChoixSimple } from './CadreVirements';
import {
  LIBELLE_TYPE,
  STATUT_ITEMS,
  STATUT_ORDRE,
  etatDossier,
  majVirements,
  useVirements,
  type Ordre,
  type StatutOrdre,
} from './donnees';

/** Détail d'un ordre : ses données, l'état de son dossier et la liste des
 * pièces à joindre. Le dépôt d'un fichier est simulé — un nom de fichier
 * fictif est rattaché, pour que la case se coche et que le compteur bouge. */
export default function OrdreDetailDialog({
  ordreId,
  onClose,
  notifier,
}: {
  ordreId: string;
  onClose: () => void;
  notifier: (msg: string) => void;
}) {
  const { ordres, societes } = useVirements();
  const ordre = ordres.find((o) => o.id === ordreId);
  const [statut, setStatut] = useState<StatutOrdre>(ordre?.statut ?? 'emis');

  if (!ordre) return null;
  const societe = societes.find((s) => s.id === ordre.societeId);
  const dossier = etatDossier(ordre);

  function maj(f: (o: Ordre) => Ordre) {
    majVirements((e) => ({ ...e, ordres: e.ordres.map((o) => (o.id === ordreId ? f(o) : o)) }));
  }

  function joindre(code: string) {
    maj((o) => ({
      ...o,
      pieces: o.pieces.map((p) =>
        p.code === code ? { ...p, fichier: `${p.code}-${o.numero.slice(-4)}.pdf`, dateDepot: todayISO() } : p,
      ),
    }));
  }

  function retirer(code: string) {
    maj((o) => ({ ...o, pieces: o.pieces.map((p) => (p.code === code ? { code: p.code, libelle: p.libelle } : p)) }));
  }

  function ajouterAutre() {
    maj((o) => ({
      ...o,
      autresPieces: [...o.autresPieces, { nom: `piece-complementaire-${o.autresPieces.length + 1}.pdf`, dateDepot: todayISO() }],
    }));
  }

  function enregistrer() {
    maj((o) => ({ ...o, statut }));
    notifier(`Ordre ${ordre!.numero} : statut « ${STATUT_ORDRE[statut].libelle} » enregistré.`);
    onClose();
  }

  return (
    <Modal title={`Ordre de virement ${ordre.numero}`} onClose={onClose} width={760}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-body text-muted-foreground">
          <Badge tone={STATUT_ORDRE[ordre.statut].ton}>{STATUT_ORDRE[ordre.statut].libelle}</Badge>
          <span>{LIBELLE_TYPE[ordre.type]}</span>
          {ordre.groupe && <span>· virement groupé {ordre.groupe}</span>}
        </div>

        <FieldGrid>
          <Field label="Bénéficiaire" value={ordre.beneficiaire} />
          <Field label="Montant" value={formatCurrency(ordre.montant)} />
          <Field label="Date" value={formatDate(ordre.date)} />
          <Field label="Société émettrice" value={societe?.nom} />
          <Field label="RIB" value={<span className="font-mono text-body">{ordre.rib}</span>} />
          <Field label="Référence" value={ordre.reference} />
        </FieldGrid>

        <div
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-body',
            dossier.complet ? 'bg-(--success-bg) text-(--success)' : 'bg-(--amber-bg) text-(--amber)',
          )}
        >
          {dossier.complet ? <Check className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
          <span>
            {dossier.complet
              ? 'Dossier complet : toutes les pièces sont jointes.'
              : `Dossier à compléter — ${dossier.fournies} pièce${dossier.fournies > 1 ? 's' : ''} sur ${dossier.requises}. Il manque : ${dossier.manquantes.join(', ')}.`}
          </span>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-label font-semibold text-foreground">Documents du dossier</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {ordre.pieces.map((p) => (
              <li key={p.code} className="flex items-center gap-3 px-3 py-2">
                {p.fichier ? (
                  <Check aria-label="Fournie" className="size-4 shrink-0 text-(--success)" />
                ) : (
                  <Circle aria-label="Manquante" className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-body font-medium text-foreground">{p.libelle}</div>
                  {p.fichier && (
                    <div className="truncate text-micro text-muted-foreground">
                      {p.fichier} · déposé le {formatDate(p.dateDepot)}
                    </div>
                  )}
                </div>
                {p.fichier ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => retirer(p.code)}>
                    <Trash2 data-icon="inline-start" /> Retirer
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => joindre(p.code)}>
                    <Paperclip data-icon="inline-start" /> Joindre
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-label font-semibold text-foreground">Autres pièces</h2>
          {ordre.autresPieces.length === 0 ? (
            <p className="text-body text-muted-foreground">Aucune pièce complémentaire.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {ordre.autresPieces.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-body">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">{p.nom}</span>
                  <span className="text-micro text-muted-foreground">{formatDate(p.dateDepot)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DialogFooter className="mt-5 sm:justify-between">
        <Button type="button" variant="ghost" onClick={ajouterAutre}>
          <Plus data-icon="inline-start" /> Ajouter une autre pièce
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="ordre-statut" className="text-body text-muted-foreground">
            Statut
          </label>
          <ChoixSimple id="ordre-statut" items={STATUT_ITEMS} value={statut} onChange={setStatut} className="w-32" />
          <Button type="button" onClick={enregistrer}>
            Enregistrer
          </Button>
        </div>
      </DialogFooter>
    </Modal>
  );
}
