import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { getTypesDocumentsStatutAchat } from '../../lib/apiAchatConfig';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { cleDocument as cle } from '../../lib/documentsTransitionAchat';
import { texteBrut } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { DocumentTransitionAchatDto } from '../../types/achatConfig';

type Decompte = NonNullable<DocumentTransitionAchatDto['decompte']>;

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

const DECOMPTES: { valeur: Decompte; libelle: string }[] = [
  { valeur: 'PREMIER', libelle: 'Premier' },
  { valeur: 'INTERMEDIAIRE', libelle: 'Intermédiaire' },
  { valeur: 'FINAL', libelle: 'Final' },
];

/** Grille « Fichiers attachés » d'une transition : type de document × type de marché (× décompte), toujours obligatoire. */
export default function DocumentsTransitionAchat({ lignes, avecDecompte, onChange }: Readonly<{
  lignes: DocumentTransitionAchatDto[];
  avecDecompte: boolean;
  onChange: (v: DocumentTransitionAchatDto[]) => void;
}>) {
  const types = useApi(getTypesDocumentsStatutAchat, [], 'achat-config-types-documents');
  const marches = useApi(() => listLignesReferentiel('types-lot'), [], 'achat-config-types-marche');
  const maj = (i: number, p: Partial<DocumentTransitionAchatDto>) => onChange(lignes.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const doublon = new Set(lignes.map(cle)).size !== lignes.length;
  const grille = avecDecompte ? 'grid-cols-[1fr_1fr_9rem_2rem]' : 'grid-cols-[1fr_1fr_2rem]';
  const erreur = types.error ?? marches.error;
  return (
    <div className="flex flex-col gap-2">
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      {lignes.length === 0 && <p className="text-micro text-muted-foreground">Aucun document à joindre.</p>}
      {lignes.length > 0 && (
        <div className={`grid ${grille} gap-2 text-micro font-medium text-muted-foreground`}>
          <span>Type de document</span>
          <span>Type de marché</span>
          {avecDecompte && <span>Décompte</span>}
          <span />
        </div>
      )}
      {lignes.map((l, i) => (
        <div key={`${cle(l)}-${i}`} className={`grid ${grille} items-center gap-2`}>
          <select aria-label="Type de document" className={CLASSE_SELECT} value={l.typeDocumentId} onChange={(e) => maj(i, { typeDocumentId: e.target.value })}>
            <option value="">Choisir…</option>
            {(types.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.description ?? t.code}</option>)}
            {l.typeDocumentLibelle && !types.data?.some((t) => t.id === l.typeDocumentId) && <option value={l.typeDocumentId}>{l.typeDocumentLibelle}</option>}
          </select>
          <select aria-label="Type de marché" className={CLASSE_SELECT} value={l.typeMarcheId} onChange={(e) => maj(i, { typeMarcheId: e.target.value })}>
            <option value="">Choisir…</option>
            {(marches.data ?? []).flatMap((m) => (m.id ? [<option key={m.id} value={m.id}>{texteBrut(m.description) || texteBrut(m.code)}</option>] : []))}
            {l.typeMarcheLibelle && !marches.data?.some((m) => m.id === l.typeMarcheId) && <option value={l.typeMarcheId}>{l.typeMarcheLibelle}</option>}
          </select>
          {avecDecompte && (
            <select aria-label="Décompte" className={CLASSE_SELECT} value={l.decompte ?? ''} onChange={(e) => maj(i, { decompte: (e.target.value || null) as Decompte | null })}>
              <option value="">Choisir…</option>
              {DECOMPTES.map((d) => <option key={d.valeur} value={d.valeur}>{d.libelle}</option>)}
            </select>
          )}
          <Button type="button" size="icon-sm" variant="outline" title="Retirer la ligne" aria-label="Retirer la ligne"
            onClick={() => onChange(lignes.filter((_, k) => k !== i))}>
            <Trash2 />
          </Button>
        </div>
      ))}
      {doublon && <p role="alert" className="text-micro text-destructive">Une même combinaison apparaît deux fois.</p>}
      <Button type="button" size="icon-sm" variant="outline" className="self-start" title="Ajouter une ligne" aria-label="Ajouter une ligne"
        onClick={() => onChange([...lignes, { typeDocumentId: '', typeMarcheId: '', decompte: null }])}>
        <Plus />
      </Button>
    </div>
  );
}
