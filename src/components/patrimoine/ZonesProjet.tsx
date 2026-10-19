import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createZone, deleteZone, listZones, updateZone } from '../../lib/apiPatrimoine';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import type { ZoneProjetDto } from '../../types';

/** Ordre d'arbre : chaque zone suivie de ses sous-zones (le serveur trie déjà par Sorting). */
function enArbre(zones: ZoneProjetDto[], parentId: string | null = null): ZoneProjetDto[] {
  return zones
    .filter((z) => (z.parentId ?? null) === parentId)
    .flatMap((z) => [z, ...enArbre(zones, z.id)]);
}

interface Saisie {
  id?: string;
  code: string;
  description: string;
  parentId: string;
}

const VIDE: Saisie = { code: '', description: '', parentId: '' };

/** Zones du programme (CfgProjectZone) : arbre en lecture, ajout / modification / suppression pour l'Administrateur. */
export default function ZonesProjet({ projetId }: Readonly<{ projetId: string }>) {
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const confirm = useConfirm();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useApi(() => listZones(projetId), [projetId, version]);
  const [saisie, setSaisie] = useState<Saisie>(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const zones = enArbre(data ?? []);

  async function executer(action: () => Promise<unknown>) {
    setEnvoi(true);
    setErreur(null);
    try {
      await action();
      setSaisie(VIDE);
      setVersion((v) => v + 1);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  }

  function enregistrer() {
    const corps = { code: saisie.code, description: saisie.description };
    void executer(() =>
      saisie.id
        ? updateZone(projetId, saisie.id, corps)
        : createZone(projetId, { ...corps, parentId: saisie.parentId || undefined }),
    );
  }

  async function supprimer(z: ZoneProjetDto) {
    const oui = await confirm({ message: `Supprimer la zone ${z.code ?? ''} ?`, confirmLabel: 'Supprimer' });
    if (oui) await executer(() => deleteZone(projetId, z.id));
  }

  const parents = zones.filter((z) => z.id !== saisie.id).map((z) => ({ label: `${z.code} — ${z.description}`, value: z.id }));

  return (
    <Card title={`Zones (${zones.length})`}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && zones.length === 0 && <EmptyState title="Aucune zone" />}
      {!error && data && zones.length > 0 && (
        <ul className="flex flex-col gap-1">
          {zones.map((z) => (
            <li key={z.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-label"
              style={{ marginLeft: `${(z.niveau ?? 0) * 1.25}rem` }}>
              <span className="font-mono text-micro text-muted-foreground">{z.code}</span>
              <span className="flex-1 text-foreground">{z.description}</span>
              {admin && (
                <>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Modifier la zone ${z.code ?? ''}`}
                    onClick={() => setSaisie({ id: z.id, code: z.code ?? '', description: z.description ?? '', parentId: z.parentId ?? '' })}>
                    <Pencil />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer la zone ${z.code ?? ''}`}
                    onClick={() => void supprimer(z)}>
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {admin && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input aria-label="Code de la zone" placeholder="Code *" className="w-32" value={saisie.code}
            onChange={(e) => setSaisie({ ...saisie, code: e.target.value })} />
          <Input aria-label="Description de la zone" placeholder="Description *" className="min-w-48 flex-1"
            value={saisie.description} onChange={(e) => setSaisie({ ...saisie, description: e.target.value })} />
          <Select items={parents} value={saisie.parentId || null} disabled={!!saisie.id}
            onValueChange={(v) => setSaisie({ ...saisie, parentId: v ?? '' })}>
            <SelectTrigger aria-label="Zone parente" className="w-56"><SelectValue placeholder="Racine" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {parents.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={envoi} onClick={enregistrer}>
            {saisie.id ? 'Enregistrer' : <><Plus data-icon="inline-start" /> Ajouter</>}
          </Button>
          {(saisie.id || saisie.code || saisie.description) && (
            <Button type="button" size="sm" variant="outline" onClick={() => setSaisie(VIDE)}>Annuler</Button>
          )}
        </div>
      )}
      {erreur && <p className="mt-2 text-micro text-destructive">{erreur}</p>}
    </Card>
  );
}
