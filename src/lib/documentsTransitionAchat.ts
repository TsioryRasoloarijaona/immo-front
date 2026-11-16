import type { DocumentTransitionAchatDto } from '../types/achatConfig';

/** Seule gestion dont les documents portent un décompte. */
export const GESTION_DECOMPTES = 'PrjInvoiceDebitWorkingOut';

export const cleDocument = (l: DocumentTransitionAchatDto) => `${l.typeDocumentId}|${l.typeMarcheId}|${l.decompte ?? ''}`;

/** Une ligne vide, un doublon ou un décompte manquant empêche l'enregistrement. */
export function documentsValides(lignes: DocumentTransitionAchatDto[], avecDecompte: boolean): boolean {
  return new Set(lignes.map(cleDocument)).size === lignes.length
    && lignes.every((l) => l.typeDocumentId && l.typeMarcheId && (!avecDecompte || l.decompte));
}
