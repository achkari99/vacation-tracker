import { supabase } from './lib/supabaseClient';

const defaultYear = new Date().getFullYear();

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normaliseString = (value) => (typeof value === 'string' ? value.trim() : '');

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true });

  if (error) {
    console.error(error);
    throw new Error(error.message || 'Impossible de charger les collaborateurs');
  }

  return data ?? [];
}

export async function createEmployee(payload) {
  if (!payload) throw new Error("Les informations du collaborateur sont requises");

  const body = {
    first_name: normaliseString(payload.first_name) || 'Nouveau',
    last_name: normaliseString(payload.last_name) || 'Collaborateur',
    email: normaliseString(payload.email) || `collaborateur-${Date.now()}@exemple.com`,
    team: normaliseString(payload.team) || 'General',
    role: normaliseString(payload.role) || 'employee',
    allowance_days: parseNumber(payload.allowance_days, 20),
    carryover_days: parseNumber(payload.carryover_days, 0),
    timezone: normaliseString(payload.timezone) || 'Europe/Paris',
    active: payload.active ?? true,
    start_date: normaliseString(payload.start_date) || new Date().toISOString().slice(0, 10)
  };

  const { data, error } = await supabase.from('employees').insert(body).select().single();

  if (error) {
    console.error(error);
    throw new Error(error.message || "Impossible d'ajouter le collaborateur");
  }

  return data;
}

export async function deleteEmployee(id) {
  if (!id) throw new Error("L'identifiant du collaborateur est requis");

  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) {
    console.error(error);
    throw new Error(error.message || "Impossible de supprimer le collaborateur");
  }
  return true;
}

export async function getVacations(params = {}) {
  let query = supabase.from('vacations').select('*');

  if (params.employeeId) query = query.eq('employee_id', params.employeeId);
  if (params.type) query = query.eq('type', params.type);
  if (params.status) query = query.eq('status', params.status);
  if (params.from) query = query.gte('end_date', params.from);
  if (params.to) query = query.lte('start_date', params.to);

  const { data, error } = await query.order('start_date', { ascending: true });

  if (error) {
    console.error(error);
    throw new Error(error.message || 'Impossible de charger les conges');
  }

  return data ?? [];
}

export async function createVacation(payload) {
  if (!payload || !payload.employee_id) throw new Error('Le collaborateur est requis');
  if (!payload.start_date) throw new Error('La date de debut est requise');

  const start = payload.start_date;
  const end = payload.end_date || payload.start_date;
  const [startDate, endDate] = start <= end ? [start, end] : [end, start];

  const body = {
    employee_id: payload.employee_id,
    start_date: startDate,
    end_date: endDate,
    type: payload.type || 'ANNUAL',
    status: payload.status || 'APPROVED',
    notes: payload.notes || ''
  };

  const { data, error } = await supabase.from('vacations').insert(body).select().single();

  if (error) {
    console.error(error);
    throw new Error(error.message || "Impossible d'enregistrer le conge");
  }

  return data;
}

export async function updateVacation(id, payload) {
  if (!id) throw new Error("L'identifiant du conge est requis");

  const body = { ...payload };
  if (body.start_date && body.end_date) {
    const [startDate, endDate] =
      body.start_date <= body.end_date
        ? [body.start_date, body.end_date]
        : [body.end_date, body.start_date];
    body.start_date = startDate;
    body.end_date = endDate;
  }

  const { data, error } = await supabase.from('vacations').update(body).eq('id', id).select().single();
  if (error) {
    console.error(error);
    throw new Error(error.message || 'Impossible de mettre a jour le conge');
  }
  return data;
}

export async function deleteVacation(id) {
  if (!id) throw new Error("L'identifiant du conge est requis");
  const { error } = await supabase.from('vacations').delete().eq('id', id);
  if (error) {
    console.error(error);
    throw new Error(error.message || 'Impossible de supprimer le conge');
  }
  return true;
}

export async function getHolidays(params = {}) {
  let query = supabase.from('holidays').select('*');
  if (params.region) query = query.eq('region', params.region);

  if (params.year) {
    const year = Number(params.year);
    if (!Number.isNaN(year)) {
      query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
    }
  }

  const { data, error } = await query.order('date', { ascending: true });
  if (error) {
    console.error(error);
    throw new Error(error.message || 'Impossible de charger les jours feries');
  }
  return data ?? [];
}

export async function getMyReport({ employeeId, year }) {
  if (!employeeId) throw new Error("L'identifiant collaborateur est requis");

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle();

  if (employeeError) {
    console.error(employeeError);
    throw new Error(employeeError.message || 'Impossible de charger le collaborateur');
  }
  if (!employee) return null;

  const targetYear = Number(year) || defaultYear;

  const { data: vacations, error: vacationsError } = await supabase
    .from('vacations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'APPROVED')
    .order('start_date', { ascending: true });

  if (vacationsError) {
    console.error(vacationsError);
    throw new Error(vacationsError.message || 'Impossible de charger les conges');
  }

  const relevantVacations = (vacations ?? []).filter((vacation) => {
    const vacationYear = new Date(vacation.start_date).getFullYear();
    return vacationYear === targetYear;
  });

  const daysTaken = relevantVacations.reduce((total, vacation) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return total + Math.max(diff, 0);
  }, 0);

  const allowance = parseNumber(employee.allowance_days, 20) + parseNumber(employee.carryover_days, 0);
  const remaining = Math.max(allowance - daysTaken, 0);

  const byType = relevantVacations.reduce((acc, vacation) => {
    const key = vacation.type || 'OTHER';
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    acc[key] = (acc[key] || 0) + Math.max(diff, 0);
    return acc;
  }, {});

  return {
    employee: {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      allowance,
      carryover: parseNumber(employee.carryover_days, 0)
    },
    year: targetYear,
    daysTaken,
    remaining,
    byType,
    vacations: relevantVacations
  };
}
