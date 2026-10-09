import { useNavigate } from 'react-router-dom';
import { APP_MODULES, type AppModule } from '../lib/modules';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/auth';
import { estAdministrateur } from '../lib/roles';

export default function ModuleSwitcher({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = estAdministrateur(user);
  const modules = APP_MODULES.filter((m) => !m.adminOnly || isAdmin);

  function handleSelect(mod: AppModule) {
    onClose();
    navigate(mod.active && mod.path ? mod.path : `/bientot/${mod.slug}`);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-205">
        <DialogHeader>
          <DialogTitle className="text-xl">Modules</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.slug}
                type="button"
                onClick={() => handleSelect(mod)}
                className={cn(
                  'relative flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-4 pb-5 pt-6.5 text-center transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--border-strong) hover:shadow-md',
                  !mod.active && 'opacity-70'
                )}
              >
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl [&_svg]:size-6',
                    mod.active ? 'bg-(--brand-bg) text-(--brand)' : 'bg-(--neutral-bg) text-muted-foreground'
                  )}
                >
                  <Icon />
                </span>
                <span className="text-label font-semibold text-foreground">{mod.label}</span>
                {!mod.active && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-(--amber-bg) px-1.75 py-0.5 text-micro font-bold text-(--amber)">
                    Bientôt
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
