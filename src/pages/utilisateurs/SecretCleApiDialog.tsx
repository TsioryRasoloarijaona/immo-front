import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { libellePortee } from '../../lib/clesApi';
import type { CleApiCreeeDto } from '../../types';

/* Le serveur ne garde que le hash : fermer sans copier, c'est devoir régénérer.
   En régénération, l'ancien secret est déjà refusé. */
export default function SecretCleApiDialog({
  resultat,
  mode,
  onClose,
}: Readonly<{
  resultat: CleApiCreeeDto;
  mode: 'creation' | 'regeneration';
  onClose: () => void;
}>) {
  const [copie, setCopie] = useState<'repos' | 'copie' | 'echec'>('repos');
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);
  const { cleApi, cle } = resultat;

  async function copier() {
    try {
      await navigator.clipboard.writeText(cle);
      setCopie('copie');
    } catch {
      setCopie('echec');
    }
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setCopie('repos'), 2000);
  }

  return (
    <Modal title={mode === 'creation' ? 'Clé d\'API créée' : 'Secret régénéré'} onClose={onClose} width={560}>
      <div className="flex flex-col gap-3.5">
        <p className="text-body text-foreground">
          <Check aria-hidden className="mr-1 inline size-3.5 text-(--success)" />
          {mode === 'creation' ? (
            <>La clé <span className="font-medium">{cleApi.nom}</span> est créée, avec le compte de service <span className="font-medium">{cleApi.compteNom || cleApi.compteCode}</span>.</>
          ) : (
            <>Le secret de <span className="font-medium">{cleApi.nom}</span> a été régénéré. L'ancien n'est plus accepté.</>
          )}
        </p>

        <div className="rounded-md border border-(--warning)/30 bg-(--warning-bg) p-3">
          <div className="mb-1 flex items-center gap-1.5 text-micro font-medium text-(--warning)">
            <AlertTriangle aria-hidden className="size-3" />
            Secret — affiché une seule fois
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-label font-medium text-foreground" title={cle}>
              {cle}
            </code>
            <Button type="button" size="icon-sm" variant="outline" title="Copier" aria-label="Copier le secret" onClick={copier}>
              <Copy />
            </Button>
          </div>
          {copie === 'copie' && <div className="mt-1 text-micro text-(--success)">Copié.</div>}
          {copie === 'echec' && (
            <div className="mt-1 text-micro text-destructive">Copie impossible — sélectionnez le secret et copiez-le à la main.</div>
          )}
          <p className="mt-2 text-micro text-muted-foreground">
            Le serveur n'en conserve que l'empreinte : une fois cette boîte fermée, il ne pourra plus être affiché.
            En cas de perte, régénérez la clé.
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-label">
          <dt className="text-muted-foreground">Préfixe</dt>
          <dd className="font-mono text-foreground">{cleApi.clePrefixe || '—'}</dd>
          <dt className="text-muted-foreground">Portées</dt>
          <dd className="text-foreground">{(cleApi.portees ?? []).map(libellePortee).join(', ') || '—'}</dd>
          <dt className="text-muted-foreground">En-tête</dt>
          <dd className="text-foreground">
            <code className="font-mono">X-Api-Key</code>
            <span className="text-muted-foreground"> — dans n8n : credential « Header Auth » avec ce nom et ce secret.</span>
          </dd>
        </dl>
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" onClick={onClose}>J'ai copié le secret</Button>
      </DialogFooter>
    </Modal>
  );
}
