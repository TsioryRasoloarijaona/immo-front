import { useState } from 'react';
import Modal from './Modal';
import type { NewInteractionInput } from '../lib/storeContext';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const RESULT_OPTIONS = ['Rendez-vous pris', 'À relancer', 'Ne répond pas', 'Hors budget', 'Intéressé', 'Pas intéressé'];

export default function InteractionForm({
  actionTypes,
  onClose,
  onSubmit,
}: {
  actionTypes: string[];
  onClose: () => void;
  onSubmit: (input: NewInteractionInput) => void;
}) {
  const [actionType, setActionType] = useState(actionTypes.includes('Téléphone Sortant') ? 'Téléphone Sortant' : actionTypes[0] ?? 'Note');
  const [resultat, setResultat] = useState('');
  const [report, setReport] = useState('');
  const [alertDate, setAlertDate] = useState('');
  const [rdvDate, setRdvDate] = useState('');
  const [rdvTime, setRdvTime] = useState('');
  const [rdvLabel, setRdvLabel] = useState('');

  const showRdv = actionType === 'Visite' || resultat === 'Rendez-vous pris';

  const actionTypeItems = actionTypes.map((t) => ({ label: t, value: t }));
  const resultItems = [{ label: '—', value: null as string | null }, ...RESULT_OPTIONS.map((r) => ({ label: r, value: r }))];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!report.trim()) return;
    onSubmit({
      actionType,
      report: resultat ? `[${resultat}] ${report.trim()}` : report.trim(),
      alertDate: alertDate || null,
      appointmentDate: showRdv && rdvDate ? `${rdvDate}${rdvTime ? `T${rdvTime}` : ''}` : null,
      appointmentLabel: showRdv && rdvLabel ? rdvLabel : null,
      isIncoming: actionType === 'Téléphone entrant' || actionType === 'Mail entrant' || actionType === 'Message entrant',
    });
    onClose();
  }

  return (
    <Modal title="Ajouter un appel / une visite" onClose={onClose} width={460}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormField>
              <FieldLabel htmlFor="actionType">Type d'action</FieldLabel>
              <Select items={actionTypeItems} value={actionType} onValueChange={(v) => setActionType(v as string)}>
                <SelectTrigger id="actionType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {actionTypeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="resultat">Résultat</FieldLabel>
              <Select
                items={resultItems}
                value={resultat || null}
                onValueChange={(v) => setResultat((v as string | null) ?? '')}
              >
                <SelectTrigger id="resultat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {resultItems.map((item) => (
                      <SelectItem key={item.value ?? '__empty'} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField>
            <FieldLabel htmlFor="report">Rapport</FieldLabel>
            <Textarea
              id="report"
              placeholder="Compte-rendu de l'appel / de la visite…"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              required
            />
          </FormField>

          <FormField>
            <FieldLabel htmlFor="alertDate">Relance prévue (optionnel)</FieldLabel>
            <Input id="alertDate" type="date" value={alertDate} onChange={(e) => setAlertDate(e.target.value)} />
          </FormField>

          {showRdv && (
            <div className="rounded-lg border border-border bg-muted/40 p-3.5">
              <div className="mb-2.5 text-[11.5px] font-medium text-muted-foreground">Rendez-vous</div>
              <div className="mb-2.5 grid grid-cols-2 gap-3">
                <FormField>
                  <FieldLabel htmlFor="rdvDate">Date</FieldLabel>
                  <Input id="rdvDate" type="date" value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="rdvTime">Heure</FieldLabel>
                  <Input id="rdvTime" type="time" value={rdvTime} onChange={(e) => setRdvTime(e.target.value)} />
                </FormField>
              </div>
              <FormField>
                <FieldLabel htmlFor="rdvLabel">Objet</FieldLabel>
                <Input
                  id="rdvLabel"
                  type="text"
                  placeholder="Visite technique, visite de réservation…"
                  value={rdvLabel}
                  onChange={(e) => setRdvLabel(e.target.value)}
                />
              </FormField>
            </div>
          )}
        </FieldGroup>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
