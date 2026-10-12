import { MessageCircle, Phone } from 'lucide-react';
import { buttonVariants } from '../ui/button';
import { lienAppel, lienWhatsApp } from '../../lib/contact';
import { cn } from '../../lib/utils';

/** « Appeler » (`tel:`) et « WhatsApp » (`wa.me`, nouvel onglet). Rien sans numéro. */
export default function ContactBoutons({
  nom,
  telephone,
  indicatif,
  libelles = false,
  onContact,
}: Readonly<{
  nom: string;
  telephone?: string | null;
  indicatif?: string | null;
  /** Libellés visibles ; sinon icônes seules, nommées pour les lecteurs d'écran. */
  libelles?: boolean;
  /** Après le clic : le contact a été tenté, l'écran propose de le noter. */
  onContact?: () => void;
}>) {
  const appel = lienAppel(telephone);
  const whatsapp = lienWhatsApp(telephone, indicatif);
  if (!appel || !whatsapp) return null;
  const taille = libelles ? 'sm' : 'icon-sm';
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <a
        href={appel}
        className={cn(buttonVariants({ variant: 'outline', size: taille }))}
        aria-label={`Appeler ${nom}`}
        title={`Appeler ${nom}`}
        onClick={onContact}
      >
        <Phone data-icon={libelles ? 'inline-start' : undefined} aria-hidden />
        {libelles && 'Appeler'}
      </a>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: taille }), 'text-(--success)')}
        aria-label={`WhatsApp ${nom} (nouvel onglet)`}
        title={`WhatsApp ${nom}`}
        onClick={onContact}
      >
        <MessageCircle data-icon={libelles ? 'inline-start' : undefined} aria-hidden />
        {libelles && 'WhatsApp'}
      </a>
    </span>
  );
}
