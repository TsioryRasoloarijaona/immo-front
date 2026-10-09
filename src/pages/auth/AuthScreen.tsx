import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

/** Shared centered-card shell for every gate screen (login, forced
 * password change, first-login profile completion) — deliberately outside
 * <Layout>/<SidebarProvider>: none of these apply while there's no
 * authenticated + onboarded session to show a sidebar for. */
export default function AuthScreen({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          {/* Même marque que la barre latérale (Layout.tsx) : le
              « A »-pignon d'Arpent, variante inverse en sombre, mot-symbole
              en encre — l'orange vit dans le sommet de la marque. */}
          <img src="/brand/arpent-mark.svg" alt="" aria-hidden className="size-13 shrink-0 dark:hidden" />
          <img src="/brand/arpent-mark-inverse.svg" alt="" aria-hidden className="hidden size-13 shrink-0 dark:block" />
          <span className="font-heading text-hero leading-none font-black tracking-tighter text-foreground">Arpent</span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-muted-foreground">CRM immobilier</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
