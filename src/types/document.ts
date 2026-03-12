export const DOCUMENT_TYPE = {
    ID_CARD: "ID",
    PASSPORT: "PASS",
    PASSPORT_PHOTO: "PHOTO",
    SIGNATURE: "SIGN",
    BIRTH_CERTIFICATE: "BIRTH",
    MARITAL_STATUS: "MARST",
    RESIDENCE_PROOF: "ADDR",
    DIPLOMA: "DIPL",
    CERTIFICATE: "CERT",
    CV: "CV",
    CONTRACT: "CNTR",
    CONTRACT_AMENDMENT: "AMD",
    JOB_OFFER: "JOFF",
    APPOINTMENT_LETTER: "APPT",
    ATTESTATION: "ATST",
    MISSION_ORDER: "MISS",
    WARNING_LETTER: "WARN",
    PAYSLIP: "PAY",
    TAX_DOCUMENT: "TAX",
    BANK_DETAILS: "BANK",
    INSURANCE_CERTIFICATE: "INS",
    MEDICAL_CERTIFICATE: "MED",
    RESIGNATION_LETTER: "RES",
    TERMINATION_DOCUMENT: "TERM",
    EXIT_CLEARANCE: "EXIT",
    LEGAL_DOCUMENT: "LEGAL",
    OTHER: "OTHER"
} as const;

export type DocumentType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];

export const HOLDER_TYPE = {
    CONTRACT: "CONTRACT",
    EMPLOYEE: "EMPLOYEE",
    LEAVE: "LEAVE"
} as const;

export type HolderType = typeof HOLDER_TYPE[keyof typeof HOLDER_TYPE];

export interface DocumentRecord {
    id: string;
    type: DocumentType;
    documentRefNumber?: string;
    title?: string;
    holderType: HolderType;
    holderId: string;
    filePath?: string;
    fileSize?: number;
    contentUrl?: string;
    uploadedAt?: string;
    createdAt?: string; // Sometimes APIs return createdAt
    updatedAt?: string;
}
