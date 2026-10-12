import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { useSoumission, type ErreurSaisie } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';

/** Une colonne d'onglet : `cle` = nom du champ d'écriture, pour rattacher l'erreur `lignes[i].<cle>`. */
export interface ColonneOnglet<E> {
  cle: string;
  libelle: string;
  droite?: boolean;
  lecture: (ligne: E) => ReactNode;
  saisie: (ligne: E, changer: (patch: Partial<E>) => void, invalide: boolean, etiquette: string) => ReactNode;
}

interface Ligne<E> {
  cle: string;
  saisie: E;
}

const CHAMP_LIGNE = /^lignes\[(\d{1,6})\]\.(\w{1,60})$/;

function erreurDeLigne(erreur: ErreurSaisie | null): { index: number; champ: string } | null {
  const m = erreur?.champ ? CHAMP_LIGNE.exec(erreur.champ) : null;
  return m ? { index: Number(m[1]), champ: m[2] } : null;
}

/**
 * Onglet de fiche enregistré en un seul PUT de la liste complète (FEATURE-patrimoine-tranche-onglets §1) :
 * lecture seule hors administrateur ; ajout et suppression de lignes en local jusqu'à « Enregistrer ».
 */
export default function GrilleOnglet<D extends { id: string }, E>({
  titre,
  charger,
  dep,
  versSaisie,
  nouvelle,
  enregistrer,
  colonnes,
  admin,
  vide,
  pied,
  apresEnregistrement,
}: Readonly<{
  titre: string;
  charger: () => Promise<D[]>;
  dep: string;
  versSaisie: (dto: D) => E;
  nouvelle: () => E;
  enregistrer: (lignes: E[]) => Promise<D[]>;
  colonnes: ColonneOnglet<E>[];
  admin: boolean;
  vide: string;
  pied?: (lignes: E[]) => ReactNode;
  apresEnregistrement?: () => void;
}>) {
  const { data, loading, error, refetch } = useApi(charger, [dep]);
  const [brouillon, setBrouillon] = useState<Ligne<E>[] | null>(null);
  const compteur = useRef(0);
  const { enCours, erreur, soumettre } = useSoumission();
  const toast = useToast();
  const base = useMemo(() => (data ?? []).map((d) => ({ cle: d.id, saisie: versSaisie(d) })), [data, versSaisie]);
  const lignes = brouillon ?? base;
  const enFaute = erreurDeLigne(erreur);

  const modifier = (f: (l: Ligne<E>[]) => Ligne<E>[]) => setBrouillon((b) => f(b ?? base));
  const ajouter = () => {
    compteur.current += 1;
    modifier((l) => [...l, { cle: `nouvelle-${compteur.current}`, saisie: nouvelle() }]);
  };
  const changer = (cle: string, patch: Partial<E>) =>
    modifier((l) => l.map((x) => (x.cle === cle ? { ...x, saisie: { ...x.saisie, ...patch } } : x)));
  const retirer = (cle: string) => modifier((l) => l.filter((x) => x.cle !== cle));
  const valider = () =>
    void soumettre(
      () => enregistrer(lignes.map((l) => l.saisie)),
      () => {
        setBrouillon(null);
        toast({ texte: `Onglet « ${titre} » enregistré.`, variante: 'succes' });
        void refetch();
        apresEnregistrement?.();
      },
    );

  const actions = admin ? (
    <span className="flex gap-2">
      {brouillon && (
        <Button size="sm" variant="ghost" disabled={enCours} onClick={() => setBrouillon(null)}>
          <RotateCcw data-icon="inline-start" /> Annuler
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={enCours} onClick={ajouter}>
        <Plus data-icon="inline-start" /> Ajouter une ligne
      </Button>
      <Button size="sm" disabled={enCours || !brouillon} onClick={valider}>
        <Save data-icon="inline-start" /> {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </span>
  ) : undefined;

  return (
    <Card title={`${titre} (${lignes.length})`} action={actions} padded={false}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && erreur && <p role="alert" className="px-4 pt-3 text-body text-destructive">{erreur.message}</p>}
      {!error && data && lignes.length === 0 && <EmptyState title="Aucune ligne" message={vide} />}
      {!error && data && lignes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="border-b border-border text-micro text-muted-foreground">
                {colonnes.map((c) => (
                  <th key={c.cle} scope="col" className={cn('px-3 py-1.5 font-medium', c.droite ? 'text-right' : 'text-left')}>
                    {c.libelle}
                  </th>
                ))}
                {admin && <th scope="col" className="w-10"><span className="sr-only">Retirer</span></th>}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, index) => (
                <tr key={l.cle} className="border-b border-border last:border-b-0">
                  {colonnes.map((c) => (
                    <td key={c.cle} className={cn('px-3 py-1', c.droite && 'text-right')}>
                      {admin
                        ? c.saisie(l.saisie, (patch) => changer(l.cle, patch), enFaute?.index === index && enFaute.champ === c.cle,
                            `${c.libelle}, ligne ${index + 1}`)
                        : c.lecture(l.saisie)}
                    </td>
                  ))}
                  {admin && (
                    <td className="px-2 py-1 text-right">
                      <Button size="icon-sm" variant="ghost" aria-label={`Retirer la ligne ${index + 1}`} onClick={() => retirer(l.cle)}>
                        <Trash2 />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {pied && <tfoot>{pied(lignes.map((l) => l.saisie))}</tfoot>}
          </table>
        </div>
      )}
    </Card>
  );
}
