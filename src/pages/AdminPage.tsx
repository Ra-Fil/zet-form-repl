
import React, { useState, useEffect } from 'react';
import { Submission, EventStatus } from '../types';
import Header from '../components/Header';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import { getSubmissions, updateSubmissionStatus, addInternalNote, addInternalDocuments, assignEmployeeToSubmission, deleteInternalDocument } from '../db';
import Footer from '../components/Footer';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem('isAdminAuthenticated') === 'true'
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);
      setError(null);
      try {
        const subs = await getSubmissions();
        setSubmissions(subs);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Nepodařilo se načíst data. Zkuste to prosím znovu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    setIsAuthenticated(true);
  };
  
  const handleStatusChange = async (submissionId: string, newStatus: EventStatus) => {
    try {
      const updatedSubmission = await updateSubmissionStatus(submissionId, newStatus);
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => 
          sub.id === submissionId ? { ...sub, ...updatedSubmission } : sub
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Chyba při aktualizaci stavu.");
    }
  };

  const handleSaveNote = async (submissionId: string, noteText: string) => {
    try {
        const updatedSubmission = await addInternalNote(submissionId, noteText);
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...updatedSubmission } : s));
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Chyba při ukládání poznámky.");
    }
  };

  const handleUploadDocuments = async (submissionId: string, files: File[]) => {
    try {
        const updatedSubmission = await addInternalDocuments(submissionId, files);
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...updatedSubmission } : s));
    } catch (error) {
        console.error("Error uploading documents:", error);
        alert("Chyba při nahrávání dokumentů.");
    }
  };

  const handleDeleteInternalDocument = async (submissionId: string, fileIndex: number) => {
    if (!window.confirm('Opravdu chcete smazat tento soubor?')) {
      return;
    }
    try {
      const updatedSubmission = await deleteInternalDocument(submissionId, fileIndex);
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...updatedSubmission } : s));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Chyba při mazání dokumentu.");
    }
  };

  const handleEmployeeAssignment = async (submissionId: string, employee: string) => {
    try {
        const updatedSubmission = await assignEmployeeToSubmission(submissionId, employee);
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...updatedSubmission } : s));
    } catch (error) {
        console.error("Error assigning employee:", error);
        alert("Chyba při přiřazování zaměstnance.");
    }
  };


  const renderContent = () => {
    if (!isAuthenticated) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }
    if (isLoading) {
      return <div className="text-center p-10">Načítání dat...</div>;
    }
    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }
    return <AdminDashboard 
              submissions={submissions} 
              onStatusChange={handleStatusChange} 
              onSaveNote={handleSaveNote}
              onUploadDocuments={handleUploadDocuments}
              onDeleteInternalDocument={handleDeleteInternalDocument}
              onAssignEmployee={handleEmployeeAssignment}
            />;
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
