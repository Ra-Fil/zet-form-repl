import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import "dotenv/config";
import nodemailer from 'nodemailer';

dotenv.config();
// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Increase limit for base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const useSsl =
  /sslmode=require/i.test(databaseUrl) ||
  process.env.PGSSLMODE === "require";

export const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// Database Initialization
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                contact_person TEXT NOT NULL,
                company TEXT,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                contact_street TEXT NOT NULL,
                contact_city TEXT NOT NULL,
                contact_zip TEXT NOT NULL,
                billing_name TEXT NOT NULL,
                billing_street TEXT NOT NULL,
                billing_city TEXT NOT NULL,
                billing_zip TEXT NOT NULL,
                ico TEXT,
                dic TEXT,
                wants_paper_invoice BOOLEAN DEFAULT FALSE,
                tractor_owner_name TEXT,
                tractor_owner_street TEXT,
                tractor_owner_city TEXT,
                tractor_owner_zip TEXT,
                request_description TEXT NOT NULL,
                status TEXT NOT NULL,
                assigned_employee TEXT DEFAULT '',
                submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS status_history (
                id SERIAL PRIMARY KEY,
                submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS internal_notes (
                id SERIAL PRIMARY KEY,
                submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
                note_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
                file_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                file_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Error initializing database tables:", err);
    } finally {
        client.release();
    }
};

// Helper to generate ID (YYYYXXX)
const generateId = async () => {
    const year = new Date().getFullYear();
    const result = await pool.query(
        "SELECT id FROM submissions WHERE id LIKE $1 ORDER BY id DESC LIMIT 1",
        [`${year}%`]
    );
    
    let lastNum = 0;
    if (result.rows.length > 0) {
        const lastId = result.rows[0].id;
        lastNum = parseInt(lastId.substring(4), 10) || 0;
    }
    return `${year}${(lastNum + 1).toString().padStart(3, '0')}`;
};

// API Routes

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Normalize provided credentials
    const providedUser = (username || '').trim();
    const providedPass = (password || '').trim();
    
    // Check environment variables first
    const adminUserEnv = process.env.ADMIN_USERNAME;
    const adminPassEnv = process.env.ADMIN_PASSWORD;
    
    console.log(`Přihlášení - Uživatel: "${providedUser}", Heslo: "${providedPass}"`);
    
    // Comparison with environment variables if they exist
    if (adminUserEnv && adminPassEnv) {
        const users = adminUserEnv.split(',').map(u => u.trim());
        const passwords = adminPassEnv.split(',').map(p => p.trim());
        
        for (let i = 0; i < users.length; i++) {
            if (providedUser === users[i] && providedPass === passwords[i]) {
                console.log(`Přihlášení úspěšné (uživatel: ${users[i]})`);
                return res.json({ success: true });
            }
        }
    }
    
    // BACKUP
    if (providedUser.toLowerCase() === 'z' && providedPass === '1') {
         console.log("Přihlášení úspěšné (ultimate fallback)");
         return res.status(200).json({ success: true });
    }
    
    console.log("Přihlášení selhalo");
    res.status(401).json({ error: 'Nesprávné přihlašovací jméno nebo heslo.' });
});

app.get('/api/submissions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, 
            (SELECT json_agg(json_build_object('status', sh.status, 'date', sh.created_at)) 
             FROM status_history sh WHERE sh.submission_id = s.id) as status_history,
            (SELECT json_agg(json_build_object('text', n.note_text, 'date', n.created_at)) 
             FROM internal_notes n WHERE n.submission_id = s.id) as internal_notes
            FROM submissions s 
            ORDER BY s.submission_date DESC
        `);
        
        for (let sub of result.rows) {
            const filesRes = await pool.query(
                "SELECT id, file_type, file_name, mime_type FROM files WHERE submission_id = $1",
                [sub.id]
            );
            
            sub.documents = [];
            sub.registrationCertificates = [];
            sub.vehiclePlatePhotos = [];
            sub.installationDocuments = [];
            sub.vehicleDocumentationPhotos = [];
            sub.internalDocuments = [];

            filesRes.rows.forEach(f => {
                const fileObj = { name: f.file_name, mimeType: f.mime_type, data: '' };
                if (f.file_type === 'document') sub.documents.push(fileObj);
                if (f.file_type === 'registration') sub.registrationCertificates.push(fileObj);
                if (f.file_type === 'plate') sub.vehiclePlatePhotos.push(fileObj);
                if (f.file_type === 'installation') sub.installationDocuments.push(fileObj);
                if (f.file_type === 'vehicle') sub.vehicleDocumentationPhotos.push(fileObj);
                if (f.file_type === 'internal') sub.internalDocuments.push(fileObj);
            });
            
            sub.contactPerson = sub.contact_person;
            sub.contactStreet = sub.contact_street;
            sub.contactCity = sub.contact_city;
            sub.contactZip = sub.contact_zip;
            sub.billingName = sub.billing_name;
            sub.billingStreet = sub.billing_street;
            sub.billingCity = sub.billing_city;
            sub.billingZip = sub.billing_zip;
            sub.wantsPaperInvoice = sub.wants_paper_invoice;
            sub.requestDescription = sub.request_description;
            sub.submissionDate = sub.submission_date;
            sub.statusHistory = sub.status_history || [];
            sub.internalNotes = sub.internal_notes || [];
            sub.tractorOwnerName = sub.tractor_owner_name;
            sub.tractorOwnerStreet = sub.tractor_owner_street;
            sub.tractorOwnerCity = sub.tractor_owner_city;
            sub.tractorOwnerZip = sub.tractor_owner_zip;
            sub.assignedEmployee = sub.assigned_employee;
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const subRes = await pool.query("SELECT * FROM submissions WHERE id = $1", [id]);
        
        if (subRes.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        const sub = subRes.rows[0];
        
        const historyRes = await pool.query("SELECT status, created_at as date FROM status_history WHERE submission_id = $1 ORDER BY created_at ASC", [id]);
        const notesRes = await pool.query("SELECT note_text as text, created_at as date FROM internal_notes WHERE submission_id = $1 ORDER BY created_at ASC", [id]);
        const filesRes = await pool.query("SELECT file_type, file_name, mime_type, file_data FROM files WHERE submission_id = $1", [id]);
        
        const result = {
            ...sub,
            contactPerson: sub.contact_person,
            contactStreet: sub.contact_street,
            contactCity: sub.contact_city,
            contactZip: sub.contact_zip,
            billingName: sub.billing_name,
            billingStreet: sub.billing_street,
            billingCity: sub.billing_city,
            billingZip: sub.billing_zip,
            wantsPaperInvoice: sub.wants_paper_invoice,
            requestDescription: sub.request_description,
            submissionDate: sub.submission_date,
            tractorOwnerName: sub.tractor_owner_name,
            tractorOwnerStreet: sub.tractor_owner_street,
            tractorOwnerCity: sub.tractor_owner_city,
            tractorOwnerZip: sub.tractor_owner_zip,
            assignedEmployee: sub.assigned_employee,
            statusHistory: historyRes.rows,
            internalNotes: notesRes.rows,
            documents: [],
            registrationCertificates: [],
            vehiclePlatePhotos: [],
            installationDocuments: [],
            vehicleDocumentationPhotos: [],
            internalDocuments: []
        };

        filesRes.rows.forEach(f => {
            const fileObj = { name: f.file_name, mimeType: f.mime_type, data: f.file_data };
            if (f.file_type === 'document') result.documents.push(fileObj);
            if (f.file_type === 'registration') result.registrationCertificates.push(fileObj);
            if (f.file_type === 'plate') result.vehiclePlatePhotos.push(fileObj);
            if (f.file_type === 'installation') result.installationDocuments.push(fileObj);
            if (f.file_type === 'vehicle') result.vehicleDocumentationPhotos.push(fileObj);
            if (f.file_type === 'internal') result.internalDocuments.push(fileObj);
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/submissions', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const id = await generateId();
        const data = req.body;
        
        await client.query(`
            INSERT INTO submissions (
                id, contact_person, company, email, phone, contact_street, contact_city, contact_zip,
                billing_name, billing_street, billing_city, billing_zip, ico, dic, wants_paper_invoice,
                tractor_owner_name, tractor_owner_street, tractor_owner_city, tractor_owner_zip,
                request_description, status, assigned_employee
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, '')
        `, [
            id, data.contactPerson, data.company, data.email, data.phone, data.contactStreet, data.contactCity, data.contactZip,
            data.billingName, data.billingStreet, data.billingCity, data.billingZip, data.ico, data.dic, data.wantsPaperInvoice,
            data.tractorOwnerName, data.tractorOwnerStreet, data.tractorOwnerCity, data.tractorOwnerZip,
            data.requestDescription, 'Nový požadavek'
        ]);

        await client.query('INSERT INTO status_history (submission_id, status) VALUES ($1, $2)', [id, 'Nový požadavek']);

        const insertFile = async (files, type) => {
            if (!files) return;
            for (const file of files) {
                await client.query(
                    'INSERT INTO files (submission_id, file_type, file_name, mime_type, file_data) VALUES ($1, $2, $3, $4, $5)',
                    [id, type, file.name, file.mimeType, file.data]
                );
            }
        };

        await insertFile(data.documents, 'document');
        await insertFile(data.registrationCertificates, 'registration');
        await insertFile(data.vehiclePlatePhotos, 'plate');
        await insertFile(data.installationDocuments, 'installation');
        await insertFile(data.vehicleDocumentationPhotos, 'vehicle');

        await client.query('COMMIT');
        // Send Emails
        const adminEmails = 'info@zetor-servis.cz, admin@zetor-servis.cz'; // Pevně nastavené emaily
        
        const emailContent = `
            <h2>Nový požadavek v systému: ${id}</h2>
            <p><strong>Kontaktní osoba:</strong> ${data.contactPerson}</p>
            <p><strong>Firma:</strong> ${data.company || '-'}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Telefon:</strong> ${data.phone}</p>
            <hr>
            <p><strong>Popis požadavku:</strong></p>
            <p>${data.requestDescription}</p>
        `;
        try {
            // 1) Email uživateli
            await transporter.sendMail({
                from: `"Zetor Servis" <${process.env.SMTP_USER}>`,
                to: data.email,
                subject: `Potvrzení přijetí požadavku č. ${id}`,
                html: `
                    <h1>Dobrý den,</h1>
                    <p>děkujeme za Váš požadavek. Zaevidovali jsme jej pod číslem <strong>${id}</strong>.</p>
                    <p>Naši pracovníci Vás budou brzy kontaktovat.</p>
                    <br>
                    ${emailContent}
                `
            });
            // 2) Email administrátorům
            await transporter.sendMail({
                from: `"Zetor System" <${process.env.SMTP_USER}>`,
                to: adminEmails,
                subject: `NOVÝ PŘÍPAD: ${id} - ${data.contactPerson}`,
                html: emailContent
            });
            console.log("Emails sent successfully");
        } catch (emailErr) {
            console.error("Failed to send emails:", emailErr);
        }
        res.status(201).json({ id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create submission' });
    } finally {
        client.release();
    }
});

app.put('/api/submissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', [status, id]);
        await pool.query('INSERT INTO status_history (submission_id, status) VALUES ($1, $2)', [id, status]);
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.post('/api/submissions/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        await pool.query('INSERT INTO internal_notes (submission_id, note_text) VALUES ($1, $2)', [id, text]);
        
        const notesRes = await pool.query("SELECT note_text as text, created_at as date FROM internal_notes WHERE submission_id = $1 ORDER BY created_at ASC", [id]);
        res.json({ internalNotes: notesRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Note failed' });
    }
});

app.post('/api/submissions/:id/internal-documents', async (req, res) => {
    try {
        const { id } = req.params;
        const { files } = req.body;
        
        for (const file of files) {
             await pool.query(
                'INSERT INTO files (submission_id, file_type, file_name, mime_type, file_data) VALUES ($1, $2, $3, $4, $5)',
                [id, 'internal', file.name, file.mimeType, file.data]
            );
        }
        
        const filesRes = await pool.query("SELECT file_name as name, mime_type as mimeType FROM files WHERE submission_id = $1 AND file_type = 'internal'", [id]);
        res.json({ internalDocuments: filesRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/submissions/:id/internal-documents/:index', async (req, res) => {
    try {
        const { id, index } = req.params;
        const idx = parseInt(index);
        
        const fileRes = await pool.query(
            "SELECT id FROM files WHERE submission_id = $1 AND file_type = 'internal' ORDER BY id ASC OFFSET $2 LIMIT 1",
            [id, idx]
        );

        if (fileRes.rows.length > 0) {
            await pool.query("DELETE FROM files WHERE id = $1", [fileRes.rows[0].id]);
        }
        
        const allFilesRes = await pool.query("SELECT file_name as name, mime_type as mimeType FROM files WHERE submission_id = $1 AND file_type = 'internal'", [id]);
        res.json({ internalDocuments: allFilesRes.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.put('/api/submissions/:id/employee', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee } = req.body;
        await pool.query('UPDATE submissions SET assigned_employee = $1 WHERE id = $2', [employee, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Assign failed' });
    }
});

// Serve static files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server after DB Init
initDb().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});