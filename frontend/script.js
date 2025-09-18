const API_BASE_URL = 'http://localhost:3000/api';

let currentUser = null;
let token = null;
let workRecords = [];
let currentSession = null;
let filteredRecords = [];

// Elementos DOM
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app');
const currentTimeElement = document.getElementById('current-time');
const currentUserElement = document.getElementById('current-user');
const hoursTodayElement = document.getElementById('hours-today');
const hoursWeekElement = document.getElementById('hours-week');
const statusElement = document.getElementById('status');
const activityReportElement = document.getElementById('activity-report');
const historyTableBody = document.querySelector('#history-table tbody');
const loginMessageElement = document.getElementById('login-message');
const editModal = document.getElementById('edit-modal');

// Funciones de API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.body) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la solicitud');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // Verificar si hay un token guardado
  token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (token && savedUser) {
    currentUser = JSON.parse(savedUser);
    showApp();
  }

  // Event listeners
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-logout').addEventListener('click', logout);

  document.getElementById('btn-start').addEventListener('click', startWork);
  document.getElementById('btn-pause').addEventListener('click', pauseWork);
  document.getElementById('btn-end').addEventListener('click', endWork);
  document.getElementById('btn-save-activity').addEventListener('click', saveActivity);

  document.getElementById('btn-filter').addEventListener('click', filterRecords);
  document.getElementById('btn-clear-filter').addEventListener('click', clearFilter);

  document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
  document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);

  document.getElementById('close-edit-modal').addEventListener('click', hideEditModal);
  document.getElementById('btn-save-edit').addEventListener('click', saveEdit);

  window.addEventListener('click', (e) => {
    if (e.target === editModal) hideEditModal();
  });
});

// Funciones de autenticación
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showLoginMessage('Por favor, completa todos los campos.');
    return;
  }

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    token = data.token;
    currentUser = data.user;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    showApp();
    showLoginMessage('');
  } catch (error) {
    showLoginMessage(error.message);
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showLogin();
}

function showLoginMessage(message) {
  loginMessageElement.textContent = message;
}

function showLogin() {
  appSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

function showApp() {
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  currentUserElement.textContent = `Usuario: ${currentUser.name}`;
  loadUserData();
}

// Funciones principales
function updateCurrentTime() {
  const now = new Date();
  currentTimeElement.textContent = now.toLocaleTimeString();
}

async function loadUserData() {
  try {
    workRecords = await apiRequest('/records');
    workRecords.sort((a, b) => new Date(b.date + ' ' + b.start_time) - new Date(a.date + ' ' + a.start_time));

    // Encontrar sesión activa si existe
    const today = new Date().toLocaleDateString('es-ES');
    currentSession = workRecords.find(record => 
      record.date === today && record.end_time === null) || null;

    // Cargar actividades del día actual si existen
    const todayRecord = workRecords.find(record => 
      record.date === today && record.activities);
      
    if (todayRecord) {
      activityReportElement.value = todayRecord.activities || '';
    } else {
      activityReportElement.value = '';
    }

    updateStatus();
    updateStats();
    renderHistoryTable();
  } catch (error) {
    alert('Error al cargar los datos: ' + error.message);
  }
}

async function saveRecord(record) {
  try {
    await apiRequest('/records', {
      method: 'POST',
      body: record,
    });
    await loadUserData();
  } catch (error) {
    alert('Error al guardar el registro: ' + error.message);
  }
}

async function updateRecord(id, updates) {
  try {
    await apiRequest(`/records/${id}`, {
      method: 'PUT',
      body: updates,
    });
    await loadUserData();
  } catch (error) {
    alert('Error al actualizar el registro: ' + error.message);
  }
}

async function deleteRecord(id) {
  try {
    await apiRequest(`/records/${id}`, {
      method: 'DELETE',
    });
    await loadUserData();
  } catch (error) {
    alert('Error al eliminar el registro: ' + error.message);
  }
}

function updateStatus() {
  if (currentSession) {
    statusElement.textContent = 'Trabajando';
    statusElement.style.color = 'var(--success)';
  } else {
    statusElement.textContent = 'No iniciado';
    statusElement.style.color = 'var(--dark)';
  }
}

async function startWork() {
  if (currentSession) {
    alert('Ya tienes una jornada iniciada.');
    return;
  }

  const now = new Date();
  const start_time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('es-ES');

  currentSession = {
    date,
    start_time,
    end_time: null,
    activities: ''
  };

  try {
    await saveRecord(currentSession);
    alert('Jornada iniciada a las ' + start_time);
  } catch (error) {
    currentSession = null;
  }
}

function pauseWork() {
  if (!currentSession) {
    alert('No hay una jornada activa para pausar.');
    return;
  }

  alert('Función de pausa en desarrollo. Por ahora, usa "Finalizar Jornada" al terminar.');
}

async function endWork() {
  if (!currentSession) {
    alert('No hay una jornada activa para finalizar.');
    return;
  }

  const now = new Date();
  const end_time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // Guardar actividades antes de finalizar
  if (activityReportElement.value.trim() !== '') {
    currentSession.activities = activityReportElement.value;
  }

  currentSession.end_time = end_time;

  try {
    await updateRecord(currentSession.id, { end_time, activities: currentSession.activities });
    alert('Jornada finalizada a las ' + end_time);
    currentSession = null;
  } catch (error) {
    alert('Error al finalizar la jornada: ' + error.message);
  }
}

async function saveActivity() {
  if (!currentSession) {
    alert('Inicia una jornada primero para guardar actividades.');
    return;
  }

  currentSession.activities = activityReportElement.value;
  try {
    await updateRecord(currentSession.id, { activities: currentSession.activities });
    alert('Actividades guardadas correctamente.');
  } catch (error) {
    alert('Error al guardar actividades: ' + error.message);
  }
}

function updateStats() {
  // Calcular horas de hoy
  const today = new Date().toLocaleDateString('es-ES');
  const todayRecords = workRecords.filter(record => 
    record.date === today && record.end_time);

  let totalMinutesToday = 0;
  todayRecords.forEach(record => {
    const startTime = convertTimeStringToDate(record.start_time);
    const endTime = convertTimeStringToDate(record.end_time);
    const diffMs = endTime - startTime;
    totalMinutesToday += diffMs / (1000 * 60);
  });

  const hoursToday = Math.floor(totalMinutesToday / 60);
  const minutesToday = Math.floor(totalMinutesToday % 60);
  hoursTodayElement.textContent = `${hoursToday}h ${minutesToday}m`;

  // Calcular horas de la semana
  const weekRecords = workRecords.filter(record => {
    const recordDate = new Date(convertDateStringToDate(record.date));
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return recordDate >= weekStart && recordDate <= weekEnd && record.end_time;
  });

  let totalMinutesWeek = 0;
  weekRecords.forEach(record => {
    const startTime = convertTimeStringToDate(record.start_time);
    const endTime = convertTimeStringToDate(record.end_time);
    const diffMs = endTime - startTime;
    totalMinutesWeek += diffMs / (1000 * 60);
  });

  const hoursWeek = Math.floor(totalMinutesWeek / 60);
  const minutesWeek = Math.floor(totalMinutesWeek % 60);
  hoursWeekElement.textContent = `${hoursWeek}h ${minutesWeek}m`;
}

function renderHistoryTable() {
  historyTableBody.innerHTML = '';
  
  const recordsToRender = filteredRecords.length > 0 ? filteredRecords : workRecords;
  
  recordsToRender.forEach(record => {
    if (!record.end_time) return;
    
    const row = document.createElement('tr');
    
    // Calcular horas trabajadas
    const startTime = convertTimeStringToDate(record.start_time);
    const endTime = convertTimeStringToDate(record.end_time);
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    row.innerHTML = `
      <td>${record.date}</td>
      <td>${currentUser.name}</td>
      <td>${record.start_time}</td>
      <td>${record.end_time}</td>
      <td>${hours}h ${minutes}m</td>
      <td>${record.activities || '-'}</td>
      <td>
        <button class="action-btn btn-edit" data-id="${record.id}">Editar</button>
        <button class="action-btn btn-delete" data-id="${record.id}">Eliminar</button>
      </td>
    `;
    
    historyTableBody.appendChild(row);
  });
  
  // Agregar event listeners a los botones de editar y eliminar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      openEditModal(id);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      deleteRecordHandler(id);
    });
  });
}

async function deleteRecordHandler(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
    return;
  }
  
  try {
    await deleteRecord(id);
    alert('Registro eliminado correctamente.');
  } catch (error) {
    alert('Error al eliminar el registro: ' + error.message);
  }
}

function filterRecords() {
  const filterDate = document.getElementById('filter-date').value;
  if (!filterDate) {
    alert('Por favor, selecciona una fecha para filtrar.');
    return;
  }
  
  // Convertir la fecha del filtro al formato local
  const dateObj = new Date(filterDate);
  const filterDateFormatted = dateObj.toLocaleDateString('es-ES');
  
  filteredRecords = workRecords.filter(record => 
    record.date === filterDateFormatted && record.end_time);
  
  renderHistoryTable();
}

function clearFilter() {
  document.getElementById('filter-date').value = '';
  filteredRecords = [];
  renderHistoryTable();
}

function openEditModal(id) {
  const record = workRecords.find(r => r.id == id);
  if (!record) return;
  
  document.getElementById('edit-id').value = record.id;
  
  // Convertir la fecha al formato YYYY-MM-DD para el input date
  const [day, month, year] = record.date.split('/');
  document.getElementById('edit-date').value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Convertir la hora al formato HH:MM para el input time
  const [time, modifier] = record.start_time.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (modifier === 'p.m.' && hours < 12) {
    hours = parseInt(hours) + 12;
  } else if (modifier === 'a.m.' && hours == 12) {
    hours = 0;
  }
  
  document.getElementById('edit-start').value = `${hours.toString().padStart(2, '0')}:${minutes}`;
  
  if (record.end_time) {
    const [endTime, endModifier] = record.end_time.split(' ');
    let [endHours, endMinutes] = endTime.split(':');
    
    if (endModifier === 'p.m.' && endHours < 12) {
      endHours = parseInt(endHours) + 12;
    } else if (endModifier === 'a.m.' && endHours == 12) {
      endHours = 0;
    }
    
    document.getElementById('edit-end').value = `${endHours.toString().padStart(2, '0')}:${endMinutes}`;
  }
  
  document.getElementById('edit-activities').value = record.activities || '';
  
  editModal.style.display = 'flex';
}

function hideEditModal() {
  editModal.style.display = 'none';
}

async function saveEdit() {
  const id = document.getElementById('edit-id').value;
  const date = document.getElementById('edit-date').value;
  const start_time = document.getElementById('edit-start').value;
  const end_time = document.getElementById('edit-end').value;
  const activities = document.getElementById('edit-activities').value;
  
  if (!date || !start_time) {
    alert('Por favor, completa al menos la fecha y hora de inicio.');
    return;
  }
  
  // Convertir la fecha al formato local
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('es-ES');
  
  // Convertir la hora al formato local
  const startTimeObj = new Date(`1970-01-01T${start_time}`);
  const formattedStart = startTimeObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  let formattedEnd = '';
  if (end_time) {
    const endTimeObj = new Date(`1970-01-01T${end_time}`);
    formattedEnd = endTimeObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  
  try {
    await updateRecord(id, {
      date: formattedDate,
      start_time: formattedStart,
      end_time: formattedEnd,
      activities
    });
    
    hideEditModal();
    alert('Registro actualizado correctamente.');
  } catch (error) {
    alert('Error al actualizar el registro: ' + error.message);
  }
}

function exportToPDF() {
  alert('Función de exportación a PDF en desarrollo. En una implementación real, se usaría una librería como jsPDF.');
}

function exportToExcel() {
  alert('Función de exportación a Excel en desarrollo. En una implementación real, se usaría una librería como SheetJS.');
}

// Funciones auxiliares
function convertTimeStringToDate(timeString) {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');
  
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  if (modifier === 'p.m.' && hours < 12) {
    hours += 12;
  } else if (modifier === 'a.m.' && hours === 12) {
    hours = 0;
  }
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function convertDateStringToDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
}