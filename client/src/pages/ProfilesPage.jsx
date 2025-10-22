import { useEffect, useMemo, useState } from 'react';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  getMyReport,
  getVacations
} from '../api';
import VacationForm from '../components/VacationForm';
import Modal from '../ui/Modal';

const roleOptions = [
  { value: 'employee', label: 'Employe' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrateur' }
];

const roleLabels = {
  employee: 'Employe',
  manager: 'Manager',
  admin: 'Administrateur'
};

const typeLabels = {
  ANNUAL: 'Conge annuel',
  SICK: 'Conge maladie',
  UNPAID: 'Conge sans solde',
  PARENTAL: 'Conge parental',
  COMP_TIME: 'Repos compensatoire',
  OTHER: 'Autre'
};

const statusLabels = {
  APPROVED: 'Approuve',
  PENDING: 'En attente',
  REJECTED: 'Refuse',
  CANCELLED: 'Annule'
};

const defaultNewEmployee = () => ({
  first_name: '',
  last_name: '',
  email: '',
  team: '',
  role: 'employee',
  allowance_days: 20,
  carryover_days: 0,
  start_date: new Date().toISOString().slice(0, 10),
  timezone: 'Europe/Paris'
});

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-none">
      <div className="text-subtle text-sm">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(defaultNewEmployee());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(defaultNewEmployee());
      setError('');
    }
  }, [open]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        allowance_days: Number(form.allowance_days),
        carryover_days: Number(form.carryover_days)
      };
      const created = await createEmployee(payload);
      onCreated?.(created);
    } catch (e) {
      setError(e.message || 'Impossible de creer le collaborateur');
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose?.();
      }}
      title="Ajouter un collaborateur"
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
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout...' : 'Ajouter'}
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Prenom</label>
          <input
            className="input mt-1"
            value={form.first_name}
            onChange={(e) => setField('first_name', e.target.value)}
            placeholder="Jeanne"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nom</label>
          <input
            className="input mt-1"
            value={form.last_name}
            onChange={(e) => setField('last_name', e.target.value)}
            placeholder="Dupont"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="input mt-1"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="jeanne.dupont@entreprise.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Equipe</label>
          <input
            className="input mt-1"
            value={form.team}
            onChange={(e) => setField('team', e.target.value)}
            placeholder="Ressources humaines"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <select
            className="select mt-1"
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Date d'entree</label>
          <input
            className="input mt-1"
            type="date"
            value={form.start_date}
            onChange={(e) => setField('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Jours de conges annuels</label>
          <input
            className="input mt-1"
            type="number"
            min="0"
            value={form.allowance_days}
            onChange={(e) => setField('allowance_days', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Jours reportes</label>
          <input
            className="input mt-1"
            type="number"
            min="0"
            value={form.carryover_days}
            onChange={(e) => setField('carryover_days', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Fuseau horaire</label>
          <input
            className="input mt-1"
            value={form.timezone}
            onChange={(e) => setField('timezone', e.target.value)}
            placeholder="Europe/Paris"
          />
        </div>
      </div>
      {error && <div className="text-danger text-sm mt-3">{error}</div>}
    </Modal>
  );
}

export default function ProfilesPage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [report, setReport] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [vacationFormOpen, setVacationFormOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  useEffect(() => {
    let active = true;
    setLoadingEmployees(true);
    setError('');
    getEmployees()
      .then((data) => {
        if (!active) return;
        setEmployees(data);
        if (data.length) {
          setSelectedEmployeeId(data[0].id);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Impossible de charger les collaborateurs');
      })
      .finally(() => {
        if (active) setLoadingEmployees(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadDetails = (employeeId) => {
    if (!employeeId) {
      setReport(null);
      setVacations([]);
      return;
    }
    setLoadingDetails(true);
    setDetailsError('');
    const currentYear = new Date().getFullYear();
    Promise.allSettled([
      getMyReport({ employeeId, year: currentYear }),
      getVacations({ employeeId })
    ])
      .then(([reportResult, vacationsResult]) => {
        if (reportResult.status === 'fulfilled') {
          setReport(reportResult.value);
        } else {
          setReport(null);
          setDetailsError(reportResult.reason?.message || 'Impossible de charger le rapport');
        }
        if (vacationsResult.status === 'fulfilled') {
          setVacations(vacationsResult.value);
        } else {
          setVacations([]);
          setDetailsError((prev) => prev || vacationsResult.reason?.message || 'Impossible de charger les conges');
        }
      })
      .finally(() => setLoadingDetails(false));
  };

  useEffect(() => {
    if (selectedEmployeeId) {
      loadDetails(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  const handleEmployeeCreated = (employee) => {
    const updated = [...employees, employee].sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'fr')
    );
    setEmployees(updated);
    setSelectedEmployeeId(employee.id);
    setAddEmployeeOpen(false);
  };

  const handleVacationCreated = (vacation) => {
    setVacationFormOpen(false);
    if (vacation && vacation.employee_id === selectedEmployeeId) {
      setVacations((prev) => [vacation, ...prev]);
      loadDetails(selectedEmployeeId);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeletingEmployee(true);
    setDeleteError('');
    const targetId = employeeToDelete.id;
    try {
      await deleteEmployee(targetId);
      const remaining = employees.filter((emp) => emp.id !== targetId);
      setEmployees(remaining);
      if (targetId === selectedEmployeeId) {
        const next = remaining[0];
        setSelectedEmployeeId(next ? next.id : '');
        if (next) {
          loadDetails(next.id);
        } else {
          setReport(null);
          setVacations([]);
        }
      }
      setEmployeeToDelete(null);
    } catch (e) {
      setDeleteError(e.message || 'Impossible de supprimer le collaborateur');
    } finally {
      setDeletingEmployee(false);
    }
  };

  return (
    <div className="grid gap-6">
      {error && <div className="card border border-red-200 bg-red-50 text-sm text-red-700 p-4">{error}</div>}
      <div className="grid md:grid-cols-[18rem_1fr] gap-6">
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Collaborateurs</div>
              <div className="text-subtle text-sm">Selectionnez un collaborateur pour consulter ses informations</div>
            </div>
            <button className="btn-primary" onClick={() => setAddEmployeeOpen(true)}>
              + Ajouter
            </button>
          </div>
          {loadingEmployees ? (
            <div className="text-sm text-subtle">Chargement des collaborateurs...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {employees.length ? (
                employees.map((emp) => {
                  const isActive = emp.id === selectedEmployeeId;
                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                        isActive ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line hover:border-brand-200'
                      }`}
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => setSelectedEmployeeId(emp.id)}
                      >
                        <div className="font-semibold text-sm">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-xs text-subtle">
                          {emp.team} - {roleLabels[emp.role] || emp.role}
                        </div>
                      </button>
                      <button
                        className="btn-outline text-xs"
                        onClick={() => {
                          setDeleteError('');
                          setEmployeeToDelete(emp);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-subtle">
                  Aucun collaborateur pour le moment. Ajoutez un employe pour commencer.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedEmployee ? (
            <>
              <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center text-xl">
                    {selectedEmployee.first_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-xl font-semibold">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </div>
                    <div className="text-subtle text-sm">{selectedEmployee.email}</div>
                    <div className="text-subtle text-sm">
                      {selectedEmployee.team} - {roleLabels[selectedEmployee.role] || selectedEmployee.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="btn-outline"
                    onClick={() => loadDetails(selectedEmployee.id)}
                    disabled={loadingDetails}
                  >
                    Actualiser
                  </button>
                  <button className="btn-primary" onClick={() => setVacationFormOpen(true)}>
                    + Enregistrer un conge
                  </button>
                </div>
              </div>

              {detailsError && (
                <div className="card border border-amber-200 bg-amber-50 text-sm text-amber-800 p-4">
                  {detailsError}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div className="card p-4 md:col-span-1">
                  <div className="font-semibold mb-3">Synthese des droits</div>
                  <DetailRow label="Quota annuel" value={`${selectedEmployee.allowance_days ?? '-'} jours`} />
                  <DetailRow label="Report" value={`${selectedEmployee.carryover_days ?? 0} jours`} />
                  <DetailRow label="Pris cette annee" value={`${report?.daysTaken ?? 0} jours`} />
                  <DetailRow label="Restant" value={`${report?.remaining ?? 0} jours`} />
                  <DetailRow label="Date d'entree" value={selectedEmployee.start_date} />
                  <DetailRow label="Fuseau horaire" value={selectedEmployee.timezone} />
                  <DetailRow label="Statut" value={selectedEmployee.active ? 'Actif' : 'Inactif'} />
                </div>

                <div className="card p-4 md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Historique des conges</div>
                    {loadingDetails && <div className="text-xs text-subtle">Actualisation...</div>}
                  </div>
                  {vacations.length ? (
                    <table className="w-full text-sm">
                      <thead className="text-left text-subtle">
                        <tr>
                          <th className="py-2">Dates</th>
                          <th>Type</th>
                          <th>Statut</th>
                          <th>Commentaires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacations.map((vacation) => (
                          <tr key={vacation.id} className="border-t border-line">
                            <td className="py-2">
                              {vacation.start_date} - {vacation.end_date}
                            </td>
                            <td>{typeLabels[vacation.type] || vacation.type}</td>
                            <td>{statusLabels[vacation.status] || vacation.status}</td>
                            <td className="text-subtle">{vacation.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-subtle">Aucun conge enregistre pour le moment.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-6 text-sm text-subtle">
              Selectionnez un collaborateur pour afficher son profil.
            </div>
          )}
        </div>
      </div>

      <VacationForm
        open={vacationFormOpen}
        onClose={() => setVacationFormOpen(false)}
        currentEmployeeId={selectedEmployeeId}
        defaultStart={new Date().toISOString().slice(0, 10)}
        defaultEnd={new Date().toISOString().slice(0, 10)}
        onCreated={handleVacationCreated}
      />

      <AddEmployeeModal
        open={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        onCreated={handleEmployeeCreated}
      />

      <Modal
        open={Boolean(employeeToDelete)}
        onClose={() => {
          if (!deletingEmployee) {
            setEmployeeToDelete(null);
            setDeleteError('');
          }
        }}
        title="Supprimer le collaborateur"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => {
                if (!deletingEmployee) {
                  setEmployeeToDelete(null);
                  setDeleteError('');
                }
              }}
            >
              Annuler
            </button>
            <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={handleConfirmDelete} disabled={deletingEmployee}>
              {deletingEmployee ? 'Suppression...' : 'Oui, supprimer'}
            </button>
          </>
        }
      >
        {employeeToDelete && (
          <div className="space-y-2">
            <p>
              Voulez-vous vraiment supprimer{' '}
              <strong>
                {employeeToDelete.first_name} {employeeToDelete.last_name}
              </strong>{' '}
              ?
            </p>
            <p className="text-sm text-subtle">
              Cette action supprimera egalement ses conges associes.
            </p>
            {deleteError && <p className="text-danger text-sm">{deleteError}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
