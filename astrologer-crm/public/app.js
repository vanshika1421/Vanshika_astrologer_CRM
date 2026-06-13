const API_URL = '/api';

function switchView(event, viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (viewName === 'dashboard') loadStats();
    if (viewName === 'clients') loadClients();
    if (viewName === 'appointments') loadAppointments();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

async function loadStats() {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();
    document.getElementById('stat-clients').textContent = data.totalClients;
    document.getElementById('stat-appointments').textContent = data.upcomingAppointments;
    document.getElementById('stat-consultations').textContent = data.completedConsultations;
}

async function loadClients(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_URL}/clients${query}`);
    const clients = await res.json();

    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = clients.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.email || 'N/A'}</td>
            <td>${c.birthDate ? new Date(c.birthDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openClientModal('${c._id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteClient('${c._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchClients() {
    const term = document.getElementById('search-input').value;
    loadClients(term);
}

async function openClientModal(id = '') {
    document.getElementById('client-modal').classList.add('active');
    document.getElementById('client-id').value = id;

    if (id) {
        const res = await fetch(`${API_URL}/clients`);
        const clients = await res.json();
        const client = clients.find(c => c._id === id);

        document.getElementById('client-modal-title').innerText = 'Edit Client';
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-dob').value = client.birthDate || '';
    } else {
        document.getElementById('client-modal-title').innerText = 'Add Client';
        ['client-name', 'client-phone', 'client-email', 'client-dob'].forEach(id => document.getElementById(id).value = '');
    }
}

function closeClientModal() {
    document.getElementById('client-modal').classList.remove('active');
}

async function saveClient() {
    const id = document.getElementById('client-id').value;
    const data = {
        name: document.getElementById('client-name').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        birthDate: document.getElementById('client-dob').value
    };

    if (!data.name || !data.phone) {
        alert('Name and phone are required.');
        return;
    }

    if (id) {
        await fetch(`${API_URL}/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } else {
        await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    closeClientModal();
    loadClients();
    loadStats();
}

async function deleteClient(id) {
    if (!confirm('Delete this client and all related records?')) return;
    await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
    loadClients();
    loadStats();
}

async function loadAppointments() {
    const res = await fetch(`${API_URL}/appointments`);
    const appts = await res.json();

    const tbody = document.getElementById('appts-table-body');
    tbody.innerHTML = appts.map(a => `
        <tr>
            <td>${a.clientId ? a.clientId.name : 'Unknown'}</td>
            <td>${a.date}</td>
            <td>${a.time}</td>
            <td>${a.status}</td>
            <td>
                ${a.status === 'Scheduled' ? `<button class="action-btn status-btn" onclick="completeAppt('${a._id}')">Mark Completed</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function openApptModal() {
    document.getElementById('appt-modal').classList.add('active');
    const res = await fetch(`${API_URL}/clients`);
    const clients = await res.json();
    const select = document.getElementById('appt-client');

    if (!clients.length) {
        select.innerHTML = '<option value="">No clients available</option>';
        return;
    }

    select.innerHTML = clients.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    document.getElementById('appt-date').value = '';
    document.getElementById('appt-time').value = '';
}

function closeApptModal() {
    document.getElementById('appt-modal').classList.remove('active');
}

async function saveAppt() {
    const data = {
        clientId: document.getElementById('appt-client').value,
        date: document.getElementById('appt-date').value,
        time: document.getElementById('appt-time').value,
        status: 'Scheduled'
    };

    if (!data.clientId || !data.date || !data.time) {
        alert('Please select a client, date, and time.');
        return;
    }

    await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    closeApptModal();
    loadAppointments();
    loadStats();
}

async function completeAppt(id) {
    await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
    });
    loadAppointments();
    loadStats();
}

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
});