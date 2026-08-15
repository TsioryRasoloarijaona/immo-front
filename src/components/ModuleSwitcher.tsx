import { useNavigate } from 'react-router-dom';
import { APP_MODULES, type AppModule } from '../lib/modules';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';

// ERPNext/Odoo-style app launcher: full-screen overlay, grid of module cards.
// Vente/Patrimoine are real; the rest are visibly "Bientôt" and route to a
// dedicated placeholder rather than a dead link. See
// instructions/FIX-clients-and-module-switcher.md.
export default function ModuleSwitcher({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  function handleSelect(mod: AppModule) {
    onClose();
    navigate(mod.active && mod.path ? mod.path : `/bientot/${mod.slug}`);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Modules</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
          {APP_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.slug}
                type="button"
                onClick={() => handleSelect(mod)}
                className={cn(
                  'relative flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-4 pb-5 pt-6.5 text-center transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md',
                  !mod.active && 'opacity-70'
                )}
              >
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl [&_svg]:size-6',
                    mod.active ? 'bg-[var(--brand-bg)] text-[var(--brand)]' : 'bg-[var(--neutral-bg)] text-muted-foreground'
                  )}
                >
                  <Icon />
                </span>
                <span className="text-[13px] font-semibold text-foreground">{mod.label}</span>
                {!mod.active && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--amber-bg)] px-1.75 py-0.5 text-[10px] font-bold text-[var(--amber)]">
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
