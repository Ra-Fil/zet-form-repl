
export enum EventStatus {
  PENDING = 'Nový požadavek',
  PROCESSING = 'Vygenerováno prohlášení',
  INVOICED = 'Faktura odeslána',
  COMPLETED = 'Faktura zaplacena',
  REGISTERED = 'Prohlášení zapsáno do IZTP',
}

export interface StatusChange {
  status: EventStatus;
  date: Date;
}

export interface InternalNote {
    text: string;
    date: Date;
}

export interface ServerFile {
  name: string;
  data: string;
  mimeType: string;
}

export type FileWithData = File | ServerFile;

export interface Submission {
  id: string;
  contactPerson: string;
  company?: string;
  email: string;
  phone: string;
  contactStreet: string;
  contactCity: string;
  contactZip: string;
  billingName: string;
  billingStreet: string;
  billingCity: string;
  billingZip: string;
  ico?: string;
  dic?: string;
  wantsPaperInvoice: boolean;
  requestDescription: string;
  documents: FileWithData[];
  registrationCertificates: FileWithData[];
  vehiclePlatePhotos: FileWithData[];
  installationDocuments?: FileWithData[];
  vehicleDocumentationPhotos: FileWithData[];
  submissionDate: Date;
  status: EventStatus;
  statusHistory: StatusChange[];
  tractorOwnerName?: string;
  tractorOwnerStreet?: string;
  tractorOwnerCity?: string;
  tractorOwnerZip?: string;
  internalNotes?: InternalNote[];
  internalDocuments?: ServerFile[];
  assignedEmployee?: string;
}
