const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE MODELS ---
const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    birthDate: String
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: String,
    time: String,
    status: { type: String, default: 'Scheduled' } // Scheduled, Completed, Cancelled
});

const ConsultationSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    notes: String,
    date: { type: String, default: new Date().toISOString().split('T')[0] }
});

const Client = mongoose.model('Client', ClientSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Consultation = mongoose.model('Consultation', ConsultationSchema);

// --- DASHBOARD STATS ---
app.get('/api/stats', async (req, res) => {
    try {
        const totalClients = await Client.countDocuments();
        const upcomingAppointments = await Appointment.countDocuments({ status: 'Scheduled' });
        const completedConsultations = await Consultation.countDocuments();
        res.json({ totalClients, upcomingAppointments, completedConsultations });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CLIENT ROUTES (CRUD + Search) ---
app.get('/api/clients', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        const clients = await Client.find(query).sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clients', async (req, res) => {
    try {
        const newClient = new Client(req.body);
        await newClient.save();
        res.status(201).json(newClient);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedClient);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        await Appointment.deleteMany({ clientId: req.params.id });
        await Consultation.deleteMany({ clientId: req.params.id });
        res.json({ message: 'Client deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- APPOINTMENT ROUTES ---
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().populate('clientId', 'name phone').sort({ date: 1 });
        res.json(appointments);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const newAppt = new Appointment(req.body);
        await newAppt.save();
        res.status(201).json(newAppt);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const updatedAppt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // Bonus logic: If marked completed, create a consultation record automatically
        if (req.body.status === 'Completed') {
            const existingCons = await Consultation.findOne({ clientId: updatedAppt.clientId, date: updatedAppt.date });
            if (!existingCons) {
                await new Consultation({ clientId: updatedAppt.clientId, notes: 'Auto-generated from completed appointment', date: updatedAppt.date }).save();
            }
        }
        res.json(updatedAppt);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- CONSULTATION ROUTES ---
app.get('/api/consultations/:clientId', async (req, res) => {
    try {
        const records = await Consultation.find({ clientId: req.params.clientId }).sort({ date: -1 });
        res.json(records);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/consultations', async (req, res) => {
    try {
        const newCons = new Consultation(req.body);
        await newCons.save();
        res.status(201).json(newCons);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => console.log(err));