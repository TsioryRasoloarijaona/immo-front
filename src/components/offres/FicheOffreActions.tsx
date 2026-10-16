import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { downloadDevisDocument, viewDevisDocument } from '../../lib/api';
import type { DevisDto } from '../../types';

/** Fiche PDF d'une offre (aperçu + téléchargement). Composant et non rendu inline : l'état de génération est par
 * ligne, une fonction de cellule ne peut pas le porter. `compact` = taille d'une cellule de grille. */
export default function FicheOffreActions({ offre: o, compact = true }: Readonly<{ offre: DevisDto; compact?: boolean }>) {
  const [generating, setGenerating] = useState<'view' | 'download' | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerateFiche(action: 'view' | 'download') {
    if (!o.prospectionId) return;
    setGenerating(action);
    setGenError(null);
    try {
      if (action === 'view') await viewDevisDocument(o.prospectionId, o.id);
      // Le code (`26/00314`) porte un `/` : remplacé comme côté back, sinon le nom serait un chemin.
      else await downloadDevisDocument(o.prospectionId, o.id, `offre-${(o.code ?? o.id).replaceAll(/[/\\]/g, '-')}.pdf`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Échec de la génération.');
    } finally {
      setGenerating(null);
    }
  }

  const tailleTexte = compact ? 'h-5 gap-1 px-1.5 text-micro' : undefined;
  return (
    // Conteneur neutre : il arrête seulement le clic avant la ligne, qui ouvrirait le détail.
    <div role="presentation" className="flex flex-col items-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={tailleTexte}
          disabled={!!generating || !o.prospectionId}
          title={o.prospectionId ? undefined : 'Prospection introuvable pour cette offre'}
          onClick={() => handleGenerateFiche('view')}
        >
          <FileText className={compact ? 'size-3' : undefined} data-icon="inline-start" />
          {generating === 'view' ? 'Génération…' : 'Fiche offre'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={compact ? 'size-5' : undefined}
          disabled={!!generating || !o.prospectionId}
          title="Télécharger la fiche offre (PDF)"
          aria-label="Télécharger la fiche offre"
          onClick={() => handleGenerateFiche('download')}
        >
          <Download className={compact ? 'size-3' : undefined} />
        </Button>
      </div>
      {genError && <span className="text-micro text-destructive">{genError}</span>}
    </div>
  );
}
