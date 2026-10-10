import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { listerProprietairesSyndic, rattacherProprietaireSyndic } from '../../../lib/syndic';
import { useApi, useDebouncedValue } from '../../../lib/useApi';
import { rafraichir } from '../virements/contexte';
import ModaleSaisie from '../virements/ModaleSaisie';
import { sansAccents, texteErreur } from './donnees';
import type { Appartement, Proprietaire } from './types';

const detail = (p: Proprietaire) => [p.cin && `CIN ${p.cin}`, p.societe_ice && `ICE ${p.societe_ice}`, p.telephone].filter(Boolean).join(' · ');

/** Rattacher quelqu'un de déjà enregistré (syndic-admod `rattacher/`) : recherche par nom, CIN, téléphone ou lot. */
export default function RattacherDialog({
  appartement: a,
  onClose,
  onPhrase,
}: Readonly<{ appartement: Appartement; onClose: () => void; onPhrase: (phrase: string) => void }>) {
  const { data, error } = useApi(listerProprietairesSyndic, []);
  const [q, setQ] = useState('');
  const recherche = useDebouncedValue(q.trim(), 200);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const dejaLa = useMemo(() => new Set(a.proprietaires.map((p) => p.id)), [a.proprietaires]);

  const visibles = useMemo(() => {
    const candidats = (data ?? []).filter((p) => !dejaLa.has(p.id));
    if (recherche.length < 2) return candidats;
    const r = sansAccents(recherche);
    return candidats.filter((p) => sansAccents([p.nom_affiche, detail(p), ...p.appartements].join(' ')).includes(r));
  }, [data, dejaLa, recherche]);

  async function rattacher(p: Proprietaire) {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      onPhrase((await rattacherProprietaireSyndic(a.code, p.id)).phrase);
      rafraichir();
      onClose();
    } catch (e) {
      setErreur(texteErreur(e));
      setEnCours(false);
    }
  }

  let liste: React.ReactNode;
  if (error) liste = <ErrorState message={error} />;
  else if (!data) liste = <LoadingState />;
  else if (visibles.length === 0) liste = <EmptyState title="Personne ne correspond" message="Créez-le plutôt avec « Nouveau propriétaire »." />;
  else {
    liste = (
      <ul className="max-h-80 divide-y divide-border overflow-auto rounded-md border border-border">
        {visibles.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-1.5 text-body">
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">{p.nom_affiche}</span>
              <span className="block text-muted-foreground">
                {detail(p)}
                {p.appartements.length > 0 && ` · déjà ${p.appartements.join(', ')}`}
              </span>
            </span>
            <Button type="button" size="sm" disabled={enCours} onClick={() => void rattacher(p)}>
              Le rattacher
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ModaleSaisie titre={`Rattacher un propriétaire à ${a.code}`} modifie={false} onClose={onClose} width={560}>
      {(fermer) => (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, CIN, téléphone, appartement…" aria-label="Rechercher un propriétaire" className="pl-8" />
          </div>
          {liste}
          {erreur && (
            <p role="alert" className="text-body text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={fermer}>
              Fermer
            </Button>
          </DialogFooter>
        </div>
      )}
    </ModaleSaisie>
  );
}
