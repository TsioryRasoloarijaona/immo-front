import { Field } from '../ui';
import { formatDateTime } from '../../lib/format';

function libelle(par: string | undefined, le: string | null | undefined): string | undefined {
  if (!par && !le) return undefined;
  return [par, le ? formatDateTime(le) : undefined].filter(Boolean).join(' · ');
}

/** Trace OMRAN (GEN0016) : `UserCreate*` / `UserUpdate*`. */
export default function ChampsTrace({
  creePar,
  creeLe,
  modifiePar,
  modifieLe,
}: Readonly<{ creePar?: string; creeLe?: string | null; modifiePar?: string; modifieLe?: string | null }>) {
  return (
    <>
      <Field label="Créé par" value={libelle(creePar, creeLe)} />
      <Field label="Modifié par" value={libelle(modifiePar, modifieLe)} />
    </>
  );
}
