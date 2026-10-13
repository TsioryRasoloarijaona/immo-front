import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { formatIlYa, pluriel } from '../../lib/format';
import { useNotifications, type PermissionNavigateur } from '../../lib/notificationsContext';
import { cn } from '../../lib/utils';
import type { NotificationDto } from '../../types';

/** Cloche de l'en-tête : pastille des non lues, panneau des dernières notifications (FEATURE-repartition-notifications.md §4). */
export default function Cloche() {
  const { notifications, nonLues, erreur, sonne, marquerLue, marquerToutLu } = useNotifications();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);

  function ouvrir(n: NotificationDto) {
    void marquerLue(n);
    setOuvert(false);
    if (n.lien) void navigate(n.lien);
  }

  const libelle = nonLues > 0 ? `Notifications : ${pluriel(nonLues, 'non lue', 'non lues')}` : 'Notifications';

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger
        render={<Button type="button" variant="ghost" size="icon-lg" aria-label={libelle} title={libelle} />}
        className={cn('relative', nonLues > 0 && 'text-primary')}
      >
        {sonne ? <BellRing className="size-5 motion-safe:animate-bounce" /> : <Bell className="size-5" />}
        {nonLues > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-micro font-bold text-white tabular-nums ring-2 ring-background"
          >
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
          <span className="text-body font-semibold text-foreground">Notifications</span>
          <Button type="button" variant="ghost" size="sm" disabled={nonLues === 0} onClick={() => void marquerToutLu()}>
            Tout marquer comme lu
          </Button>
        </div>
        {erreur && <p role="alert" className="px-3.5 py-2 text-label text-destructive">{erreur}</p>}
        <ListeNotifications notifications={notifications} onOuvrir={ouvrir} />
        <ActivationNavigateur />
      </PopoverContent>
    </Popover>
  );
}

function ListeNotifications({
  notifications,
  onOuvrir,
}: Readonly<{ notifications: readonly NotificationDto[]; onOuvrir: (n: NotificationDto) => void }>) {
  if (notifications.length === 0) {
    return <p className="px-3.5 py-6 text-center text-label text-muted-foreground">Aucune notification pour l'instant.</p>;
  }
  return (
    <ul className="max-h-[60vh] overflow-y-auto">
      {notifications.map((n) => (
        <li key={n.id} className="border-b border-border last:border-b-0">
          <button
            type="button"
            onClick={() => onOuvrir(n)}
            className="flex w-full gap-2.5 px-3.5 py-2.5 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
          >
            <span
              aria-hidden
              className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.lueLe ? 'bg-transparent' : 'bg-primary')}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('text-body text-foreground', !n.lueLe && 'font-semibold')}>{n.titre}</span>
              <span className="text-label text-muted-foreground">{n.message}</span>
              <span className="text-micro text-muted-foreground">{formatIlYa(n.creeLe)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const AIDE_PERMISSION: Record<Exclude<PermissionNavigateur, 'default'>, string> = {
  granted: 'Notifications du navigateur activées.',
  denied: 'Notifications du navigateur bloquées : autorisez-les dans les réglages du navigateur.',
  'non-supportee': "Ce navigateur (ou une adresse non sécurisée) n'autorise pas les notifications système.",
};

function ActivationNavigateur() {
  const { permission, demanderPermission } = useNotifications();
  return (
    <div className="border-t border-border px-3.5 py-2.5">
      {permission === 'default' ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void demanderPermission()}>
          Activer les notifications
        </Button>
      ) : (
        <p className="text-micro text-muted-foreground">{AIDE_PERMISSION[permission]}</p>
      )}
    </div>
  );
}
