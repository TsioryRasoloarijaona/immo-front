import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';

/** Filet de sécurité autour des routes paresseuses.
 *
 * Les 29 pages sont chargées en `React.lazy`. Après un redéploiement, les
 * chunks de la version précédente n'existent plus : un onglet resté ouvert
 * qui navigue alors reçoit un 404 sur son `import()`, et l'exception remonte
 * jusqu'à la racine — écran blanc, sans rien indiquer à l'utilisateur ni
 * aucun moyen de s'en sortir. Recharger la page suffit à réparer ce cas
 * précis, d'où l'action proposée.
 *
 * Doit rester une classe : `componentDidCatch`/`getDerivedStateFromError`
 * n'ont pas d'équivalent en composant de fonction. */
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Pas de service de collecte d'erreurs dans ce projet : la console reste
    // le seul endroit où la pile est consultable.
    console.error('Erreur non rattrapée :', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-75 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-title font-semibold text-foreground">Cette page n'a pas pu être affichée</p>
        <p className="max-w-125 text-body text-muted-foreground">
          Une erreur inattendue s'est produite. Si l'application vient d'être mise à jour, recharger la
          page suffit généralement à la corriger.
        </p>
        <Button type="button" className="mt-1" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
      </div>
    );
  }
}
