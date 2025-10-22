import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { createVacation, getEmployees } from '../api';

const typeOptions = [
  { value: 'ANNUAL', label: 'Conge annuel' },
  { value: 'SICK', label: 'Conge maladie' },
  { value: 'UNPAID', label: 'Conge sans solde' },
  { value: 'PARENTAL', label: 'Conge parental' },
  { value: 'COMP_TIME', label: 'Repos compensatoire' },
  { value: 'OTHER', label: 'Autre' }
];

export default function VacationForm({
  open,
  onClose,
  defaultStart,
  defaultEnd,
  onCreated,
  currentEmployeeId
}) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: currentEmployeeId || '',
    start_date: defaultStart || '',
    end_date: defaultEnd || defaultStart || '',
    type: 'ANNUAL',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm({
      employee_id: currentEmployeeId || '',
      start_date: defaultStart || '',
      end_date: defaultEnd || defaultStart || '',
      type: 'ANNUAL',
      notes: ''
    });
    setError('');
  }, [open, defaultStart, defaultEnd, currentEmployeeId]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const created = await createVacation(form);
      onCreated?.(created);
      onClose?.();
    } catch (e) {
      setError(e.message || "Impossible d'enregistrer le conge");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose?.();
      }}
      title="Enregistrer un conge"
      footer={
        <>
          <button
            className="btn-outline"
            onClick={() => {
              if (!saving) onClose?.();
            }}
          >
            Annuler
          </button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer le conge'}
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Collaborateur</label>
          <select
            className="select mt-1"
            value={form.employee_id}
            onChange={(e) => setField('employee_id', e.target.value)}
          >
            <option value="">Selectionner un collaborateur...</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Type de conge</label>
          <select className="select mt-1" value={form.type} onChange={(e) => setField('type', e.target.value)}>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Date de debut</label>
          <input
            type="date"
            className="input mt-1"
            value={form.start_date}
            onChange={(e) => setField('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Date de fin</label>
          <input
            type="date"
            className="input mt-1"
            value={form.end_date}
            onChange={(e) => setField('end_date', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Commentaires</label>
          <textarea
            className="textarea mt-1"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>
      </div>
      {error && <div className="text-danger text-sm mt-3">{error}</div>}
    </Modal>
  );
}
