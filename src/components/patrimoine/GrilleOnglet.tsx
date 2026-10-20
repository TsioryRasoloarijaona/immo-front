import { useRef, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import TableLignes from './TableLignes';
import { useAuth } from '../../lib/auth';
import { changerRangee, type ColonneOnglet, type Rangee, type SourceLignes } from '../../lib/ongletsTranche';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';

/**
 * Grille d'un onglet de fiche (tranche, contenances d'article) : lignes ajoutées / modifiées / retirées en place,
 * envoyées d'un bloc par « Enregistrer » (PUT liste complète). Lecture seule hors Administrateur.
 */
export default function GrilleOnglet<L extends { id?: string | null }>({ source, colonnes, nouvelle, normaliser, pied, onEnregistre }: Readonly<{
  source: SourceLignes<L>;
  colonnes: ColonneOnglet<L>[];
  nouvelle: L;
  /** Recalcul d'une ligne après chaque saisie (frais : HT ↔ TTC). */
  normaliser?: (ligne: L) => L;
  pied?: (lignes: L[]) => ReactNode;
  onEnregistre?: () => void;
}>) {
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const showToast = useToast();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useApi(source.charger, [source.cle, version]);
  const [brouillon, setBrouillon] = useState<Rangee<L>[] | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const compteur = useRef(0);

  const rangees = brouillon ?? (data?.lignes ?? []).map((ligne, i) => ({ cle: ligne.id ?? `l${i}`, ligne }));

  function ajouter() {
    compteur.current += 1;
    setBrouillon([...rangees, { cle: `n${compteur.current}`, ligne: { ...nouvelle } }]);
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await source.enregistrer(rangees.map((r) => r.ligne));
      setBrouillon(null);
      setVersion((v) => v + 1);
      showToast('Onglet enregistré.');
      onEnregistre?.();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  }

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-3">
      <TableLignes colonnes={colonnes} rangees={rangees} editable={admin} version={version}
        onChange={(cle, nom, valeur) => setBrouillon(changerRangee(rangees, cle, nom, valeur, normaliser))}
        onRetirer={(cle) => setBrouillon(rangees.filter((x) => x.cle !== cle))} />
      {pied?.(rangees.map((r) => r.ligne))}
      {admin && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={ajouter}><Plus data-icon="inline-start" /> Ajouter une ligne</Button>
          <Button type="button" size="sm" disabled={envoi || !brouillon} onClick={() => void enregistrer()}>Enregistrer</Button>
          {brouillon && (
            <Button type="button" size="sm" variant="ghost" onClick={() => { setBrouillon(null); setVersion((v) => v + 1); }}>
              Annuler
            </Button>
          )}
        </div>
      )}
      {erreur && <p className="text-micro text-destructive">{erreur}</p>}
    </div>
  );
}
