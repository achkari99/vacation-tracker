const STORAGE_KEY = 'vacation-tracker-data';

const currentYear = new Date().getFullYear();

const seedData = {
  employees: [
    {
      id: 'emp-ava',
      first_name: 'Ava',
      last_name: 'Lopez',
      email: 'ava@company.com',
      team: 'Ingenierie',
      role: 'employee',
      allowance_days: 22,
      carryover_days: 2,
      timezone: 'America/Los_Angeles',
      active: true,
      start_date: '2022-03-14'
    },
    {
      id: 'emp-noah',
      first_name: 'Noah',
      last_name: 'Patel',
      email: 'noah@company.com',
      team: 'Design',
      role: 'employee',
      allowance_days: 20,
      carryover_days: 0,
      timezone: 'America/New_York',
      active: true,
      start_date: '2021-08-01'
    },
    {
      id: 'emp-mia',
      first_name: 'Mia',
      last_name: 'Chen',
      email: 'mia@company.com',
      team: 'Ressources humaines',
      role: 'admin',
      allowance_days: 25,
      carryover_days: 3,
      timezone: 'Europe/London',
      active: true,
      start_date: '2020-01-10'
    }
  ],
  holidays: [
    { id: 'hol-new-year', region: 'US', date: `${currentYear}-01-01`, name: "Jour de l'An" },
    { id: 'hol-independence', region: 'US', date: `${currentYear}-07-04`, name: "Fete de l'Independance" },
    { id: 'hol-thanksgiving', region: 'US', date: `${currentYear}-11-27`, name: 'Thanksgiving' },
    { id: 'hol-christmas', region: 'US', date: `${currentYear}-12-25`, name: 'Noel' }
  ],
  vacations: [
    {
      id: 'vac-ava-summer',
      employee_id: 'emp-ava',
      start_date: `${currentYear}-06-10`,
      end_date: `${currentYear}-06-14`,
      type: 'ANNUAL',
      status: 'APPROVED',
      notes: "Vacances d'ete"
    },
    {
      id: 'vac-noah-sick',
      employee_id: 'emp-noah',
      start_date: `${currentYear}-07-02`,
      end_date: `${currentYear}-07-03`,
      type: 'SICK',
      status: 'APPROVED',
      notes: 'Grippe'
    },
    {
      id: 'vac-mia-winter',
      employee_id: 'emp-mia',
      start_date: `${currentYear}-12-22`,
      end_date: `${currentYear}-12-31`,
      type: 'ANNUAL',
      status: 'APPROVED',
      notes: "Vacances d'hiver"
    }
  ]
};

let inMemoryStore = null;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const normaliseData = (data) => {
  const source = data && typeof data === 'object' ? data : {};
  return {
    employees: Array.isArray(source.employees) && source.employees.length ? source.employees : deepClone(seedData.employees),
    holidays: Array.isArray(source.holidays) && source.holidays.length ? source.holidays : deepClone(seedData.holidays),
    vacations: Array.isArray(source.vacations) ? source.vacations : deepClone(seedData.vacations)
  };
};

const loadStore = () => {
  if (typeof window === 'undefined') {
    return deepClone(seedData);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return deepClone(seedData);
    }
    const parsed = JSON.parse(raw);
    const store = normaliseData(parsed);
    // Ensure new seed entries exist if store was saved before they were added.
    if (!store.employees.length) store.employees = deepClone(seedData.employees);
    if (!store.holidays.length) store.holidays = deepClone(seedData.holidays);
    return store;
  } catch {
    return deepClone(seedData);
  }
};

const persistStore = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryStore));
  } catch {
    // ignore persistence errors (private browsing, etc.)
  }
};

const store = () => {
  if (!inMemoryStore) {
    inMemoryStore = loadStore();
  }
  return inMemoryStore;
};

export const listEmployees = () => deepClone(store().employees);

export const getEmployee = (id) => {
  const employee = store().employees.find((emp) => emp.id === id);
  return employee ? deepClone(employee) : null;
};

export const listVacations = (filter = {}) => {
  const { employeeId, type, status, from, to } = filter;
  const results = store().vacations.filter((vacation) => {
    if (employeeId && vacation.employee_id !== employeeId) return false;
    if (type && vacation.type !== type) return false;
    if (status && vacation.status !== status) return false;
    if (from && vacation.end_date < from) return false;
    if (to && vacation.start_date > to) return false;
    return true;
  });
  return deepClone(results);
};

export const addVacation = (payload) => {
  const data = store();
  const start = payload.start_date;
  const end = payload.end_date || payload.start_date;
  const [startDate, endDate] = start <= end ? [start, end] : [end, start];
  const newVacation = {
    id: generateId(),
    employee_id: payload.employee_id,
    start_date: startDate,
    end_date: endDate,
    type: payload.type || 'ANNUAL',
    status: 'APPROVED',
    notes: payload.notes || ''
  };
  data.vacations.push(newVacation);
  persistStore();
  return deepClone(newVacation);
};

export const updateVacation = (id, patch) => {
  const data = store();
  const index = data.vacations.findIndex((vacation) => vacation.id === id);
  if (index === -1) return null;
  const updated = { ...data.vacations[index], ...patch };
  if (updated.start_date && updated.end_date && updated.start_date > updated.end_date) {
    const [startDate, endDate] = [updated.end_date, updated.start_date];
    updated.start_date = startDate;
    updated.end_date = endDate;
  }
  data.vacations[index] = updated;
  persistStore();
  return deepClone(updated);
};

export const removeVacation = (id) => {
  const data = store();
  const index = data.vacations.findIndex((vacation) => vacation.id === id);
  if (index === -1) return false;
  data.vacations.splice(index, 1);
  persistStore();
  return true;
};

export const listHolidays = ({ region = 'US', year } = {}) => {
  const results = store().holidays.filter((holiday) => {
    if (region && holiday.region !== region) return false;
    if (year) {
      const holidayYear = new Date(holiday.date).getFullYear();
      if (holidayYear !== Number(year)) return false;
    }
    return true;
  });
  return deepClone(results);
};

export const computeReport = ({ employeeId, year = currentYear }) => {
  const employee = getEmployee(employeeId);
  if (!employee) return null;
  const vacations = listVacations({ employeeId, status: 'APPROVED' }).filter((vacation) => {
    const vacationYear = new Date(vacation.start_date).getFullYear();
    return vacationYear === Number(year);
  });
  const daysTaken = vacations.reduce((total, vacation) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return total + Math.max(diff, 0);
  }, 0);

  const allowance = (employee.allowance_days || 20) + (employee.carryover_days || 0);
  const remaining = Math.max(allowance - daysTaken, 0);
  const byType = vacations.reduce((summary, vacation) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const key = vacation.type || 'OTHER';
    summary[key] = (summary[key] || 0) + Math.max(diff, 0);
    return summary;
  }, {});

  return {
    employee: {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      allowance,
      carryover: employee.carryover_days || 0
    },
    year: Number(year),
    daysTaken,
    remaining,
    byType,
    vacations
  };
};

export const resetStore = () => {
  inMemoryStore = deepClone(seedData);
  persistStore();
};
