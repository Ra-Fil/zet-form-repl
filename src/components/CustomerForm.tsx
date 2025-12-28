
import React, { useState, useRef, useEffect } from 'react';
import { Submission } from '../types';
import Modal from './Modal';

interface CustomerFormProps {
  onSubmit: (submission: Omit<Submission, 'id' | 'submissionDate' | 'status' | 'statusHistory'>) => Promise<void>;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit }) => {
  const [contactPerson, setContactPerson] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactStreet, setContactStreet] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactZip, setContactZip] = useState('');
  
  const [tractorOwnerName, setTractorOwnerName] = useState('');
  const [tractorOwnerStreet, setTractorOwnerStreet] = useState('');
  const [tractorOwnerCity, setTractorOwnerCity] = useState('');
  const [tractorOwnerZip, setTractorOwnerZip] = useState('');
  
  const [billingName, setBillingName] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [ico, setIco] = useState('');
  const [dic, setDic] = useState('');
  const [wantsPaperInvoice, setWantsPaperInvoice] = useState(false);

  const [requestDescription, setRequestDescription] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [registrationCertificates, setRegistrationCertificates] = useState<File[]>([]);
  const [vehiclePlatePhotos, setVehiclePlatePhotos] = useState<File[]>([]);
  const [installationDocuments, setInstallationDocuments] = useState<File[]>([]);
  const [vehicleDocumentationPhotos, setVehicleDocumentationPhotos] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSameAsContact, setIsSameAsContact] = useState(false);
  const [isOwnerSameAsBilling, setIsOwnerSameAsBilling] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // Refs for scrolling
  const formContainerRef = useRef<HTMLDivElement>(null);
  const contactPersonRef = useRef<HTMLInputElement>(null);
  const contactStreetRef = useRef<HTMLInputElement>(null);
  const contactCityRef = useRef<HTMLInputElement>(null);
  const contactZipRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const billingNameRef = useRef<HTMLInputElement>(null);
  const billingStreetRef = useRef<HTMLInputElement>(null);
  const billingCityRef = useRef<HTMLInputElement>(null);
  const billingZipRef = useRef<HTMLInputElement>(null);
  const requestDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const documentsRef = useRef<HTMLDivElement>(null);
  const registrationCertificatesRef = useRef<HTMLDivElement>(null);
  const vehiclePlatePhotosRef = useRef<HTMLDivElement>(null);
  const vehicleDocumentationPhotosRef = useRef<HTMLDivElement>(null);
  const consentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOwnerSameAsBilling && !isSameAsContact) {
      handleFieldChange(setBillingName, 'billingName')(tractorOwnerName);
      handleFieldChange(setBillingStreet, 'billingStreet')(tractorOwnerStreet);
      handleFieldChange(setBillingCity, 'billingCity')(tractorOwnerCity);
      handleFieldChange(setBillingZip, 'billingZip')(tractorOwnerZip);
    }
  }, [tractorOwnerName, tractorOwnerStreet, tractorOwnerCity, tractorOwnerZip, isOwnerSameAsBilling, isSameAsContact]);

  const handleFieldChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    fieldName: string
  ) => (value: T) => {
      setter(value);
      if (errors[fieldName]) {
          setErrors(prev => {
              const next = { ...prev };
              delete next[fieldName];
              return next;
          });
      }
  };

  const handleSameAsContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsSameAsContact(isChecked);

    if (isChecked) {
      // Kopírování údajů z kontaktních údajů
      const ownerName = company || contactPerson;
      setTractorOwnerName(ownerName);
      setTractorOwnerStreet(contactStreet);
      setTractorOwnerCity(contactCity);
      setTractorOwnerZip(contactZip);
      
      handleFieldChange(setBillingName, 'billingName')(ownerName);
      handleFieldChange(setBillingStreet, 'billingStreet')(contactStreet);
      handleFieldChange(setBillingCity, 'billingCity')(contactCity);
      handleFieldChange(setBillingZip, 'billingZip')(contactZip);
      setIsOwnerSameAsBilling(true);
    } else {
      // Vymazání údajů
      setTractorOwnerName('');
      setTractorOwnerStreet('');
      setTractorOwnerCity('');
      setTractorOwnerZip('');

      handleFieldChange(setBillingName, 'billingName')('');
      handleFieldChange(setBillingStreet, 'billingStreet')('');
      handleFieldChange(setBillingCity, 'billingCity')('');
      handleFieldChange(setBillingZip, 'billingZip')('');
      setIsOwnerSameAsBilling(false);
    }
  };

  const handleOwnerSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsOwnerSameAsBilling(isChecked);

    if (!isChecked) {
        handleFieldChange(setBillingName, 'billingName')('');
        handleFieldChange(setBillingStreet, 'billingStreet')('');
        handleFieldChange(setBillingCity, 'billingCity')('');
        handleFieldChange(setBillingZip, 'billingZip')('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFiles: React.Dispatch<React.SetStateAction<File[]>>, fieldName: string) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      newFiles.forEach((file: File) => {
        if (file.type === 'image/jpeg' || file.type === 'application/pdf') {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (invalidFiles.length > 0) {
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Chybný formát souboru',
          message: `Následující soubory mají nesprávný formát a nebyly nahrány: ${invalidFiles.join(', ')}. Přijímáme pouze JPG a PDF.`
        });
      }

      if(validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        if (errors[fieldName]) {
          setErrors(prev => {
              const next = { ...prev };
              delete next[fieldName];
              return next;
          });
        }
      }

      e.target.value = '';
    }
  };
  
  const handleRemoveFile = (indexToRemove: number, setFiles: React.Dispatch<React.SetStateAction<File[]>>) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFieldChange(setRequestDescription, 'requestDescription')(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const resetForm = () => {
    setContactPerson('');
    setCompany('');
    setEmail('');
    setPhone('');
    setContactStreet('');
    setContactCity('');
    setContactZip('');
    
    setTractorOwnerName('');
    setTractorOwnerStreet('');
    setTractorOwnerCity('');
    setTractorOwnerZip('');
    
    setBillingName('');
    setBillingStreet('');
    setBillingCity('');
    setBillingZip('');
    setIco('');
    setDic('');
    setWantsPaperInvoice(false);
    setIsSameAsContact(false);
    setIsOwnerSameAsBilling(false);

    setRequestDescription('');
    if (requestDescriptionRef.current) {
        requestDescriptionRef.current.style.height = 'auto';
    }
    setDocuments([]);
    setRegistrationCertificates([]);
    setVehiclePlatePhotos([]);
    setInstallationDocuments([]);
    setVehicleDocumentationPhotos([]);
    setConsent(false);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalState(null);
    
    const newErrors: Record<string, boolean> = {};
    let firstErrorRef: React.RefObject<HTMLElement> | null = null;
    
    const fieldsToValidate = [
      { condition: !contactPerson, name: 'contactPerson', ref: contactPersonRef },
      { condition: !contactStreet, name: 'contactStreet', ref: contactStreetRef },
      { condition: !contactCity, name: 'contactCity', ref: contactCityRef },
      { condition: !contactZip, name: 'contactZip', ref: contactZipRef },
      { condition: !email, name: 'email', ref: emailRef },
      { condition: !phone, name: 'phone', ref: phoneRef },
      { condition: !billingName, name: 'billingName', ref: billingNameRef },
      { condition: !billingStreet, name: 'billingStreet', ref: billingStreetRef },
      { condition: !billingCity, name: 'billingCity', ref: billingCityRef },
      { condition: !billingZip, name: 'billingZip', ref: billingZipRef },
      { condition: !requestDescription, name: 'requestDescription', ref: requestDescriptionRef },
      { condition: documents.length === 0, name: 'documents', ref: documentsRef },
      { condition: registrationCertificates.length === 0, name: 'registrationCertificates', ref: registrationCertificatesRef },
      { condition: vehiclePlatePhotos.length === 0, name: 'vehiclePlatePhotos', ref: vehiclePlatePhotosRef },
      { condition: vehicleDocumentationPhotos.length < 3, name: 'vehicleDocumentationPhotos', ref: vehicleDocumentationPhotosRef },
      { condition: !consent, name: 'consent', ref: consentRef },
    ];

    fieldsToValidate.forEach(field => {
      if (field.condition) {
        newErrors[field.name] = true;
        if (!firstErrorRef) {
          firstErrorRef = field.ref as React.RefObject<HTMLElement>;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      let message = 'Prosím, vyplňte všechna povinná pole označená hvězdičkou (*) a nahrajte požadované dokumenty.';
      if (newErrors.vehicleDocumentationPhotos && vehicleDocumentationPhotos.length < 3) {
          message = 'Do pole "Fotodokumentace vozidla" je nutné nahrát alespoň 3 soubory.'
      }
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Chyba ve formuláři',
        message: message,
      });
      if (firstErrorRef && firstErrorRef.current) {
        firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in firstErrorRef.current) {
          (firstErrorRef.current as HTMLElement).focus({ preventScroll: true });
        }
      }
      return;
    }

    try {
      await onSubmit({ 
        contactPerson, company, email, phone, contactStreet, contactCity, contactZip, 
        billingName, billingStreet, billingCity, billingZip,
        tractorOwnerName, tractorOwnerStreet, tractorOwnerCity, tractorOwnerZip, 
        ico, dic, wantsPaperInvoice, 
        requestDescription, documents, registrationCertificates, vehiclePlatePhotos, installationDocuments,
        vehicleDocumentationPhotos
      });
      
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      setModalState({
          isOpen: true,
          type: 'success',
          title: 'Odeslání úspěšné',
          message: 'Vaše údaje byly úspěšně odeslány. Děkujeme.'
      });
    } catch (error) {
      console.error('Submission failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Při ukládání formuláře došlo k neočekávané chybě. Zkuste prosím nahrát menší soubory.';
      
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Chyba při odesílání',
        message: errorMessage,
      });
    }
  };

  const handleCloseModal = () => {
    if (modalState?.type === 'success') {
      resetForm();
    }
    setModalState(null);
  };

  return (
    <>
      {modalState?.isOpen && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
      )}
      <div ref={formContainerRef} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Formulář pro zadání údajů</h2>
        <p className="text-center text-sm text-brand-gray mb-8">Pole označená <span className="text-brand-red font-bold">*</span> jsou povinná.</p>

        <form onSubmit={handleSubmit} className="space-y-10" noValidate>
          <section>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Kontaktní údaje</h3>
              <div className="mt-2 w-16 h-0.5 bg-brand-red"></div>
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Kontaktní osoba <span className="text-brand-red">*</span></label>
                <input ref={contactPersonRef} type="text" id="contactPerson" value={contactPerson} onChange={(e) => handleFieldChange(setContactPerson, 'contactPerson')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.contactPerson ? 'border-brand-red' : 'border-gray-300'}`} required />
              </div>
              <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">Firma</label>
                  <input type="text" id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
              </div>
              <div>
                  <label htmlFor="contactStreet" className="block text-sm font-medium text-gray-700">Ulice a číslo popisné <span className="text-brand-red">*</span></label>
                  <input ref={contactStreetRef} type="text" id="contactStreet" value={contactStreet} onChange={(e) => handleFieldChange(setContactStreet, 'contactStreet')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.contactStreet ? 'border-brand-red' : 'border-gray-300'}`} required />
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="contactCity" className="block text-sm font-medium text-gray-700">Město <span className="text-brand-red">*</span></label>
                      <input ref={contactCityRef} type="text" id="contactCity" value={contactCity} onChange={(e) => handleFieldChange(setContactCity, 'contactCity')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.contactCity ? 'border-brand-red' : 'border-gray-300'}`} required />
                  </div>
                  <div>
                      <label htmlFor="contactZip" className="block text-sm font-medium text-gray-700">PSČ <span className="text-brand-red">*</span></label>
                      <input ref={contactZipRef} type="text" id="contactZip" value={contactZip} onChange={(e) => handleFieldChange(setContactZip, 'contactZip')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.contactZip ? 'border-brand-red' : 'border-gray-300'}`} required />
                  </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-brand-red">*</span></label>
                <input ref={emailRef} type="email" id="email" value={email} onChange={(e) => handleFieldChange(setEmail, 'email')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.email ? 'border-brand-red' : 'border-gray-300'}`} required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon <span className="text-brand-red">*</span></label>
                <input ref={phoneRef} type="tel" id="phone" value={phone} onChange={(e) => handleFieldChange(setPhone, 'phone')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.phone ? 'border-brand-red' : 'border-gray-300'}`} required />
              </div>
            </div>
          </section>

          <div className="flex items-center pt-4 border-t border-gray-200">
            <input
              id="sameAsContact"
              name="sameAsContact"
              type="checkbox"
              checked={isSameAsContact}
              onChange={handleSameAsContactChange}
              className="h-4 w-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
            />
            <label htmlFor="sameAsContact" className="ml-2 block text-sm font-bold text-gray-900">
              Kontaktní údaje, majitel a fakturační údaje jsou stejné
            </label>
          </div>

          <section>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Majitel traktoru</h3>
              <div className="mt-2 w-16 h-0.5 bg-brand-red"></div>
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="tractorOwnerName" className="block text-sm font-medium text-gray-700">Jméno/Firma</label>
                <input type="text" id="tractorOwnerName" value={tractorOwnerName} onChange={(e) => setTractorOwnerName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
              </div>
              <div>
                  <label htmlFor="tractorOwnerStreet" className="block text-sm font-medium text-gray-700">Ulice a číslo popisné</label>
                  <input type="text" id="tractorOwnerStreet" value={tractorOwnerStreet} onChange={(e) => setTractorOwnerStreet(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="tractorOwnerCity" className="block text-sm font-medium text-gray-700">Město</label>
                      <input type="text" id="tractorOwnerCity" value={tractorOwnerCity} onChange={(e) => setTractorOwnerCity(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
                  </div>
                  <div>
                      <label htmlFor="tractorOwnerZip" className="block text-sm font-medium text-gray-700">PSČ</label>
                      <input type="text" id="tractorOwnerZip" value={tractorOwnerZip} onChange={(e) => setTractorOwnerZip(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
                  </div>
              </div>
            </div>
            <div className="flex items-center mt-6">
                <input
                  id="ownerSameAsBilling"
                  name="ownerSameAsBilling"
                  type="checkbox"
                  checked={isOwnerSameAsBilling}
                  onChange={handleOwnerSameAsBillingChange}
                  disabled={isSameAsContact}
                  className="h-4 w-4 text-brand-red border-gray-300 rounded focus:ring-brand-red disabled:opacity-50"
                />
                <label htmlFor="ownerSameAsBilling" className="ml-2 block text-sm font-bold text-gray-900">
                  Majitel a fakturační údaje jsou stejné
                </label>
            </div>
          </section>
          
          <section>
              <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Fakturační údaje</h3>
                  <div className="mt-2 w-16 h-0.5 bg-brand-red"></div>
              </div>
              <div className="space-y-6">
                  <div>
                      <label htmlFor="billingName" className="block text-sm font-medium text-gray-700">Jméno/Firma <span className="text-brand-red">*</span></label>
                      <input ref={billingNameRef} type="text" id="billingName" value={billingName} onChange={(e) => handleFieldChange(setBillingName, 'billingName')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.billingName ? 'border-brand-red' : 'border-gray-300'}`} required />
                  </div>
                  <div>
                      <label htmlFor="billingStreet" className="block text-sm font-medium text-gray-700">Ulice a číslo popisné <span className="text-brand-red">*</span></label>
                      <input ref={billingStreetRef} type="text" id="billingStreet" value={billingStreet} onChange={(e) => handleFieldChange(setBillingStreet, 'billingStreet')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.billingStreet ? 'border-brand-red' : 'border-gray-300'}`} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700">Město <span className="text-brand-red">*</span></label>
                          <input ref={billingCityRef} type="text" id="billingCity" value={billingCity} onChange={(e) => handleFieldChange(setBillingCity, 'billingCity')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.billingCity ? 'border-brand-red' : 'border-gray-300'}`} required />
                      </div>
                      <div>
                          <label htmlFor="billingZip" className="block text-sm font-medium text-gray-700">PSČ <span className="text-brand-red">*</span></label>
                          <input ref={billingZipRef} type="text" id="billingZip" value={billingZip} onChange={(e) => handleFieldChange(setBillingZip, 'billingZip')(e.target.value)} className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red ${errors.billingZip ? 'border-brand-red' : 'border-gray-300'}`} required />
                      </div>
                  </div>
                   <div>
                      <label htmlFor="ico" className="block text-sm font-medium text-gray-700">IČO</label>
                      <input type="text" id="ico" value={ico} onChange={(e) => setIco(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
                  </div>
                  <div>
                      <label htmlFor="dic" className="block text-sm font-medium text-gray-700">DIČ</label>
                      <input type="text" id="dic" value={dic} onChange={(e) => setDic(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red" />
                  </div>
                  <div className="flex items-center">
                      <input
                          id="wantsPaperInvoice"
                          name="wantsPaperInvoice"
                          type="checkbox"
                          checked={wantsPaperInvoice}
                          onChange={(e) => setWantsPaperInvoice(e.target.checked)}
                          className="h-4 w-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                      />
                      <label htmlFor="wantsPaperInvoice" className="ml-2 block text-sm text-gray-900">
                          Chci papírovou fakturu
                      </label>
                  </div>
              </div>
          </section>

          <section>
              <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Popis požadavku</h3>
                  <div className="mt-2 w-16 h-0.5 bg-brand-red"></div>
              </div>
              <div>
                  <label htmlFor="requestDescription" className="block text-sm font-medium text-gray-700">Váš požadavek <span className="text-brand-red">*</span></label>
                  <textarea
                      id="requestDescription"
                      ref={requestDescriptionRef}
                      rows={3}
                      value={requestDescription}
                      onChange={handleDescriptionChange}
                      className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-red focus:border-brand-red overflow-y-hidden ${errors.requestDescription ? 'border-brand-red' : 'border-gray-300'}`}
                      placeholder="Popište prosím co nejpodrobněji Váš požadavek..."
                      required
                  />
              </div>
          </section>

          <section>
              <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Přílohy</h3>
                  <div className="mt-2 w-16 h-0.5 bg-brand-red"></div>
              </div>
              <div className="space-y-6">
                  <div ref={documentsRef}>
                      <label className="block text-sm font-medium text-gray-700">Kopie technického průkazu (JPG, PDF) <span className="text-brand-red">*</span></label>
                      <div className={`mt-1 p-6 border-2 border-dashed rounded-md ${errors.documents ? 'border-brand-red' : 'border-gray-300'}`}>
                          {documents.length > 0 && (
                              <div className="mb-4">
                                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                      {documents.map((file, index) => (
                                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                              <div className="w-0 flex-1 flex items-center">
                                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="ml-2 flex-1 w-0">
                                                     <p className="truncate text-gray-900" title={file.name}>{file.name}</p>
                                                     <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                  </div>
                                              </div>
                                              <div className="ml-4 flex-shrink-0">
                                                  <button type="button" onClick={() => handleRemoveFile(index, setDocuments)} className="font-medium text-brand-red hover:text-red-700">
                                                      Odebrat
                                                  </button>
                                              </div>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}

                          {documents.length === 0 ? (
                              <div className="space-y-1 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="flex text-sm text-gray-600 justify-center">
                                      <label htmlFor="document-upload" className="relative cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red">
                                          <span>Nahrát soubory</span>
                                          <input id="document-upload" name="document-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setDocuments, 'documents')} accept=".jpg,.jpeg,.pdf" multiple />
                                      </label>
                                      <p className="pl-1">nebo přetáhněte</p>
                                  </div>
                                  <p className="text-xs text-gray-500">JPG nebo PDF</p>
                              </div>
                          ) : (
                              <div className="text-center">
                                  <label htmlFor="document-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                      <span>Přidat další soubory</span>
                                      <input id="document-upload" name="document-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setDocuments, 'documents')} accept=".jpg,.jpeg,.pdf" multiple />
                                  </label>
                              </div>
                          )}
                      </div>
                  </div>
                  <div ref={registrationCertificatesRef}>
                    <label className="block text-sm font-medium text-gray-700">Osvědčení o registraci vozidla (JPG, PDF) <span className="text-brand-red">*</span></label>
                    <div className={`mt-1 p-6 border-2 border-dashed rounded-md ${errors.registrationCertificates ? 'border-brand-red' : 'border-gray-300'}`}>
                          {registrationCertificates.length > 0 && (
                              <div className="mb-4">
                                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                      {registrationCertificates.map((file, index) => (
                                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                              <div className="w-0 flex-1 flex items-center">
                                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="ml-2 flex-1 w-0">
                                                     <p className="truncate text-gray-900" title={file.name}>{file.name}</p>
                                                     <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                  </div>
                                              </div>
                                              <div className="ml-4 flex-shrink-0">
                                                  <button type="button" onClick={() => handleRemoveFile(index, setRegistrationCertificates)} className="font-medium text-brand-red hover:text-red-700">
                                                      Odebrat
                                                  </button>
                                              </div>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {registrationCertificates.length === 0 ? (
                              <div className="space-y-1 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="flex text-sm text-gray-600 justify-center">
                                      <label htmlFor="registration-certificate-upload" className="relative cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red">
                                          <span>Nahrát soubory</span>
                                          <input id="registration-certificate-upload" name="registration-certificate-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setRegistrationCertificates, 'registrationCertificates')} accept=".jpg,.jpeg,.pdf" multiple />
                                      </label>
                                      <p className="pl-1">nebo přetáhněte</p>
                                  </div>
                                  <p className="text-xs text-gray-500">JPG nebo PDF</p>
                              </div>
                          ) : (
                               <div className="text-center">
                                  <label htmlFor="registration-certificate-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                      <span>Přidat další soubory</span>
                                      <input id="registration-certificate-upload" name="registration-certificate-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setRegistrationCertificates, 'registrationCertificates')} accept=".jpg,.jpeg,.pdf" multiple />
                                  </label>
                              </div>
                          )}
                    </div>
                  </div>
                  <div ref={vehiclePlatePhotosRef}>
                    <label className="block text-sm font-medium text-gray-700">Fotka výrobního štítku vozidla (JPG, PDF) <span className="text-brand-red">*</span></label>
                    <div className={`mt-1 p-6 border-2 border-dashed rounded-md ${errors.vehiclePlatePhotos ? 'border-brand-red' : 'border-gray-300'}`}>
                        {vehiclePlatePhotos.length > 0 && (
                              <div className="mb-4">
                                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                      {vehiclePlatePhotos.map((file, index) => (
                                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                              <div className="w-0 flex-1 flex items-center">
                                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="ml-2 flex-1 w-0">
                                                     <p className="truncate text-gray-900" title={file.name}>{file.name}</p>
                                                     <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                  </div>
                                              </div>
                                              <div className="ml-4 flex-shrink-0">
                                                  <button type="button" onClick={() => handleRemoveFile(index, setVehiclePlatePhotos)} className="font-medium text-brand-red hover:text-red-700">
                                                      Odebrat
                                                  </button>
                                              </div>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {vehiclePlatePhotos.length === 0 ? (
                              <div className="space-y-1 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="flex text-sm text-gray-600 justify-center">
                                      <label htmlFor="vehicle-plate-photo-upload" className="relative cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red">
                                          <span>Nahrát soubory</span>
                                          <input id="vehicle-plate-photo-upload" name="vehicle-plate-photo-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVehiclePlatePhotos, 'vehiclePlatePhotos')} accept=".jpg,.jpeg,.pdf" multiple />
                                      </label>
                                      <p className="pl-1">nebo přetáhněte</p>
                                  </div>
                                  <p className="text-xs text-gray-500">JPG nebo PDF</p>
                              </div>
                          ) : (
                              <div className="text-center">
                                  <label htmlFor="vehicle-plate-photo-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                      <span>Přidat další soubory</span>
                                      <input id="vehicle-plate-photo-upload" name="vehicle-plate-photo-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVehiclePlatePhotos, 'vehiclePlatePhotos')} accept=".jpg,.jpeg,.pdf" multiple />
                                  </label>
                              </div>
                          )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doklad o montáži od autorizovaného servisu (JPG, PDF)</label>
                    <div className="mt-1 p-6 border-2 border-gray-300 border-dashed rounded-md">
                        {installationDocuments.length > 0 && (
                              <div className="mb-4">
                                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                      {installationDocuments.map((file, index) => (
                                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                              <div className="w-0 flex-1 flex items-center">
                                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="ml-2 flex-1 w-0">
                                                     <p className="truncate text-gray-900" title={file.name}>{file.name}</p>
                                                     <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                  </div>
                                              </div>
                                              <div className="ml-4 flex-shrink-0">
                                                  <button type="button" onClick={() => handleRemoveFile(index, setInstallationDocuments)} className="font-medium text-brand-red hover:text-red-700">
                                                      Odebrat
                                                  </button>
                                              </div>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {installationDocuments.length === 0 ? (
                              <div className="space-y-1 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <div className="flex text-sm text-gray-600 justify-center">
                                      <label htmlFor="installation-document-upload" className="relative cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red">
                                          <span>Nahrát soubory</span>
                                          <input id="installation-document-upload" name="installation-document-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setInstallationDocuments, 'installationDocuments')} accept=".jpg,.jpeg,.pdf" multiple />
                                      </label>
                                      <p className="pl-1">nebo přetáhněte</p>
                                  </div>
                                  <p className="text-xs text-gray-500">JPG nebo PDF</p>
                              </div>
                          ) : (
                              <div className="text-center">
                                  <label htmlFor="installation-document-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                      <span>Přidat další soubory</span>
                                      <input id="installation-document-upload" name="installation-document-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setInstallationDocuments, 'installationDocuments')} accept=".jpg,.jpeg,.pdf" multiple />
                                  </label>
                              </div>
                          )}
                    </div>
                  </div>
                  <div ref={vehicleDocumentationPhotosRef}>
                    <label className="block text-sm font-medium text-gray-700">Fotodokumentace vozidla <span className="text-xs font-normal">(minimálně 3 soubory)</span> <span className="text-brand-red">*</span></label>
                    <div className={`mt-1 p-6 border-2 border-dashed rounded-md ${errors.vehicleDocumentationPhotos ? 'border-brand-red' : 'border-gray-300'}`}>
                        {vehicleDocumentationPhotos.length > 0 && (
                              <div className="mb-4">
                                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                      {vehicleDocumentationPhotos.map((file, index) => (
                                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                              <div className="w-0 flex-1 flex items-center">
                                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="ml-2 flex-1 w-0">
                                                     <p className="truncate text-gray-900" title={file.name}>{file.name}</p>
                                                     <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                  </div>
                                              </div>
                                              <div className="ml-4 flex-shrink-0">
                                                  <button type="button" onClick={() => handleRemoveFile(index, setVehicleDocumentationPhotos)} className="font-medium text-brand-red hover:text-red-700">
                                                      Odebrat
                                                  </button>
                                              </div>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          {vehicleDocumentationPhotos.length < 3 && (
                            <>
                              {vehicleDocumentationPhotos.length === 0 ? (
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label htmlFor="vehicle-documentation-upload" className="relative cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red">
                                            <span>Nahrát soubory</span>
                                            <input id="vehicle-documentation-upload" name="vehicle-documentation-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVehicleDocumentationPhotos, 'vehicleDocumentationPhotos')} accept=".jpg,.jpeg,.pdf" multiple />
                                        </label>
                                        <p className="pl-1">nebo přetáhněte</p>
                                    </div>
                                    <p className="text-xs text-gray-500">JPG nebo PDF</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                    <label htmlFor="vehicle-documentation-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                        <span>Přidat další soubory ({vehicleDocumentationPhotos.length}/3)</span>
                                        <input id="vehicle-documentation-upload" name="vehicle-documentation-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVehicleDocumentationPhotos, 'vehicleDocumentationPhotos')} accept=".jpg,.jpeg,.pdf" multiple />
                                    </label>
                                </div>
                              )}
                            </>
                          )}
                          {vehicleDocumentationPhotos.length >= 3 && (
                              <div className="text-center">
                                  <label htmlFor="vehicle-documentation-upload" className="cursor-pointer bg-white font-medium text-brand-red hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-red p-2 rounded-md">
                                      <span>Přidat další soubory</span>
                                      <input id="vehicle-documentation-upload" name="vehicle-documentation-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, setVehicleDocumentationPhotos, 'vehicleDocumentationPhotos')} accept=".jpg,.jpeg,.pdf" multiple />
                                  </label>
                              </div>
                          )}
                    </div>
                  </div>
              </div>
          </section>
          <div ref={consentRef} className="pt-6 border-t border-gray-200">
            <div className="flex items-center">
                <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => handleFieldChange(setConsent, 'consent')(e.target.checked)}
                    className={`h-4 w-4 text-brand-red border-gray-300 rounded focus:ring-brand-red ${errors.consent ? 'ring-1 ring-brand-red' : ''}`}
                    required
                />
                <label htmlFor="consent" className={`ml-2 block text-sm ${errors.consent ? 'text-brand-red font-semibold' : 'text-gray-900'}`}>
                    Souhlasím se zpracováním osobních údajů <span className="text-brand-red">*</span>
                </label>
            </div>
          </div>
          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent shadow-sm text-lg font-bold text-white bg-brand-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition-colors duration-300">
            Odeslat
          </button>
        </form>
      </div>
    </>
  );
};

export default CustomerForm;
