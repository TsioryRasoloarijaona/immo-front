import { Badge } from '../ui';
import EtatListe from './EtatListe';
import LienFiche from '../LienFiche';
import TableauLecture, { type ColonneLecture } from './TableauLecture';
import { etapeBadgeTone, prospectionDisplayName } from '../../lib/domain';
import { listProspectionsArticle } from '../../lib/apiArticleOnglets';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { ProspectionListItemDto } from '../../types';

/** Prospections portant sur l'article, pré-prospections exclues ; la fiche s'ouvre en dialogue. */
export default function ProspectionsArticle({ articleId }: Readonly<{ articleId: string }>) {
  const prospections = useApi(() => listProspectionsArticle(articleId), [articleId]);
  const colonnes: ColonneLecture<ProspectionListItemDto>[] = [
    { titre: 'Date', rendu: (p) => formatDate(p.dateDocument) },
    {
      titre: 'Code',
      rendu: (p) => (
        <LienFiche cible={{ type: 'prospection', id: p.id, pre: false }} className="font-medium text-(--brand) hover:underline">
          {p.code || 'Voir la fiche'}
        </LienFiche>
      ),
    },
    { titre: 'Prospect', rendu: (p) => prospectionDisplayName(p) },
    { titre: 'Commercial', rendu: (p) => p.commercialNom || '—' },
    { titre: 'Étape', rendu: (p) => <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge> },
    { titre: 'Origine', rendu: (p) => p.origine || '—' },
    { titre: 'Tranche', rendu: (p) => p.trancheCode || '—' },
    { titre: 'Prix', droite: true, rendu: (p) => (p.prix ? formatCurrency(p.prix) : '—') },
  ];
  return (
    <EtatListe etat={prospections} vide={{ titre: 'Aucune prospection', message: "Aucune prospection ne porte sur cet article." }}>
      {(lignes) => <TableauLecture lignes={lignes} colonnes={colonnes} cle={(p) => p.id} />}
    </EtatListe>
  );
}
