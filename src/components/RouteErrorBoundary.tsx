import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

/* ---------------------------------------------------------------------------
   Filet sous les routes chargées à la demande.

   Chaque page est derrière un `React.lazy`, donc son code n'arrive qu'au moment
   où l'on y navigue. `<Suspense>` couvre l'attente, **jamais l'échec** : quand
   le téléchargement du module échoue, l'erreur remonte sans être attrapée et
   React démonte tout l'arbre — écran blanc, et une seule ligne dans la console
   (« Failed to fetch dynamically imported module »).

   Deux causes, l'une inévitable :

   1. **Un déploiement pendant qu'un onglet est ouvert.** Les noms de fichiers
      portent un hachage : après publication, celui que l'onglet connaît n'existe
      plus. La page suivante visitée casse. Cela arrivera à chaque mise en ligne,
      quel que soit l'état du réseau.
   2. Une coupure réseau passagère.

   Dans les deux cas le remède est le même — recharger complètement, ce qui
   récupère un `index.html` neuf et donc les bons noms de fichiers. D'où le
   rechargement dur plutôt qu'un simple `retry` React, qui réessaierait le même
   nom disparu.
--------------------------------------------------------------------------- */

/** Un échec d'import dynamique, par opposition à une vraie erreur de rendu.
 * Les navigateurs ne partagent pas un type d'erreur commun ici : Chrome dit
 * « Failed to fetch dynamically imported module », Firefox « error loading
 * dynamically imported module », Safari « Importing a module script failed ».
 * On reconnaît donc sur le message, faute de mieux. */
function estEchecDeChargement(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|importing a module script|failed to fetch|load failed|chunk/i.test(message);
}

interface Props {
  children: ReactNode;
  /** Change à chaque navigation : remet la frontière à zéro pour que l'erreur
   * d'une page n'emprisonne pas les suivantes. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Laisser une trace : sans cela l'erreur disparaît complètement de la
    // console, la frontière l'ayant absorbée.
    console.error('[route] rendu interrompu', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chargement = estEchecDeChargement(error);

    return (
      <div className="flex min-h-70 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-(--warning-bg) text-(--warning)">
          <AlertTriangle className="size-5" />
        </span>
        <h2 className="text-title font-semibold text-foreground">
          {chargement ? "Cette page n'a pas pu être chargée" : 'Cette page a rencontré une erreur'}
        </h2>
        <p className="max-w-140 text-body text-muted-foreground">
          {chargement ? (
            <>
              Le code de la page n'a pas pu être téléchargé. C'est le cas après une mise à jour de
              l'application, ou si la connexion a été interrompue. Recharger suffit en général.
            </>
          ) : (
            <>Le reste de l'application continue de fonctionner ; vous pouvez changer de page.</>
          )}
        </p>
        {/* Rechargement complet, et non un simple nouvel essai de rendu : après
            un déploiement, le fichier que cet onglet réclame n'existe plus.
            Seul un aller-retour complet récupère les noms à jour. */}
        <Button type="button" onClick={() => window.location.reload()}>
          <RotateCcw data-icon="inline-start" /> Recharger la page
        </Button>
        <span className="max-w-140 text-micro text-muted-foreground">{error.message}</span>
      </div>
    );
  }
}
