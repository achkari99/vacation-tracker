import { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { deleteVacation, getEmployees, getHolidays, getVacations } from '../api';
import { HOLIDAY_REGION } from '../config';
import Modal from '../ui/Modal';
import VacationForm from '../components/VacationForm';
import Legend from '../components/Legend';

const colors = {
  ANNUAL: '#2f83ff',
  SICK: '#16a34a',
  UNPAID: '#f59e0b',
  PARENTAL: '#ec4899',
  COMP_TIME: '#8b5cf6',
  OTHER: '#64748b'
};

const typeLabels = {
  ANNUAL: 'Conge annuel',
  SICK: 'Conge maladie',
  UNPAID: 'Conge sans solde',
  PARENTAL: 'Conge parental',
  COMP_TIME: 'Repos compensatoire',
  OTHER: 'Autre'
};

export default function CalendarPage() {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultRange, setDefaultRange] = useState({ start: '', end: '' });
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewRange, setViewRange] = useState({ start: '', end: '' });
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [eventError, setEventError] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingEmployees(true);
    getEmployees()
      .then((data) => {
        if (!active) return;
        setEmployees(data);
        setEmployeeError('');
      })
      .catch((err) => {
        if (active) setEmployeeError(err.message || 'Echec du chargement des collaborateurs');
      })
      .finally(() => {
        if (active) setLoadingEmployees(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchEvents = async (startStr, endStr) => {
    if (!startStr || !endStr) return;
    setLoadingEvents(true);
    setEventError('');
    try {
      const results = await getVacations({
        from: startStr.slice(0, 10),
        to: endStr.slice(0, 10),
        ...(employeeFilter ? { employeeId: employeeFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {})
      });
      setVacations(results);
    } catch (err) {
      setEventError(err.message || 'Echec du chargement des conges');
    } finally {
      setLoadingEvents(false);
    }
    try {
      const year = new Date(startStr).getFullYear();
      const hs = await getHolidays({ region: HOLIDAY_REGION, year });
      setHolidays(hs);
    } catch (err) {
      setEventError((prev) => prev || err.message || 'Echec du chargement des jours feries');
    }
  };

  useEffect(() => {
    if (viewRange.start && viewRange.end) {
      fetchEvents(viewRange.start, viewRange.end);
    }
  }, [employeeFilter, typeFilter]);

  const events = useMemo(() => {
    const vacationEvents = vacations.map((vacation) => {
      const employee = employees.find((emp) => emp.id === vacation.employee_id);
      return {
        id: vacation.id,
        title: `${employee?.first_name || 'Collaborateur'} - ${typeLabels[vacation.type] || vacation.type}`,
        start: vacation.start_date,
        end: new Date(new Date(vacation.end_date).getTime() + 24 * 60 * 60 * 1000),
        backgroundColor: colors[vacation.type] || colors.OTHER,
        borderColor: colors[vacation.type] || colors.OTHER
      };
    });

    const holidayEvents = holidays.map((holiday) => ({
      id: `holiday-${holiday.id}`,
      title: holiday.name,
      start: holiday.date,
      end: holiday.date,
      display: 'background',
      backgroundColor: 'rgba(14,165,233,0.15)'
    }));

    return [...vacationEvents, ...holidayEvents];
  }, [vacations, holidays, employees]);

  return (
    <div className="grid gap-6">
      {loadingEmployees && <div className="card p-4 text-sm text-subtle">Chargement des collaborateurs...</div>}
      {employeeError && (
        <div className="card border border-red-200 bg-red-50 text-sm text-red-700 p-4">{employeeError}</div>
      )}
      {eventError && <div className="card border border-red-200 bg-red-50 text-sm text-red-700 p-4">{eventError}</div>}

      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <Legend />
        <div className="flex items-center gap-3">
          <select className="select w-48" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="">Tous les collaborateurs</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
          <select className="select w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tous les types</option>
            {Object.keys(colors).map((type) => (
              <option key={type} value={type}>
                {typeLabels[type] || type}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            + Enregistrer un conge
          </button>
        </div>
      </div>

      <div className="card p-3">
        {loadingEvents && <div className="text-sm text-subtle px-3 pb-2">Chargement des conges...</div>}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'title', center: '', right: 'today prev,next dayGridMonth,listWeek' }}
          height="75vh"
          selectable
          weekends
          datesSet={(info) => {
            setViewRange({ start: info.startStr, end: info.endStr });
            fetchEvents(info.startStr, info.endStr);
          }}
          select={(info) => {
            const end = new Date(info.end);
            end.setDate(end.getDate() - 1);
            setDefaultRange({ start: info.startStr, end: end.toISOString().slice(0, 10) });
            setFormOpen(true);
          }}
          dateClick={(info) => {
            setDefaultRange({ start: info.dateStr, end: info.dateStr });
            setFormOpen(true);
          }}
          eventClick={(info) => {
            if (String(info.event.id).startsWith('holiday-')) return;
            const vacation = vacations.find((v) => String(v.id) === String(info.event.id));
            if (vacation) setSelectedVacation(vacation);
          }}
          dayCellClassNames={(arg) => {
            const day = arg.date.getDay();
            return day === 0 || day === 6 ? ['is-weekend'] : [];
          }}
          events={events}
        />
      </div>

      <VacationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultStart={defaultRange.start}
        defaultEnd={defaultRange.end}
        currentEmployeeId={employeeFilter}
        onCreated={(created) => {
          setFormOpen(false);
          if (created) {
            setVacations((prev) => {
              const exists = prev.some((v) => v.id === created.id);
              if (exists) {
                return prev.map((v) => (v.id === created.id ? created : v));
              }
              return [...prev, created];
            });
          }
          if (viewRange.start && viewRange.end) {
            fetchEvents(viewRange.start, viewRange.end);
          }
        }}
      />

      <Modal
        open={Boolean(selectedVacation)}
        onClose={() => {
          if (!deleting) {
            setSelectedVacation(null);
            setDeleteError('');
          }
        }}
        title="Supprimer le conge"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => {
                if (!deleting) {
                  setSelectedVacation(null);
                  setDeleteError('');
                }
              }}
            >
              Annuler
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                if (!selectedVacation || deleting) return;
                setDeleting(true);
                setDeleteError('');
                try {
                  await deleteVacation(selectedVacation.id);
                  setVacations((prev) => prev.filter((vacation) => vacation.id !== selectedVacation.id));
                  setSelectedVacation(null);
                  if (viewRange.start && viewRange.end) {
                    fetchEvents(viewRange.start, viewRange.end);
                  }
                } catch (e) {
                  setDeleteError(e.message || 'Echec de la suppression du conge');
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer le conge'}
            </button>
          </>
        }
      >
        {selectedVacation && (
          <div className="space-y-2">
            <p>
              Supprimer le conge de{' '}
              <strong>
                {employees.find((emp) => emp.id === selectedVacation.employee_id)?.first_name || 'Collaborateur'}
              </strong>{' '}
              ?
            </p>
            <p className="text-sm text-subtle">
              {selectedVacation.start_date} - {selectedVacation.end_date}
            </p>
            {deleteError && <p className="text-danger text-sm">{deleteError}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
