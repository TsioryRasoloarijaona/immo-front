import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

/* `<Suspense>` couvre l'attente d'un `React.lazy`, jamais son échec : sans ce
   filet, un module introuvable (déploiement pendant qu'un onglet est ouvert,
   coupure réseau) démonte tout l'arbre. */

/** Reconnu sur le message : chaque navigateur formule l'échec d'import à sa façon. */
function estEchecDeChargement(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|importing a module script|failed to fetch|load failed|chunk/i.test(message);
}

interface Props {
  children: ReactNode;
  /** Change à chaque navigation, pour que l'erreur d'une page n'emprisonne pas les suivantes. */
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
    // Sans ce log, l'erreur absorbée par la frontière disparaît de la console.
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
        {/* Rechargement complet, pas un nouvel essai de rendu : après un déploiement,
            seul un `index.html` neuf donne les noms de fichiers à jour. */}
        <Button type="button" onClick={() => window.location.reload()}>
          <RotateCcw data-icon="inline-start" /> Recharger la page
        </Button>
        <span className="max-w-140 text-micro text-muted-foreground">{error.message}</span>
      </div>
    );
  }
}
