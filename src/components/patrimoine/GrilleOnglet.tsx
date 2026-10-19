import { useRef, useState, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getOngletTranche, putOngletTranche, type OngletTranche } from '../../lib/apiPatrimoine';
import { useAuth } from '../../lib/auth';
import { formatCurrency, formatNumber, formatPercent, formatSurface } from '../../lib/format';
import { libelleChoix, type ColonneOnglet } from '../../lib/ongletsTranche';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';

interface Rangee<L> {
  cle: string;
  ligne: L;
}

type Valeur = string | number | boolean | null | undefined;

function afficher<L>(colonne: ColonneOnglet<L>, valeur: Valeur): ReactNode {
  if (colonne.type === 'case') return valeur ? 'Oui' : 'Non';
  if (colonne.type === 'choix') {
    const choix = colonne.choix?.find((c) => c.id === valeur);
    return choix ? libelleChoix(choix) : '—';
  }
  const nombre = typeof valeur === 'number' ? valeur : null;
  if (colonne.type === 'montant') return formatCurrency(nombre);
  if (colonne.type === 'surface') return formatSurface(nombre);
  if (colonne.type === 'pourcent') return formatPercent(nombre, 2);
  return formatNumber(nombre);
}

/** Saisie d'un nombre ; `pourcent` : saisi en %, transmis en fraction. Non contrôlé pour garder « 12, » en cours de frappe. */
function SaisieNombre<L>({ colonne, valeur, onChange }: Readonly<{
  colonne: ColonneOnglet<L>;
  valeur: Valeur;
  onChange: (v: number | null) => void;
}>) {
  const facteur = colonne.type === 'pourcent' ? 100 : 1;
  const initiale = typeof valeur === 'number' ? String(Math.round(valeur * facteur * 1e4) / 1e4) : '';
  return (
    <Input type="number" inputMode="decimal" step="any" aria-label={colonne.libelle} defaultValue={initiale} className="h-7 w-28"
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value) / facteur)} />
  );
}

function Saisie<L>({ colonne, valeur, onChange }: Readonly<{
  colonne: ColonneOnglet<L>;
  valeur: Valeur;
  onChange: (v: Valeur) => void;
}>) {
  if (colonne.type === 'case') {
    return <input type="checkbox" aria-label={colonne.libelle} checked={!!valeur} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (colonne.type === 'choix') {
    const items = (colonne.choix ?? []).map((c) => ({ label: libelleChoix(c), value: c.id }));
    return (
      <Select items={items} value={typeof valeur === 'string' ? valeur : null} onValueChange={(v) => onChange(v)}>
        <SelectTrigger aria-label={colonne.libelle} className="h-7 min-w-48"><SelectValue placeholder="Choisir…" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }
  return <SaisieNombre colonne={colonne} valeur={valeur} onChange={onChange} />;
}

/**
 * Grille d'un onglet de la fiche tranche : lignes ajoutées / modifiées / retirées en place, envoyées d'un bloc par
 * « Enregistrer » (PUT liste complète). Lecture seule hors Administrateur.
 */
export default function GrilleOnglet<L extends { id?: string }>({ trancheId, onglet, colonnes, nouvelle, normaliser, pied, onEnregistre }: Readonly<{
  trancheId: string;
  onglet: OngletTranche;
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
  const { data, loading, error } = useApi(() => getOngletTranche<L>(trancheId, onglet), [trancheId, onglet, version]);
  const [brouillon, setBrouillon] = useState<Rangee<L>[] | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const compteur = useRef(0);

  const rangees = brouillon ?? (data?.lignes ?? []).map((ligne, i) => ({ cle: ligne.id ?? `l${i}`, ligne }));
  const modifier = (suivantes: Rangee<L>[]) => setBrouillon(suivantes);

  function changer(cle: string, nom: keyof L, valeur: Valeur) {
    modifier(rangees.map((r) => {
      if (r.cle !== cle) return r;
      const ligne = { ...r.ligne, [nom]: valeur };
      return { cle, ligne: normaliser ? normaliser(ligne) : ligne };
    }));
  }

  function ajouter() {
    compteur.current += 1;
    modifier([...rangees, { cle: `n${compteur.current}`, ligne: { ...nouvelle } }]);
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await putOngletTranche(trancheId, onglet, rangees.map((r) => r.ligne));
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
      {rangees.length === 0 ? <EmptyState title="Aucune ligne" /> : (
        <Table>
          <TableHeader>
            <TableRow>
              {colonnes.map((c) => <TableHead key={c.nom}>{c.libelle}</TableHead>)}
              {admin && <TableHead><span className="sr-only">Retirer</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rangees.map((r) => (
              <TableRow key={`${r.cle}-${version}`}>
                {colonnes.map((c) => (
                  <TableCell key={c.nom}>
                    {admin && !c.calcule?.(r.ligne)
                      ? <Saisie colonne={c} valeur={r.ligne[c.nom] as Valeur} onChange={(v) => changer(r.cle, c.nom, v)} />
                      : afficher(c, r.ligne[c.nom] as Valeur)}
                  </TableCell>
                ))}
                {admin && (
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer la ligne"
                      onClick={() => modifier(rangees.filter((x) => x.cle !== r.cle))}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
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
