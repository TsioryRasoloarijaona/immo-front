import { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { libellePortee } from '../../lib/clesApi';
import type { CleApiCreeeDto } from '../../types';

/** Le secret d'une clé, **montré une seule fois** — après la création et
 * après la régénération, les deux seules routes qui le renvoient. Le serveur
 * n'en garde que le hash : fermer cette boîte sans copier, c'est devoir
 * régénérer.
 *
 * Même boîte pour les deux cas : `mode` ne change que le titre et la phrase
 * d'avertissement (en régénération, l'ancien secret a déjà cessé d'être
 * accepté — le client est cassé tant que la nouvelle valeur n'est pas
 * posée). La mécanique de copie reprend `TempPasswordBox` de la
 * réinitialisation de mot de passe, qui répond au même besoin. */
export default function SecretCleApiDialog({
  resultat,
  mode,
  onClose,
}: {
  resultat: CleApiCreeeDto;
  mode: 'creation' | 'regeneration';
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { cleApi, cle } = resultat;

  function copier() {
    void navigator.clipboard.writeText(cle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {copied && <div className="mt-1 text-micro text-(--success)">Copié.</div>}
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
