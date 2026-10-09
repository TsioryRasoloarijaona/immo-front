import { useRef, useState } from 'react';
import { AlertTriangle, Check, Circle, Paperclip, Plus, RefreshCw, Replace, Trash2 } from 'lucide-react';
import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { formatCurrency, formatDate } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { ajouterPiece, lienPiece, lireOrdre, modifierMontantPiece, modifierOrdre, regenererPdf, supprimerPiece } from '../../../lib/virements';
import { cn } from '../../../lib/utils';
import { ChoixSimple } from './CadreVirements';
import { rafraichir } from './contexte';
import { STATUT_ORDRE, formatTaille, pluriel, statutItems } from './donnees';
import ModaleSaisie from './ModaleSaisie';
import type { Meta, Moi, Ordre, Piece, StatutOrdre } from './types';
import { useConfirmation } from './useConfirmation';
import type { Notifications } from './useNotification';

const FORMATS_PIECE = '.pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.docx,.doc';

/** Chaque action rend l'ordre décoré, qui remplace l'affichage ; les listes ouvertes derrière sont relues
 * par `rafraichir`. */
export default function OrdreDetailDialog({
  ordreId,
  meta,
  moi,
  onClose,
  toasts,
}: Readonly<{
  ordreId: number;
  meta: Meta;
  moi: Moi;
  onClose: () => void;
  toasts: Notifications;
}>) {
  const api = useApi(() => lireOrdre(ordreId), [ordreId]);
  const [maj, setMaj] = useState<Ordre | null>(null);
  const ordre = maj ?? api.data;
  const [statut, setStatut] = useState<StatutOrdre | null>(null);
  const statutChoisi = statut ?? ordre?.statut ?? 'emis';
  const modifie = ordre !== null && statutChoisi !== ordre.statut;

  const titre = ordre ? `${ordre.numero} — ${ordre.fournisseur_nom}` : 'Ordre de virement';

  return (
    <ModaleSaisie titre={titre} modifie={modifie} onClose={onClose} width={780}>
      {(fermer) =>
        api.error && !ordre ? (
          <ErrorState message={api.error} />
        ) : !ordre ? (
          <LoadingState />
        ) : (
          <Contenu
            ordre={ordre}
            meta={meta}
            moi={moi}
            statut={statutChoisi}
            setStatut={setStatut}
            onOrdre={(o) => {
              setMaj(o);
              rafraichir();
            }}
            fermer={fermer}
            toasts={toasts}
          />
        )
      }
    </ModaleSaisie>
  );
}

function Contenu({
  ordre,
  meta,
  moi,
  statut,
  setStatut,
  onOrdre,
  fermer,
  toasts,
}: Readonly<{
  ordre: Ordre;
  meta: Meta;
  moi: Moi;
  statut: StatutOrdre;
  setStatut: (s: StatutOrdre | null) => void;
  onOrdre: (o: Ordre) => void;
  fermer: () => void;
  toasts: Notifications;
}>) {
  const [confirmation, demander] = useConfirmation();
  const fichier = useRef<HTMLInputElement>(null);
  const [typeDepot, setTypeDepot] = useState<string>('autre');
  const [occupe, setOccupe] = useState<string | null>(null);

  const libelle = (t: string) => meta.types_pieces[t]?.libelle ?? t;
  const piecesDuType = (t: string) => ordre.pieces.filter((p) => p.type === t);
  const autres = ordre.pieces.filter((p) => !ordre.types_dossier.includes(p.type));
  const nbRequis = ordre.types_dossier.length;

  async function action(cle: string, f: () => Promise<Ordre>, succes?: (o: Ordre) => string, prefixe?: string) {
    setOccupe(cle);
    try {
      const o = await f();
      onOrdre(o);
      if (succes) toasts.notifier(succes(o));
    } catch (e) {
      toasts.notifierErreur(e, prefixe);
    } finally {
      setOccupe(null);
    }
  }

  function choisirFichier(type: string) {
    setTypeDepot(type);
    fichier.current?.click();
  }

  function deposer(f: File) {
    const type = typeDepot;
    void action(
      `depot-${type}`,
      async () => (await ajouterPiece(ordre.id, f, type)).ordre,
      (o) => `${libelle(type)} ajouté avec succès${o.dossier_complet ? ' — le dossier est complet' : ''}.`,
      "Impossible d'ajouter la pièce",
    );
  }

  async function retirer(p: Piece) {
    const ok = await demander({
      titre: 'Supprimer la pièce ?',
      message: `« ${p.nom_fichier} » (${libelle(p.type)}) sera effacé définitivement.`,
      confirmer: 'Supprimer',
      danger: true,
    });
    if (ok) void action(`suppr-${p.id}`, () => supprimerPiece(p.id), () => 'Pièce supprimée avec succès.', 'Impossible de supprimer la pièce');
  }

  function regenerer() {
    void action(
      'pdf',
      () => regenererPdf(ordre.id),
      () => (ordre.groupe ? 'PDF regénéré avec succès pour tout le virement groupé.' : 'PDF regénéré avec succès.'),
      'Impossible de regénérer le PDF',
    );
  }

  function enregistrerStatut() {
    if (statut === ordre.statut) {
      toasts.notifier('Le statut est déjà celui enregistré.', 'avertissement');
      return;
    }
    void action(
      'statut',
      async () => {
        const o = await modifierOrdre(ordre.id, { statut });
        setStatut(null);
        return o;
      },
      (o) => `Statut « ${STATUT_ORDRE[o.statut].libelle} » enregistré avec succès.`,
      "Impossible d'enregistrer le statut",
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="-mt-2 flex flex-wrap items-center gap-2 text-body text-muted-foreground">
          <span>{meta.types_virement[ordre.type_virement]?.libelle ?? ordre.type_virement}</span>
          <Badge tone={STATUT_ORDRE[ordre.statut].ton}>{STATUT_ORDRE[ordre.statut].libelle}</Badge>
        </div>

        <FieldGrid>
          <Field label="Montant" value={formatCurrency(ordre.montant)} />
          <Field label="Date du virement" value={formatDate(ordre.date_virement)} />
          <Field label="Société émettrice" value={ordre.societe_nom ?? '—'} />
          <Field label="Bénéficiaire" value={ordre.fournisseur_nom} />
          <Field label="RIB du bénéficiaire" value={<span className="font-mono text-body">{ordre.rib}</span>} />
          <Field label="Référence" value={ordre.reference || '—'} />
          {ordre.groupe && <Field label="Virement groupé" value={<span className="font-mono">{ordre.groupe}</span>} />}
        </FieldGrid>

        <div
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-body',
            ordre.dossier_complet ? 'bg-(--success-bg) text-(--success)' : 'bg-(--amber-bg) text-(--amber)',
          )}
        >
          {ordre.dossier_complet ? <Check className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
          <span>
            {ordre.dossier_complet
              ? `Dossier complet — les ${nbRequis} documents sont là.`
              : `Il manque ${pluriel(ordre.manquants.length, 'document')} : ${ordre.manquants.join(', ')}.`}
          </span>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-label font-semibold text-foreground">Documents du dossier</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {ordre.types_dossier.map((t) => {
              const tp = meta.types_pieces[t] ?? { libelle: t };
              const presente = piecesDuType(t).at(-1);
              return (
                <li key={t} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                  {presente ? (
                    <Check aria-label="Présent" className="size-4 shrink-0 text-(--success)" />
                  ) : (
                    <Circle aria-label="Absent" className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-body font-medium text-foreground">{tp.libelle}</div>
                    {presente ? (
                      <div className="truncate text-micro text-muted-foreground">
                        <a href={lienPiece(presente.id)} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                          {presente.nom_fichier}
                        </a>{' '}
                        · {formatTaille(presente.taille)}
                      </div>
                    ) : (
                      <div className="text-micro text-muted-foreground">
                        {tp.auto ? "généré automatiquement à la création de l'ordre" : 'à joindre'}
                      </div>
                    )}
                  </div>
                  {presente && tp.montant && (
                    <MontantPiece key={presente.id} piece={presente} ordre={ordre} libelle={tp.libelle_montant ?? 'Montant'} onOrdre={onOrdre} toasts={toasts} />
                  )}
                  <div className="flex items-center gap-1">
                    {tp.auto ? (
                      <Button type="button" variant="outline" size="sm" disabled={occupe !== null} onClick={regenerer}>
                        <RefreshCw data-icon="inline-start" className={occupe === 'pdf' ? 'animate-spin' : undefined} />
                        {occupe === 'pdf' ? 'Regénération…' : 'Regénérer le PDF'}
                      </Button>
                    ) : presente ? (
                      <>
                        <Button type="button" variant="ghost" size="sm" disabled={occupe !== null} onClick={() => choisirFichier(t)}>
                          <Replace data-icon="inline-start" /> {occupe === `depot-${t}` ? 'Envoi…' : 'Remplacer'}
                        </Button>
                        {moi.admin && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={occupe !== null}
                            onClick={() => void retirer(presente)}
                          >
                            <Trash2 data-icon="inline-start" /> Supprimer
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button type="button" variant="outline" size="sm" disabled={occupe !== null} onClick={() => choisirFichier(t)}>
                        <Paperclip data-icon="inline-start" /> {occupe === `depot-${t}` ? 'Envoi…' : 'Ajouter'}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {autres.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-label font-semibold text-foreground">Autres pièces</h2>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {autres.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1 text-body">
                    <a href={lienPiece(p.id)} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                      {p.nom_fichier}
                    </a>
                    <span className="text-micro text-muted-foreground">
                      {' '}
                      · {libelle(p.type)} · {formatTaille(p.taille)}
                    </span>
                  </div>
                  {moi.admin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Supprimer"
                      aria-label={`Supprimer ${p.nom_fichier}`}
                      className="text-destructive hover:text-destructive"
                      disabled={occupe !== null}
                      onClick={() => void retirer(p)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <input
          ref={fichier}
          type="file"
          accept={FORMATS_PIECE}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) deposer(f);
          }}
        />
      </div>

      <DialogFooter className="mt-5 sm:justify-between">
        <Button type="button" variant="ghost" disabled={occupe !== null} onClick={() => choisirFichier('autre')}>
          <Plus data-icon="inline-start" /> Ajouter une autre pièce
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="ordre-statut" className="text-body text-muted-foreground">
            Statut
          </label>
          <ChoixSimple id="ordre-statut" items={statutItems(meta)} value={statut} onChange={setStatut} className="w-32" />
          <Button type="button" disabled={occupe !== null} onClick={enregistrerStatut}>
            {occupe === 'statut' ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="outline" onClick={fermer}>
            Fermer
          </Button>
        </div>
      </DialogFooter>
      {confirmation}
    </>
  );
}

/** Enregistré au `change`, pas à la frappe ; la puce compare au montant viré, au centime. */
function MontantPiece({
  piece,
  ordre,
  libelle,
  onOrdre,
  toasts,
}: Readonly<{
  piece: Piece;
  ordre: Ordre;
  libelle: string;
  onOrdre: (o: Ordre) => void;
  toasts: Notifications;
}>) {
  const [saisie, setSaisie] = useState(piece.montant != null ? String(piece.montant) : '');
  const [enCours, setEnCours] = useState(false);

  async function enregistrer() {
    const brut = saisie.trim().replace(',', '.');
    const valeur = brut === '' ? null : Number(brut);
    if (valeur !== null && !Number.isFinite(valeur)) return;
    if (valeur === piece.montant) return;
    setEnCours(true);
    try {
      onOrdre(await modifierMontantPiece(piece.id, valeur));
    } catch (e) {
      toasts.notifierErreur(e, "Impossible d'enregistrer le montant");
    } finally {
      setEnCours(false);
    }
  }

  const ecart = piece.montant != null && Math.abs(piece.montant - ordre.montant) >= 0.01;
  return (
    <div className="flex basis-full items-center gap-2 pl-7 sm:basis-auto sm:pl-0">
      <label htmlFor={`piece-montant-${piece.id}`} className="text-micro whitespace-nowrap text-muted-foreground">
        {libelle}
      </label>
      <Input
        id={`piece-montant-${piece.id}`}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        className="h-7 w-32"
        value={saisie}
        disabled={enCours}
        onChange={(e) => setSaisie(e.target.value)}
        onBlur={() => void enregistrer()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void enregistrer();
          }
        }}
      />
      {ecart && <Badge tone="amber">≠ {formatCurrency(ordre.montant)} viré</Badge>}
    </div>
  );
}
