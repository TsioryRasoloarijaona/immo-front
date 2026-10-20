import { Badge } from '../ui';
import EtatListe from './EtatListe';
import LienFiche from './LienFiche';
import TableauLecture, { type ColonneLecture } from './TableauLecture';
import { listDossiersArticle } from '../../lib/apiArticleOnglets';
import { LIBELLE_ORIGINE } from '../../lib/articleOnglets';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency } from '../../lib/format';
import { usePreview } from '../../lib/previewContext';
import { useApi } from '../../lib/useApi';
import type { ArticleDossierDto } from '../../types/articleOnglets';

const montant = (v?: number | null) => (v == null ? '—' : formatCurrency(v));

/** Ventes, locations et syndics de l'article ; seule une vente ouvre sa fiche (en dialogue). */
export default function DossiersArticle({ articleId }: Readonly<{ articleId: string }>) {
  const dossiers = useApi(() => listDossiersArticle(articleId), [articleId]);
  const { ouvrirFicheDossier } = usePreview();
  const colonnes: ColonneLecture<ArticleDossierDto>[] = [
    { titre: 'Origine', rendu: (d) => (d.origine ? <Badge tone="neutral">{LIBELLE_ORIGINE[d.origine]}</Badge> : '—') },
    {
      titre: 'Code',
      rendu: (d) => (
        <LienFiche onOuvrir={d.origine === 'VENTE' && d.id ? () => ouvrirFicheDossier(d.id as string) : undefined}>
          {d.code || '—'}
        </LienFiche>
      ),
    },
    { titre: 'Statut', rendu: (d) => (d.statut ? <Badge tone={toneForStatus(canonicalStatusLabel(d.statut))}>{canonicalStatusLabel(d.statut)}</Badge> : '—') },
    { titre: 'Client', rendu: (d) => d.client || '—' },
    { titre: 'Article', rendu: (d) => d.articleCode || '—' },
    { titre: 'Société', rendu: (d) => d.societe || '—' },
    { titre: 'Tranche', rendu: (d) => d.tranche || '—' },
    { titre: 'Programme', rendu: (d) => d.programme || '—' },
    { titre: 'Catégorie', rendu: (d) => d.categorie || '—' },
    { titre: 'Type', rendu: (d) => d.type || '—' },
    { titre: 'Présentation', rendu: (d) => d.presentation || '—' },
    { titre: 'Total', droite: true, rendu: (d) => montant(d.total) },
    { titre: 'Réglé', droite: true, rendu: (d) => montant(d.regle) },
    { titre: 'Reste', droite: true, rendu: (d) => montant(d.reste) },
  ];
  return (
    <EtatListe etat={dossiers} vide={{ titre: 'Aucun dossier', message: "Aucun dossier n'est rattaché à cet article." }}>
      {(lignes) => <TableauLecture lignes={lignes} colonnes={colonnes} cle={(d, i) => `${d.origine}-${d.id ?? i}`} />}
    </EtatListe>
  );
}
