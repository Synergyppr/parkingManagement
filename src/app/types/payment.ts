/**
 * PlaceToPay Payment Integration Types
 *
 * Type definitions for PlaceToPay payment gateway integration
 * Used for checkout session creation, auth generation, and payment verification
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface PlaceToPayAuth {
  login: string;
  tranKey: string;
  nonce: string;
  seed: string;
}

export interface PlaceToPayAuthRequest {
  login: string;
  secretKey: string;
}

export interface PlaceToPayAuthResponse {
  success: boolean;
  auth: PlaceToPayAuth;
  note?: string;
}

// ============================================================================
// PAYMENT AMOUNT & TAX TYPES
// ============================================================================

export type TaxKind = 'stateTax' | 'municipalTax' | 'reducedStateTax' | 'airportFee' | 'ice' | 'valueAddedTax';

export interface PaymentTax {
  kind: TaxKind;
  amount: number;
  base: number;
}

export interface PaymentAmount {
  currency: string;
  total: number;
  taxes?: PaymentTax[];
}

// ============================================================================
// PAYER TYPES
// ============================================================================

export interface Payer {
  name: string;
  surname: string;
  email: string;
  mobile?: string;
  document?: string;
  documentType?: string;
}

// ============================================================================
// PAYMENT REQUEST TYPES
// ============================================================================

export interface Payment {
  reference: string;
  description: string;
  amount: PaymentAmount;
  allowPartial?: boolean;
  subscribe?: boolean;
}

export interface CheckoutSessionRequest {
  auth: PlaceToPayAuth;
  locale: string;
  payer: Payer;
  payment: Payment;
  returnUrl: string;
  cancelUrl?: string;
  ipAddress: string;
  userAgent: string;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type PaymentStatusType = 'APPROVED' | 'REJECTED' | 'PENDING' | 'FAILED' | 'OK' | 'ERROR';

export interface PaymentStatus {
  status: PaymentStatusType;
  reason: string;
  message: string;
  date: string;
}

// ============================================================================
// CHECKOUT SESSION RESPONSE TYPES
// ============================================================================

export interface CheckoutSessionResponse {
  status: PaymentStatus;
  requestId: number;
  processUrl: string;
}

// ============================================================================
// SESSION VERIFICATION TYPES
// ============================================================================

export interface SessionStatusRequest {
  auth: PlaceToPayAuth;
}

export interface ProcessorField {
  value: string;
  keyword: string;
  displayOn: string;
}

export interface PaymentDetail {
  amount: {
    to: {
      total: number;
      currency: string;
    };
    from: {
      total: number;
      currency: string;
    };
    factor: number;
  };
  status: PaymentStatus;
  receipt: string;
  refunded: boolean;
  franchise: string;
  reference: string;
  issuerName: string;
  authorization: string;
  paymentMethod: string;
  processorFields: ProcessorField[];
  internalReference: number;
  paymentMethodName: string;
}

export interface SessionField {
  keyword: string;
  value: string | number;
  displayOn: string;
}

export interface SessionRequest {
  locale: string;
  payer: Payer;
  payment: Payment;
  fields: SessionField[];
  returnUrl: string;
  cancelUrl?: string;
  ipAddress: string;
  userAgent: string;
}

export interface SessionStatusResponse {
  requestId: number;
  status: PaymentStatus;
  request: SessionRequest;
  payment: PaymentDetail[];
  subscription: null | unknown;
  autopay: null | unknown;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface PlaceToPayError {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

// ============================================================================
// INTERNAL APPLICATION TYPES
// ============================================================================

export interface PaymentTransaction {
  ticketId: number;
  transactionTypeId: number;
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'placetopay' | 'ecr';
  requestId?: number;
  processUrl?: string;
  authorization?: string;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntentData {
  ticketId: string;
  patronName: string;
  patronSurname: string;
  patronEmail: string;
  patronPhone?: string;
  amount: number;
  transactionTypeId: string;
  transactionDescription: string;
  propertyReference: string;
}
