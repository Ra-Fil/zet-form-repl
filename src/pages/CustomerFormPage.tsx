
import React from 'react';
import { Submission } from '../types';
import Header from '../components/Header';
import CustomerForm from '../components/CustomerForm';
import { addSubmission as dbAddSubmission } from '../db';
import Footer from '../components/Footer';

const CustomerFormPage: React.FC = () => {

  const addSubmission = async (submissionData: Omit<Submission, 'id' | 'submissionDate' | 'status' | 'statusHistory'>) => {
    await dbAddSubmission(submissionData);
  };
  
  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <CustomerForm onSubmit={addSubmission} />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerFormPage;
