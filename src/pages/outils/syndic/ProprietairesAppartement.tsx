import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Link2, Pencil, UserPlus } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { deplacerProprietaireSyndic } from '../../../lib/syndic';
import { rafraichir } from '../virements/contexte';
import { texteErreur } from './donnees';
import RattacherDialog from './RattacherDialog';
import type { Appartement } from './types';

/** RM-13 : l'ordre affiché est celui des documents, le premier est le principal. Rien ne se détache. */
export default function ProprietairesAppartement({
  appartement: a,
  onPhrase,
}: Readonly<{ appartement: Appartement; onPhrase: (phrase: string, erreur?: boolean) => void }>) {
  const [rattacher, setRattacher] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const fiche = `/outils/syndic/appartements/${a.code}`;
  const retour = `?retour=${encodeURIComponent(fiche)}`;

  async function deplacer(id: string, sens: 'monter' | 'descendre') {
    if (enCours) return;
    setEnCours(true);
    try {
      onPhrase((await deplacerProprietaireSyndic(a.code, id, sens)).phrase);
      rafraichir();
    } catch (e) {
      onPhrase(texteErreur(e), true);
    } finally {
      setEnCours(false);
    }
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Link to={`/outils/syndic/proprietaires/nouveau?appartement=${encodeURIComponent(a.code)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <UserPlus data-icon="inline-start" /> Nouveau propriétaire
      </Link>
      <Button type="button" variant="outline" size="sm" onClick={() => setRattacher(true)}>
        <Link2 data-icon="inline-start" /> Rattacher un propriétaire
      </Button>
    </div>
  );

  return (
    <Card title={a.proprietaires.length > 1 ? 'Propriétaires' : 'Propriétaire'} action={actions}>
      {a.proprietaires.length === 0 ? (
        <p className="text-body text-muted-foreground">Aucun propriétaire rattaché : ajoutez-en un, ou rattachez quelqu’un de déjà enregistré.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {a.proprietaires.map((p, rang) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-body">
              <span className="font-medium text-foreground">{p.nom}</span>
              <span className="text-muted-foreground">{[p.est_societe ? 'Société' : p.cin && `CIN ${p.cin}`, p.telephone].filter(Boolean).join(' · ')}</span>
              {p.manque && <span className="text-(--amber)">{p.manque}</span>}
              <span className="ml-auto flex items-center gap-1">
                {a.proprietaires.length > 1 && (
                  <>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={enCours || rang === 0} aria-label={`Placer ${p.nom} plus haut`} onClick={() => void deplacer(p.id, 'monter')}>
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={enCours || rang === a.proprietaires.length - 1}
                      aria-label={`Placer ${p.nom} plus bas`}
                      onClick={() => void deplacer(p.id, 'descendre')}
                    >
                      <ArrowDown />
                    </Button>
                  </>
                )}
                <Link to={`/outils/syndic/proprietaires/${encodeURIComponent(p.id)}${retour}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  <Pencil data-icon="inline-start" /> Modifier
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
      {a.proprietaires.length > 1 && <p className="mt-2 text-body text-muted-foreground">L’ordre ci-dessus est celui imprimé sur les documents.</p>}
      {rattacher && <RattacherDialog appartement={a} onClose={() => setRattacher(false)} onPhrase={onPhrase} />}
    </Card>
  );
}
