
import { Submission, EventStatus, ServerFile } from './types';

// Helper to convert File to base64 for API transmission
const fileToServerFile = (file: File): Promise<ServerFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            mimeType: file.type,
            data: (reader.result as string).split(',')[1]
        });
        reader.onerror = error => reject(error);
    });
};

type SubmissionInput = Omit<Submission, 'id' | 'submissionDate' | 'status' | 'statusHistory'>;

export const addSubmission = async (submissionData: SubmissionInput): Promise<Submission> => {
    // Prepare data for API - convert files to base64 objects
    const payload = {
        ...submissionData,
        documents: await Promise.all(submissionData.documents.map(f => fileToServerFile(f as File))),
        registrationCertificates: await Promise.all(submissionData.registrationCertificates.map(f => fileToServerFile(f as File))),
        vehiclePlatePhotos: await Promise.all(submissionData.vehiclePlatePhotos.map(f => fileToServerFile(f as File))),
        installationDocuments: await Promise.all((submissionData.installationDocuments || []).map(f => fileToServerFile(f as File))),
        vehicleDocumentationPhotos: await Promise.all((submissionData.vehicleDocumentationPhotos || []).map(f => fileToServerFile(f as File))),
    };

    const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Chyba při odesílání formuláře na server.');
    }

    const resData = await response.json();
    return { ...submissionData, id: resData.id } as Submission;
};

export const getSubmissions = async (): Promise<Submission[]> => {
    const response = await fetch('/api/submissions');
    if (!response.ok) throw new Error('Nepodařilo se načíst data.');
    
    const data = await response.json();
    // Dates come back as strings from JSON, need to convert back to Date objects
    return data.map((sub: any) => ({
        ...sub,
        submissionDate: new Date(sub.submissionDate),
        statusHistory: (sub.statusHistory || []).map((h: any) => ({ ...h, date: new Date(h.date) })),
        internalNotes: (sub.internalNotes || []).map((n: any) => ({ ...n, date: new Date(n.date) })),
    }));
};

export const getSubmissionWithFiles = async (id: string): Promise<Submission | null> => {
    const response = await fetch(`/api/submissions/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Chyba při načítání detailu.');

    const sub = await response.json();
    return {
        ...sub,
        submissionDate: new Date(sub.submissionDate),
        statusHistory: (sub.statusHistory || []).map((h: any) => ({ ...h, date: new Date(h.date) })),
        internalNotes: (sub.internalNotes || []).map((n: any) => ({ ...n, date: new Date(n.date) })),
    };
};

export const updateSubmissionStatus = async (id: string, newStatus: EventStatus): Promise<Submission> => {
    const response = await fetch(`/api/submissions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) throw new Error('Chyba při aktualizaci stavu.');
    
    // For simplicity in UI update, we just fetch the full object or patch it locally
    // In a real app, we might return the updated object from server
    return (await getSubmissionWithFiles(id)) as Submission;
};

export const addInternalNote = async (id: string, noteText: string): Promise<Submission> => {
    const response = await fetch(`/api/submissions/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText })
    });

    if (!response.ok) throw new Error('Chyba při ukládání poznámky.');
    
    // We can just refetch or merge response
    const data = await response.json();
    const current = await getSubmissionWithFiles(id);
    if (!current) throw new Error('Submission missing');
    return { ...current, internalNotes: data.internalNotes.map((n: any) => ({ ...n, date: new Date(n.date) })) };
};

export const addInternalDocuments = async (id: string, files: File[]): Promise<Submission> => {
    const processedFiles = await Promise.all(files.map(fileToServerFile));
    
    const response = await fetch(`/api/submissions/${id}/internal-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: processedFiles })
    });

    if (!response.ok) throw new Error('Chyba při nahrávání.');

    const data = await response.json();
    const current = await getSubmissionWithFiles(id);
    if (!current) throw new Error('Submission missing');
    return { ...current, internalDocuments: data.internalDocuments };
};

export const deleteInternalDocument = async (id: string, fileIndex: number): Promise<Submission> => {
    const response = await fetch(`/api/submissions/${id}/internal-documents/${fileIndex}`, {
        method: 'DELETE'
    });

    if (!response.ok) throw new Error('Chyba při mazání.');

    const data = await response.json();
    const current = await getSubmissionWithFiles(id);
    if (!current) throw new Error('Submission missing');
    return { ...current, internalDocuments: data.internalDocuments };
};

export const assignEmployeeToSubmission = async (id: string, employee: string): Promise<Submission> => {
    const response = await fetch(`/api/submissions/${id}/employee`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee })
    });

    if (!response.ok) throw new Error('Chyba při přiřazování.');
    
    const current = await getSubmissionWithFiles(id);
    if (!current) throw new Error('Submission missing');
    return { ...current, assignedEmployee: employee };
};
