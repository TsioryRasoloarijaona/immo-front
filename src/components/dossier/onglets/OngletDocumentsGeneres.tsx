import { useState } from 'react';
import { ChevronDown, ClipboardCheck, Download, Eye, FileDown, FileSignature, FileStack, FileText, Landmark, Loader2, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../../ui';
import { Button } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import {
  downloadActeReservation,
  downloadDossierPdfOnlyDocument,
  downloadFicheReservation,
  viewActeReservation,
  viewDossierPdfOnlyDocument,
  viewFicheReservation,
  type DossierPdfOnlyDocKind,
} from '../../../lib/api';

type GeneratedDocKind = 'fiche-reservation' | 'acte-reservation' | DossierPdfOnlyDocKind;

const GENERATED_DOC_HANDLERS: Record<GeneratedDocKind, {
  title: string;
  description: string;
  Icon: LucideIcon;
  hasDocx: boolean;
  view: (dossierId: string, format: 'pdf' | 'docx') => Promise<void>;
  download: (dossierId: string, filename: string, format: 'pdf' | 'docx') => Promise<void>;
}> = {
  'fiche-reservation': {
    title: 'Fiche de réservation',
    description: 'Fiche récapitulative de la réservation du bien.',
    Icon: FileText,
    hasDocx: true,
    view: viewFicheReservation,
    download: downloadFicheReservation,
  },
  'acte-reservation': {
    title: 'Acte de réservation',
    description: 'Contrat de réservation : clauses et engagements des parties.',
    Icon: FileSignature,
    hasDocx: true,
    view: viewActeReservation,
    download: downloadActeReservation,
  },
  'fiche-visite-technique': {
    title: 'Fiche visite technique',
    description: "Checklist d'inspection avant livraison, avec clause de contact SAV.",
    Icon: ClipboardCheck,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique', filename),
  },
  'fiche-dossier-vente': {
    title: 'Fiche dossier de vente',
    description: 'Récapitulatif interne complet : montants, financement, acquéreurs, historique.',
    Icon: FileStack,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente', filename),
  },
  'fiche-bancaire': {
    title: 'Fiche bancaire',
    description: 'Support de demande de crédit : état civil, bien, prix et reliquat.',
    Icon: Landmark,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-bancaire'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-bancaire', filename),
  },
  'fiche-trop-percu': {
    title: 'Fiche trop perçu',
    description: 'Reçu du trop-perçu lorsque les versements dépassent le prix du dossier.',
    Icon: Receipt,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu', filename),
  },
};

const GENERATED_DOC_KINDS: GeneratedDocKind[] = [
  'fiche-reservation',
  'acte-reservation',
  'fiche-visite-technique',
  'fiche-dossier-vente',
  'fiche-bancaire',
  'fiche-trop-percu',
];

function GeneratedDocumentCard({
  dossierId,
  code,
  kind,
}: Readonly<{
  dossierId: string;
  code?: string | null;
  kind: GeneratedDocKind;
}>) {
  const [busy, setBusy] = useState<'view' | 'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { title, description, Icon, hasDocx, view, download } = GENERATED_DOC_HANDLERS[kind];
  const filenameBase = code ? `${code}-${kind}` : kind;

  async function handle(action: 'view' | 'pdf' | 'docx') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await view(dossierId, 'pdf');
      else await download(dossierId, `${filenameBase}.${action}`, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  const downloading = busy === 'pdf' || busy === 'docx';

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card transition-[border-color,box-shadow,transform] hover:border-(--brand-border) sm:hover:-translate-y-px sm:hover:shadow-sm">
      <div className="flex flex-1 items-start gap-2.5 p-2.5">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-bg) text-(--brand) transition-colors group-hover:bg-(--brand)/12"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-label leading-snug font-medium text-foreground">{title}</span>
            <span className="mt-px shrink-0 rounded bg-muted px-1.5 py-0.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">
              {hasDocx ? 'PDF · Word' : 'PDF'}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-micro leading-[1.45] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-border px-2.5 py-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:h-7 sm:flex-none"
          disabled={!!busy}
          onClick={() => handle('view')}
        >
          {busy === 'view' ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Eye data-icon="inline-start" />}
          {busy === 'view' ? 'Génération…' : 'Aperçu'}
        </Button>
        {hasDocx ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button type="button" variant="ghost" size="sm" className="h-9 flex-1 sm:h-7 sm:flex-none" disabled={!!busy} />}
            >
              {downloading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
              Télécharger
              <ChevronDown data-icon="inline-end" className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handle('pdf')}>
                <Download /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handle('docx')}>
                <FileDown /> Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 flex-1 sm:h-7 sm:flex-none"
            disabled={!!busy}
            onClick={() => handle('pdf')}
          >
            {downloading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
            Télécharger
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="border-t border-destructive/25 bg-destructive/10 px-2.5 py-1 text-micro text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function OngletDocumentsGeneres({ dossierId, code }: Readonly<{ dossierId: string; code?: string | null }>) {
  return (
    <div className="p-3">
      <Card title="Documents générés">
        <p className="mb-2.5 -mt-1 text-body text-muted-foreground">
          Générés à la demande à partir des données du dossier — rien n'est enregistré ici.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {GENERATED_DOC_KINDS.map((kind) => (
            <GeneratedDocumentCard key={kind} dossierId={dossierId} code={code} kind={kind} />
          ))}
        </div>
      </Card>
    </div>
  );
}
