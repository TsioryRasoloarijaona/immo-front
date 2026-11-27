import { Badge } from '../../components/ui';

/** Nom du bénéficiaire suivi de la pastille « Agence » quand la commission est due à l'agence. */
export default function CommercialAgence({ nom, agence }: Readonly<{ nom: string | null; agence: boolean }>) {
  if (!agence) return <>{nom || '—'}</>;
  return (
    <span className="inline-flex items-center gap-1">
      {nom || '—'} <Badge tone="info">Agence</Badge>
    </span>
  );
}
