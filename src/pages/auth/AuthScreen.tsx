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
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          {/* Same wordmark treatment as the sidebar (Layout.tsx) — no
              raster app-icon, just "Ayad" in a heavy, tight-tracked cut of
              the app's own sans, colored with the (now monochrome) --brand
              accent. */}
          <span className="font-heading text-hero leading-none font-black tracking-tighter text-(--brand)">Ayad</span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-muted-foreground">Développement · CRM prototype</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            {/* Ces écrans sont hors du Layout/PageShell, donc c'est le seul <h1> de la page. */}
            <CardTitle as="h1" className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
