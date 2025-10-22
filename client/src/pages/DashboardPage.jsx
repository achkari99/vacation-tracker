import { useEffect, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { getEmployees, getHolidays, getMyReport, getVacations } from '../api';
import { HOLIDAY_REGION } from '../config';
import StatCard from '../components/StatCard';

const typeLabels = {
  ANNUAL: 'Conge annuel',
  SICK: 'Conge maladie',
  UNPAID: 'Conge sans solde',
  PARENTAL: 'Conge parental',
  COMP_TIME: 'Repos compensatoire',
  OTHER: 'Autre'
};

function MiniList({ title, items, empty }) {
  return (
    <div className="card p-5">
      <div className="font-semibold mb-3">{title}</div>
      <div className="flex flex-col gap-3">
        {items.length
          ? items.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm">{item.label}</div>
                <div className="text-sm text-subtle">{item.meta}</div>
              </div>
            ))
          : <div className="text-subtle text-sm">{empty}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [todayOff, setTodayOff] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getEmployees()
      .then((data) => {
        if (active) setEmployees(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Echec du chargement des collaborateurs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    getVacations({ from: todayDate, to: todayDate })
      .then((vacations) => {
        if (!active) return;
        setTodayOff(
          vacations.map((vacation) => {
            const employee = employees.find((emp) => emp.id === vacation.employee_id);
            return {
              label: `${employee?.first_name || 'Collaborateur'} - ${employee?.last_name || ''}`,
              meta:
                vacation.start_date === vacation.end_date
                  ? vacation.start_date
                  : `${vacation.start_date} - ${vacation.end_date}`
            };
          })
        );
      })
      .catch((err) => {
        if (active) setError(err.message || 'Echec du chargement des conges');
      });

    getHolidays({ region: HOLIDAY_REGION })
      .then((holidays) => {
        if (!active) return;
        const upcoming = holidays
          .map((holiday) => ({
            ...holiday,
            normalizedDate: new Date(holiday.date)
          }))
          .filter((holiday) =>
            holiday.normalizedDate.getFullYear() === currentYear &&
            holiday.normalizedDate.getTime() >= todayStart.getTime()
          )
          .slice(0, 5)
          .map(({ normalizedDate, ...rest }) => ({
            ...rest,
            date: normalizedDate.toISOString().slice(0, 10)
          }));
        setUpcomingHolidays(upcoming.map((holiday) => ({ label: holiday.name, meta: holiday.date })));
      })
      .catch((err) => {
        if (active) setError(err.message || 'Echec du chargement des jours feries');
      });

    return () => {
      active = false;
    };
  }, [employees]);

  useEffect(() => {
    if (!employees.length) return;
    let active = true;
    const firstEmployee = employees[0];
    getMyReport({ employeeId: firstEmployee.id, year: new Date().getFullYear() })
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Echec du chargement du rapport');
      });
    return () => {
      active = false;
    };
  }, [employees]);

  useEffect(() => {
    if (!report) return;
    const canvas = document.getElementById('byTypeChart');
    if (!canvas) return;
    const data = report.byType || {};
    const labels = Object.keys(data).map((key) => typeLabels[key] || key);
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: Object.values(data)
          }
        ]
      },
      options: {
        plugins: {
          legend: { display: true, position: 'bottom' }
        }
      }
    });
    return () => chart.destroy();
  }, [report]);

  return (
    <div className="grid gap-6">
      {error && <div className="card border border-red-200 bg-red-50 text-sm text-red-700 p-4">{error}</div>}
      {loading && <div className="card p-4 text-sm text-subtle">Chargement des collaborateurs...</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Collaborateurs" value={employees.length} />
        <StatCard label="Absents aujourd'hui" value={todayOff.length} sub="Toutes equipes confondues" />
        <StatCard label="Jours feries restants" value={upcomingHolidays.length} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <MiniList title="Absents aujourd'hui" items={todayOff} empty="Personne n'est absent aujourd'hui." />
        <MiniList title="Jours feries a venir" items={upcomingHolidays} empty="Aucun jour ferie prochainement." />
        <div className="card p-5">
          <div className="font-semibold mb-3">Repartition des conges</div>
          <canvas id="byTypeChart" height="200" />
        </div>
      </div>

      <div className="card p-6">
        <div className="font-semibold text-lg mb-2">Actions rapides</div>
        <div className="flex flex-wrap gap-3">
          <a href="/calendar" className="btn-primary">
            Ouvrir le calendrier
          </a>
          <a href="/profiles" className="btn-outline">
            Consulter les profils
          </a>
        </div>
      </div>
    </div>
  );
}
