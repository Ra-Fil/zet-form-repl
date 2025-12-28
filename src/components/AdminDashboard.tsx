
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Submission, EventStatus, ServerFile, FileWithData } from '../types';
import ViewIcon from './icons/ViewIcon';
import ZipIcon from './icons/ZipIcon';
import DocumentIcon from './icons/DocumentIcon';
import TrashIcon from './icons/TrashIcon';
import { getSubmissionWithFiles } from '../db';

// AdminDashboard components
interface AdminDashboardProps {
  submissions: Submission[];
  onStatusChange: (submissionId: string, newStatus: EventStatus) => void;
  onSaveNote: (submissionId: string, noteText: string) => void;
  onUploadDocuments: (submissionId: string, files: File[]) => void;
  onDeleteInternalDocument: (submissionId: string, fileIndex: number) => void;
  onAssignEmployee: (submissionId: string, employee: string) => void;
}

const EMPLOYEES = ['Zaměstnanec 1', 'Zaměstnanec 2', 'Zaměstnanec 3'];

const getStatusColor = (status: EventStatus) => {
  switch (status) {
    case EventStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case EventStatus.PROCESSING:
      return 'bg-red-100 text-red-800';
    case EventStatus.INVOICED:
      return 'bg-purple-100 text-purple-800';
    case EventStatus.COMPLETED:
      return 'bg-blue-100 text-blue-800';
    case EventStatus.REGISTERED:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ submissions, onStatusChange, onSaveNote, onUploadDocuments, onDeleteInternalDocument, onAssignEmployee }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isZipping, setIsZipping] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedSubmission) {
      const updatedSubmissionData = submissions.find(s => s.id === selectedSubmission.id);
      if (updatedSubmissionData) {
        setSelectedSubmission(updatedSubmissionData);
      } else {
        setSelectedSubmission(null);
      }
    }
  }, [submissions]);

  // Clear upload queue when switching submissions
  useEffect(() => {
    setFilesToUpload([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [selectedSubmission?.id]);

  const handleDownloadSingleFile = (file: FileWithData) => {
    let url: string;
    if (file instanceof File) {
      url = URL.createObjectURL(file);
    } else {
      // It's a ServerFile, create a data URL from base64
      url = `data:${file.mimeType};base64,${file.data}`;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (file instanceof File) {
      URL.revokeObjectURL(url);
    }
  };
  
  const handleDownloadZip = async (submissionId: string) => {
    setIsZipping(submissionId);
    try {
      const submission = await getSubmissionWithFiles(submissionId);
      if (!submission) {
        console.error("Submission not found for zipping");
        alert("Položka nebyla nalezena.");
        return;
      }

      const zip = new JSZip();
      
      const internalNotesContent = (submission.internalNotes && submission.internalNotes.length > 0)
        ? `
-------------------
Interní poznámky:
-------------------
${submission.internalNotes.map(n => `[${new Date(n.date).toLocaleString('cs-CZ')}] - ${n.text}`).join('\n')}
`
        : '';


      // Create a text file with submission details
      const detailsContent = `
Detail události: #${submission.id}
=================================

Základní informace:
-------------------
Stav: ${submission.status}
Vyřizuje: ${submission.assignedEmployee || 'Nepřiřazeno'}
Datum vložení: ${new Date(submission.submissionDate).toLocaleString('cs-CZ')}

-------------------
Kontaktní údaje:
-------------------
Kontaktní osoba: ${submission.contactPerson}
Firma: ${submission.company || 'Nezadáno'}
Adresa: ${`${submission.contactStreet}, ${submission.contactCity}, ${submission.contactZip}`}
Email: ${submission.email}
Telefon: ${submission.phone}

-------------------
Majitel traktoru:
-------------------
Jméno/Firma: ${submission.tractorOwnerName || 'Nezadáno'}
Adresa: ${submission.tractorOwnerStreet ? `${submission.tractorOwnerStreet}, ${submission.tractorOwnerCity}, ${submission.tractorOwnerZip}` : 'Nezadáno'}

-------------------
Fakturační údaje:
-------------------
Jméno/Firma: ${submission.billingName}
Fakturační adresa: ${`${submission.billingStreet}, ${submission.billingCity}, ${submission.billingZip}`}
IČO: ${submission.ico || 'Nezadáno'}
DIČ: ${submission.dic || 'Nezadáno'}
Papírová faktura: ${submission.wantsPaperInvoice ? 'Ano' : 'Ne'}

-------------------
Popis požadavku:
-------------------
${submission.requestDescription}
${internalNotesContent}
Historie stavů:
-------------------
${submission.statusHistory.map(h => `${h.status.padEnd(30)} ${new Date(h.date).toLocaleString('cs-CZ')}`).join('\n')}
      `.trim().replace(/^\s+/gm, ''); // Remove leading whitespace from each line

      zip.file('detail_udalosti.txt', detailsContent);

      const allFiles = [
        { folder: 'technicky_prukaz', files: submission.documents },
        { folder: 'osvedceni_o_registraci', files: submission.registrationCertificates },
        { folder: 'vyrobni_stitek', files: submission.vehiclePlatePhotos },
        { folder: 'doklad_o_montazi', files: submission.installationDocuments || [] },
        { folder: 'fotodokumentace_vozidla', files: submission.vehicleDocumentationPhotos || [] },
        { folder: 'interni_dokumenty', files: submission.internalDocuments || [] }
      ];

      for (const group of allFiles) {
        if (group.files.length > 0) {
          const folder = zip.folder(group.folder);
          for (const file of group.files) {
             if ('data' in file) { // ServerFile
                folder.file(file.name, file.data, { base64: true });
             }
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `udalost_${submissionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert("Chyba při vytváření ZIP archivu.");
    } finally {
      setIsZipping(null);
    }
  };

  const handleSaveNoteClick = () => {
    if (newNote.trim() && selectedSubmission) {
      onSaveNote(selectedSubmission.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
      
      // Reset input value directly on target to ensure change event fires again for same file
      e.target.value = '';
    }
  };
  
  const handleRemoveFileFromUpload = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    if (filesToUpload.length > 0 && selectedSubmission) {
      onUploadDocuments(selectedSubmission.id, filesToUpload);
      setFilesToUpload([]);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const term = searchTerm.toLowerCase();
    return (
      submission.id.toLowerCase().includes(term) ||
      submission.contactPerson.toLowerCase().includes(term) ||
      (submission.company && submission.company.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Přehled událostí</h2>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Hledat podle ID, jména nebo firmy..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red"
          aria-label="Filtrovat události"
        />
      </div>
      <div className="overflow-x-auto">
        {submissions.length === 0 ? (
          <p className="text-center text-brand-gray py-10">Zatím nebyly vloženy žádné události.</p>
        ) : filteredSubmissions.length === 0 ? (
          <p className="text-center text-brand-gray py-10">Nenalezeny žádné události odpovídající hledání.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {[...filteredSubmissions].reverse().map((submission) => {
              const eventId = submission.id;
              const isSelected = selectedSubmission?.id === submission.id;

              return (
                <React.Fragment key={submission.id}>
                  <li className="p-4 flex flex-col md:flex-row items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                    <div className="mb-4 md:mb-0 md:flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-lg text-gray-900">{`Událost #${eventId}`}</p>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        {submission.assignedEmployee && (
                           <span className="text-xs font-semibold text-gray-600 border border-gray-300 px-2 py-0.5 rounded-full ml-2">
                             {submission.assignedEmployee}
                           </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-gray">{submission.company || submission.contactPerson}</p>
                      <p className="text-sm text-brand-gray">Vloženo: {new Date(submission.submissionDate).toLocaleDateString('cs-CZ')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <select
                        value={submission.status}
                        onChange={(e) => onStatusChange(submission.id, e.target.value as EventStatus)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red"
                      >
                        {Object.values(EventStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setSelectedSubmission(isSelected ? null : submission)} 
                        title="Nahlédnout do události"
                        className="p-2 text-brand-gray hover:text-brand-red hover:bg-red-100 rounded-full transition-colors"
                      >
                        <ViewIcon />
                      </button>
                      <button 
                        onClick={() => handleDownloadZip(submission.id)}
                        title="Stáhnout jako ZIP" 
                        disabled={isZipping === submission.id}
                        className="p-2 text-brand-gray hover:text-brand-red hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                        {isZipping === submission.id ? (
                            <svg className="animate-spin h-6 w-6 text-brand-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : <ZipIcon />}
                      </button>
                    </div>
                  </li>
                  {isSelected && selectedSubmission && (
                    <li className="bg-gray-50 p-6 border-l-4 border-brand-red">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Detail události: {eventId}</h3>
                                <p className="mb-2"><strong>Stav:</strong> <span className={`px-2.5 py-0.5 text-sm font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>{selectedSubmission.status}</span></p>
                                <p><strong>Datum vložení:</strong> {new Date(selectedSubmission.submissionDate).toLocaleString('cs-CZ')}</p>
                             </div>
                             <div className="flex flex-col items-end">
                                <label htmlFor={`employee-select-${selectedSubmission.id}`} className="text-sm font-medium text-gray-700 mb-1">Vyřizuje:</label>
                                <select
                                    id={`employee-select-${selectedSubmission.id}`}
                                    value={selectedSubmission.assignedEmployee || ''}
                                    onChange={(e) => onAssignEmployee(selectedSubmission.id, e.target.value)}
                                    className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm rounded-md"
                                >
                                    <option value="">Nepřiřazeno</option>
                                    {EMPLOYEES.map((employee) => (
                                        <option key={employee} value={employee}>
                                            {employee}
                                        </option>
                                    ))}
                                </select>
                             </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-2">Kontaktní údaje</h3>
                            <p><strong>Kontaktní osoba:</strong> {selectedSubmission.contactPerson}</p>
                            <p><strong>Firma:</strong> {selectedSubmission.company || 'Nezadáno'}</p>
                            <p><strong>Adresa:</strong> {`${selectedSubmission.contactStreet}, ${selectedSubmission.contactCity}, ${selectedSubmission.contactZip}`}</p>
                            <p><strong>Email:</strong> {selectedSubmission.email}</p>
                            <p><strong>Telefon:</strong> {selectedSubmission.phone}</p>
                        </div>

                        {selectedSubmission.tractorOwnerName && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-2">Majitel traktoru</h3>
                            <p><strong>Jméno/Firma:</strong> {selectedSubmission.tractorOwnerName}</p>
                            <p><strong>Adresa:</strong> {`${selectedSubmission.tractorOwnerStreet}, ${selectedSubmission.tractorOwnerCity}, ${selectedSubmission.tractorOwnerZip}`}</p>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                             <h3 className="text-lg font-semibold mb-2">Fakturační údaje</h3>
                             <p><strong>Jméno/Firma:</strong> {selectedSubmission.billingName || 'Nezadáno'}</p>
                             <p><strong>Fakturační adresa:</strong> {`${selectedSubmission.billingStreet}, ${selectedSubmission.billingCity}, ${selectedSubmission.billingZip}`}</p>
                             <p><strong>IČO:</strong> {selectedSubmission.ico || 'Nezadáno'}</p>
                             <p><strong>DIČ:</strong> {selectedSubmission.dic || 'Nezadáno'}</p>
                             <p><strong>Papírová faktura:</strong> {selectedSubmission.wantsPaperInvoice ? 'Ano' : 'Ne'}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-2">Popis požadavku</h3>
                            <p className="whitespace-pre-wrap">{selectedSubmission.requestDescription}</p>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-2">Historie stavů</h3>
                            <ul className="space-y-2 mb-4 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                                {selectedSubmission.statusHistory.map((historyItem, index) => (
                                    <li key={index} className="border-b border-gray-200 pb-1">
                                        <p className="font-semibold text-gray-500">{new Date(historyItem.date).toLocaleString('cs-CZ')}</p>
                                        <p>{historyItem.status}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {[
                          { title: 'Technický průkaz', files: selectedSubmission.documents },
                          { title: 'Osvědčení o registraci vozidla', files: selectedSubmission.registrationCertificates },
                          { title: 'Fotka výrobního štítku vozidla', files: selectedSubmission.vehiclePlatePhotos },
                          { title: 'Doklad o montáži od autorizovaného servisu', files: selectedSubmission.installationDocuments || [] },
                          { title: 'Foto dokumentace vozidla', files: selectedSubmission.vehicleDocumentationPhotos || [] }
                        ].map((section, sectionIndex) => (
                           section.files.length > 0 && (
                            <div key={sectionIndex} className="mt-4 pt-4 border-t border-gray-200">
                              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                              <ul className="space-y-2">
                                {section.files.map((doc, index) => {
                                  const docIsFile = doc instanceof File;
                                  const docUrl = docIsFile ? URL.createObjectURL(doc) : `data:${(doc as ServerFile).mimeType};base64,${(doc as ServerFile).data}`;

                                  return (
                                    <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-white shadow-sm">
                                      <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Otevřít v novém okně"
                                        className="inline-flex items-center text-gray-700 hover:text-brand-red transition-colors"
                                      >
                                        <DocumentIcon />
                                        <span className="ml-2 truncate max-w-xs" title={doc.name}>{doc.name}</span>
                                      </a>
                                      <button
                                        onClick={() => handleDownloadSingleFile(doc)}
                                        title="Stáhnout soubor"
                                        className="ml-4 text-sm font-semibold text-brand-red hover:underline focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 rounded"
                                      >
                                        Stáhnout
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                           )
                        ))}
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-semibold mb-2">Interní dokumenty</h3>
                           {selectedSubmission.internalDocuments && selectedSubmission.internalDocuments.length > 0 && (
                             <ul className="space-y-2 mb-4">
                                {selectedSubmission.internalDocuments.map((doc, index) => (
                                    <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-white shadow-sm">
                                      <div className="inline-flex items-center text-gray-700">
                                        <DocumentIcon />
                                        <span className="ml-2 truncate max-w-xs" title={doc.name}>{doc.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleDownloadSingleFile(doc as ServerFile)}
                                            title="Stáhnout soubor"
                                            className="ml-4 text-sm font-semibold text-brand-red hover:underline focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 rounded"
                                          >
                                            Stáhnout
                                          </button>
                                          <button
                                            onClick={() => onDeleteInternalDocument(selectedSubmission.id, index)}
                                            title="Smazat soubor"
                                            className="ml-2 p-1 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                          >
                                            <TrashIcon />
                                          </button>
                                      </div>
                                    </li>
                                ))}
                             </ul>
                           )}
                           
                           {/* Files pending upload queue */}
                           {filesToUpload.length > 0 && (
                             <div className="mb-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                               <p className="text-sm font-medium text-yellow-800 mb-2">Soubory připravené k nahrání:</p>
                               <ul className="space-y-1">
                                 {filesToUpload.map((file, index) => (
                                   <li key={index} className="flex justify-between items-center text-sm text-gray-700">
                                     <span className="truncate">{file.name} ({Math.round(file.size / 1024)} kB)</span>
                                     <button 
                                       onClick={() => handleRemoveFileFromUpload(index)}
                                       className="text-red-600 hover:text-red-800 font-bold ml-2 px-2"
                                       title="Odebrat ze seznamu"
                                     >
                                       ×
                                     </button>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}

                          <div>
                             <input
                                  type="file"
                                  id={`internal-docs-upload-${selectedSubmission.id}`}
                                  ref={fileInputRef}
                                  multiple
                                  accept=".pdf,.jpg,.jpeg"
                                  onChange={handleFileChange}
                                  className="hidden"
                              />
                              <div className="flex items-center gap-3">
                                <label 
                                    htmlFor={`internal-docs-upload-${selectedSubmission.id}`}
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Vybrat soubory
                                </label>

                                <button
                                    onClick={handleUploadClick}
                                    disabled={filesToUpload.length === 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Nahrát {filesToUpload.length > 0 && `(${filesToUpload.length})`}
                                </button>
                              </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-semibold mb-2">Interní poznámky</h3>
                          {selectedSubmission.internalNotes && selectedSubmission.internalNotes.length > 0 && (
                            <ul className="space-y-2 mb-4 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                              {selectedSubmission.internalNotes.map((note, index) => (
                                <li key={index} className="border-b border-gray-200 pb-1">
                                  <p className="font-semibold text-gray-500">{new Date(note.date).toLocaleString('cs-CZ')}</p>
                                  <p className="whitespace-pre-wrap">{note.text}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Zde napište novou poznámku..."
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red"
                          />
                          <button
                            onClick={handleSaveNoteClick}
                            className="mt-2 px-4 py-2 bg-brand-red text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                            disabled={!newNote.trim()}
                          >
                            Uložit poznámku
                          </button>
                        </div>

                      </div>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
