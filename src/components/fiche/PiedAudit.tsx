import { formatDateTime } from '../../lib/format';

/** « Créé par … le … · Modifié par … le … » ; une partie inconnue s'affiche « — ». */
export default function PiedAudit({
  creePar,
  creeLe,
  modifiePar,
  modifieLe,
}: Readonly<{ creePar?: string | null; creeLe?: string | null; modifiePar?: string | null; modifieLe?: string | null }>) {
  return (
    <>
      Créé par {creePar || '—'} le {formatDateTime(creeLe)} · Modifié par {modifiePar || '—'} le {formatDateTime(modifieLe)}
    </>
  );
}
