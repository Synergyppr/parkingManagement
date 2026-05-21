/**
 * Evertec ECR Terminal Payment Types
 *
 * Type definitions for Evertec ECR (Electronic Cash Register) terminal integration
 * Based on ECR API Documentation 01.02.07
 *
 * approval_code values:
 *   "00" → APPROVED
 *   "ZY" → NOT APPROVED (declined, cancelled, insufficient funds, etc.)
 *   "ST" → STILL PROCESSING (keep polling with getTrxStatus)
 */

// ============================================================================
// BASE REQUEST TYPES
// ============================================================================

export interface ECRBaseRequest {
  app_key: string;
  terminal_id: string;
  terminal_url: string;
  station_number: string;
  cashier_id: string;
  reference: string;
  last_reference: string;
}

export interface ECRSessionRequest extends ECRBaseRequest {
  session_id?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export type ECRLogonRequest = ECRBaseRequest;

export interface ECRLogonResponse {
  success: boolean;
  session_id: string;
  terminal_id: string;
  terminal_vid?: string;
  reference: string;
  last_reference?: string;
  merchant_id?: string;
  station_number?: string;
  cashier_id?: string;
  approval_code?: string;
  response_message?: string;
  message?: string;
}

export type ECRLogoffRequest = ECRSessionRequest;

export interface ECRLogoffResponse {
  success: boolean;
  message: string;
  reference: string;
  approval_code?: string;
  response_message?: string;
}

// ============================================================================
// AMOUNTS STRUCTURE
// ============================================================================

export interface ECRAmountsPayload {
  total: string;
  base_state_tax?: string;
  base_reduced_tax?: string;
  state_tax?: string;
  reduced_tax?: string;
  city_tax?: string;
  tip?: string;
  cashback?: string;
}

// ============================================================================
// SALES TRANSACTIONS
// ============================================================================

export interface ECRSaleRequest extends ECRSessionRequest {
  amounts: ECRAmountsPayload;
  receipt_output?: 'POS' | 'HTML' | 'BOTH' | 'NO';
  receipt_email?: 'yes' | 'no';
  process_cashback?: 'yes' | 'no';
  manual_entry_indicator?: 'yes' | 'no';
  force_duplicate?: 'yes' | 'no';
  allowed_special_accounts?: string[];
}

export interface ECRSaleInitialResponse {
  success: boolean;
  trx_id: string;
  reference: string;
  last_reference?: string;
  session_id?: string;
  terminal_id?: string;
  station_number?: string;
  cashier_id?: string;
  /** "ST" = transaction initiated and in progress */
  approval_code: 'ST' | string;
  response_message?: string;
  amounts?: ECRAmountsPayload;
  receipt_email?: string;
  process_cashback?: string;
  manual_entry_indicator?: string;
  receipt_output?: string;
  message?: string;
  status?: 'pending' | 'approved' | 'declined' | 'cancelled';
  amount?: string;
}

// ECRSaleResponse used as shorthand for initial response from start-sale/start-refund
export type ECRSaleResponse = ECRSaleInitialResponse;

// ============================================================================
// TRANSACTION STATUS (getTrxStatus)
// ============================================================================

export interface ECRIVUData {
  control_line1?: string;
  control_line2?: string;
  info_line1?: string;
  info_line2?: string;
  info_line3?: string;
  info_line4?: string;
  info_line5?: string;
}

export interface ECREmvData {
  '9F12'?: string; // Application Label
  '9F06'?: string; // AID
  '9F26'?: string; // Application Cryptogram
  '9F37'?: string; // Unpredictable Number
  '95'?: string;   // Terminal Verification Results
  '9B'?: string;   // Transaction Status Information
}

/**
 * Final status response from getTrxStatus — returned when approval_code is "00" or "ZY".
 * Also returned as intermediate responses when approval_code is "ST" (still processing).
 *
 * approval_code:
 *   "00" → APPROVED
 *   "ZY" → NOT APPROVED (declined, cancelled, error, insufficient funds, etc.)
 *   "ST" → STILL PROCESSING — keep polling
 */
export interface ECRStatusResponse {
  trx_id?: string;
  reference?: string;
  last_reference?: string;
  session_id?: string;
  terminal_id?: string;
  station_number?: string;
  cashier_id?: string;
  /** "00" = approved | "ZY" = not approved | "ST" = processing */
  approval_code: '00' | 'ZY' | 'ST' | string;
  response_message?: string;
  amounts?: ECRAmountsPayload;

  // Final response fields — present when approval_code is "00" or "ZY"
  authorization_code?: string;
  merchant_id?: string;
  /** Last 4 digits of the card number */
  pan_card_number?: string;
  invoice_number?: string;
  /** Format: mmddyyyy */
  transaction_date?: string;
  /** Format: hhmmss */
  transaction_time?: string;
  /**
   * Card/payment type:
   * VC=Visa Credit | MC=MasterCard | AT=ATH Debit | AX=Amex | DC=Discover
   * IC=Cash | UN=UnionPay | EB=EBT Food | EC=EBT Cash | AM=ATH Móvil | BA=Health Card
   */
  special_account?: string;
  batch_number?: string;
  trace_number?: string;
  /** "ATH1" | "ATH2" | "ATH3" | "ATH4" */
  payment_host?: string;
  /** "ONLINE" | "OFFLINE" | "NONE" */
  card_acceptor_id?: string;
  /** "SIGN" | "NOSIGN" */
  signature_indicator?: string;
  /** "C"=Credit | "D"=Debit | "I"=IVU Cash | "E"=EBT | "A"=ATH Movil */
  transaction_type_indicator?: string;
  /** "MANUAL" | "MSR" | "CTLS" | "CHIP" */
  entry_type?: string;
  /** "printed" | "no_receipt" | "sms" | "email" | "unselected" */
  receipt_selected?: string;
  fallback?: 'yes' | 'no';
  ivu?: ECRIVUData;
  emv_data?: ECREmvData;
  receipt_output?: string;
  receipt_email?: string;
  receipt?: string;
  message?: string;
}

// ============================================================================
// REFUND TRANSACTIONS
// ============================================================================

export interface ECRRefundRequest extends ECRSessionRequest {
  amounts: ECRAmountsPayload;
  receipt_output?: 'POS' | 'HTML' | 'BOTH' | 'NO';
  receipt_email?: 'yes' | 'no';
  manual_entry_indicator?: 'yes' | 'no';
  force_duplicate?: 'yes' | 'no';
  allowed_special_accounts?: string[];
}

export type ECRRefundResponse = ECRSaleInitialResponse;

// ============================================================================
// VOID TRANSACTIONS
// ============================================================================

export interface ECRVoidRequest extends ECRSessionRequest {
  /** Reference of the transaction to void */
  target_reference: string;
  receipt_output?: 'POS' | 'HTML' | 'BOTH' | 'NO';
  receipt_email?: 'yes' | 'no';
}

export interface ECRVoidResponse {
  success: boolean;
  trx_id?: string;
  reference?: string;
  target_reference?: string;
  approval_code?: string;
  response_message?: string;
  message?: string;
}

// ============================================================================
// TIP ADJUST
// ============================================================================

export interface ECRTipAdjustRequest extends ECRSessionRequest {
  /** Reference of the transaction to adjust */
  target_reference: string;
  /** New tip amount as decimal string e.g. "5.00" */
  tip: string;
}

export interface ECRTipAdjustResponse {
  success: boolean;
  reference?: string;
  target_reference?: string;
  tip?: string;
  approval_code?: string;
  response_message?: string;
  message?: string;
}

// ============================================================================
// SETTLEMENT (END OF DAY)
// ============================================================================

export type ECRSettlementRequest = ECRSessionRequest & {
  receipt_output?: 'POS' | 'HTML' | 'BOTH' | 'NO';
  /** "yes" to get details of the last settlement */
  last_settle?: 'yes' | 'no';
};

export interface ECRSettlementInitialResponse {
  success: boolean;
  trx_id: string;
  reference?: string;
  last_reference?: string;
  session_id?: string;
  terminal_id?: string;
  station_number?: string;
  cashier_id?: string;
  approval_code?: string;
  response_message?: string;
  receipt_output?: string;
  message?: string;
}

// ============================================================================
// JOURNAL
// ============================================================================

export interface ECRJournalRequest extends ECRSessionRequest {
  /** "all" for all transactions, or specific reference number */
  target_reference: string;
  /**
   * Pagination offset — when target_reference is "all", the terminal returns
   * up to 100 transactions starting from this position.
   * Example: start=50 returns transactions 50–149.
   */
  start?: number;
}

export interface ECRJournalTransaction {
  terminal_id?: string;
  merchant_id?: string;
  reference?: string;
  transaction_date?: string;
  transaction_time?: string;
  approval_code?: string;
  trace_number?: string;
  special_account?: string;
  pan_card_number?: string;
  /** e.g. "SALE", "REFUND", "TIP_ADJ", "VOID" */
  transaction_type?: string;
  /** "CREDIT" | "DEBIT" | "IVU_CASH" | "EBT" | "ATH_MOVIL" */
  account_indicator?: string;
  amounts?: ECRAmountsPayload;
  authorization_code?: string;
  invoice?: string;
  signature_indicator?: string;
  card_bin_type?: string;
  card_acceptor_id?: string;
  payment_host?: string;
  ath_trans_id?: string;
  entry_type?: string;
  emv_data?: ECREmvData;
  ivu?: ECRIVUData;
}

export interface ECRJournalHostData {
  batch_number?: string;
  merchant_id?: string;
  terminal_id?: string;
  trans?: ECRJournalTransaction[];
}

/**
 * Journal response — shape of `reference_value` depends on the request:
 *
 * When target_reference = "all":
 *   reference_value is Record<string, ECRJournalHostData> grouped by payment host (ATH1, ATH2, etc.)
 *
 * When target_reference = "<specific_reference>":
 *   reference_value is a single ECRJournalTransaction object
 */
export interface ECRJournalResponse {
  success: boolean;
  reference?: string;
  last_reference?: string;
  session_id?: string;
  terminal_id?: string;
  merchant_id?: string;
  station_number?: string;
  cashier_id?: string;
  approval_code?: string;
  response_message?: string;
  target_reference?: string;
  /** Grouped by host when target_reference="all", single transaction object otherwise */
  reference_value?: Record<string, ECRJournalHostData> | ECRJournalTransaction;
  /** Total number of transactions in the current batch (present when target_reference="all") */
  total_transactions?: number;
  /** Pagination start position echoed back */
  start?: number;
  message?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ECRError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// ============================================================================
// INTERNAL APPLICATION TYPES
// ============================================================================

export interface ECRPaymentSession {
  session_id: string;
  reference_counter: number;
  started_at: Date;
  expires_at: Date;
}

export interface ECRPaymentIntent {
  ticketId: string;
  amount: number;
  transactionTypeId: string;
  transactionDescription: string;
  patronName: string;
  patronPhone?: string;
}

export interface ECRTransactionRecord {
  ticketId: string;
  trx_id: string;
  session_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  authorizationCode?: string;
  cardType?: string;
  cardLastFour?: string;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
}
