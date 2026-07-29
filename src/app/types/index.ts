import { JSX } from "react";
// lib/types/index.ts

// GetValetTicketsByPropertyId

export interface TicketResponse {
  status: string;
  message: string;
  data: TicketResponseData;
}

export interface TicketResponseData {
  tickets: Ticket[];
  readyTickets: Ticket[];
  carBrands: CarBrand[];
  vehicleTypes: VehicleType[];
  vehicleColors: VehicleColor[];
  statuses: string[];
  primaryColor: string;
  secondaryColor: string;
}

export interface Ticket {
  id: string;
  patronId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  vehicles: {
    id: string;
    make: string;
    model: string;
    type: string;
    color: string;
    licensePlate: string;
    damagedParts?: CarPart[];
  };
  createdDateTime: string;
  notificationId: string;
  ticketNumber: string;
  pin: string;
  isRead: boolean;
  status: string;
  areaCode?: string;
  make: string;
  model: string;
  type: string;
  color: string;
  licensePlate?: string;
  placeToVisit?: string;
  damagedParts?: CarPart[];
  photos?: { url: string }[];
}

export interface CarBrand {
  id: number;
  name: string;
  models: CarModel[];
}

export interface CarModel {
  id: number;
  name: string;
}

export interface VehicleType {
  id: number;
  name: string;
}

export interface VehicleColor {
  id: number;
  name: string;
}

export interface CarPart {
  partName: string;
  description: string;
  carView: string;
  id: string;
}

export interface VehicleData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  areaCode?: string;
  ticketNumber?: string;
  color?: string;
  make?: string;
  model?: string;
  type?: string;
  createdDateTime?: string;
  placeToVisit?: string;
  status?: string;
  patronId?: string;
  propertyId?: string;
  notificationId?: string;
  surveySubmitted?: boolean;
  transactions?: TicketTransaction[];
}

export interface VehiclePhoto {
  id: number;
  url: string;
  createdDateTime: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  type: string;
  color: string;
  licensePlate: string;
  damagedParts?: CarPart[];
  photos?: VehiclePhoto[];
}

/////////////////////////////////////////////////////////////////////

export interface TicketDetails {
  ticketId: string;
  createdDateTime: string;
  patron?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
  destination?: string;
  vehicle?: {
    brand?: string;
    model?: string;
    type?: string;
    color?: string;
    licensePlate?: string;
    photos?: { url: string }[];
  };
  transactions?: TicketTransaction[];
  ticketLogs?: {
    id: string;
    createdDateTime: string;
    description: string;
    loggedBy: string;
    newValue: string;
    oldValue: string;
  }[];
  licensePlate?: string;
  damagedParts?: CarPart[];
  photos?: { url: string }[];
}

export interface TicketTransactionReceipt {
  receiptType?: string;
  receiptText?: string;
  receiptHtml?: string;
  createdAtUtc?: string;
  receipts?: Receipts[];
}

export interface Receipts {
  createdAtUtc: string;
  receiptHtml: string;
  receiptText: string;
  receiptType: string;
}

export interface TicketTransactionPaymentDetail {
  paymentTransactionId?: string;
  trxId?: string;
  amount?: number;
  taxAmount?: number;
  tipAmount?: number;
  createdAtUtc?: string;
  receipts?: TicketTransactionReceipt[];
}

export interface TicketTransaction {
  id?: string;
  transaction_type?: string;
  amount?: number;
  payment_method?: string;
  transaction_date_time?: string;
  application_id?: string;
  paymentdetail?: TicketTransactionPaymentDetail;
  receipts: Receipts[];
  reference_number: string;
}

/////////////////////////////////////////////////////////////////////////

export interface TabItem {
  label: string;
  icon: JSX.Element;
  key: "received" | "parked" | "requested" | "ready";
}

export interface VehicleActionButton {
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}

export interface DropdownOption {
  id: number;
  name: string;
}

export interface CarBrand {
  id: number;
  name: string;
  models: DropdownOption[];
}

///////////////////////////////////////////////////////////////////////////

export interface UserForm {
  id?: string;
  tenantId?: string;
  userName: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: number | string;
  gender: string;
  dateOfBirth: string;
  isActive: boolean;
  pin: string;
  identifier?: string;
  createdDateTime?: string;
}

/////////////////////////////////////////////////////////////////////////////

export interface Tenant {
  id?: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
}

///////////////////////////////////////////////////////////////////////////////

export interface Property {
  id: string;
  tenant: string;
  name: string;
  address: string;
  createdAtDateTime: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  radius: number;
  primaryColor: string;
  secondaryColor: string;
}

/////////////////////////////////////////////////////////////////////////////////
export interface NotificationHandler {
  ticketId: string;
  status: string;
  // id: string;
  // title: string;
  // message: string;
  // createdDateTime: string;
  // isRead: boolean;
}

//////////////////////////////////////////////////////////////////////////////

export interface VehicleForm {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  areaCode?: string;
  make?: string;
  model?: string;
  type?: string;
  color?: string;
  placeToVisit?: string;
  licensePlate?: string;
  damagedParts?: CarPart[];
  photos?: { url: string }[];
}

//////////////////////////////////////////////////////////////////////////////

export interface MarkAsReadProps {
  vehicle: Ticket;
  action: "view" | "changeStatus";
  setSelectedTicketId: React.Dispatch<React.SetStateAction<string | null>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  setVehicles: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

//////////////////////////////////////////////////////////////////////////////

export interface LogEntry {
  createdDateTime: string;
  loggedBy?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
}

//////////////////////////////////////////////////////////////////////////////

export interface ReportEntry {
  id: string;
  ticketNumber: string;
  patronName: string;
  placeToVisit: string;
  employeeName: string;
  date: string;
}

//////////////////////////////////////////////////////////////////////////////

export interface PrTaxRate {
  key: string;
  label: string;
  rate: number; // percentage, e.g. 10.5
}

export interface RateEntry {
  id: number;
  name: string;
  value: number;
  isActive: boolean;
  taxable?: boolean;
  stateTaxRate?: number; // percentage e.g. 10.5 (IVU Estatal - Puerto Rico)
  cityTaxRate?: number; // percentage e.g. 1.0  (IVU Municipal - Puerto Rico)
}

export interface CourtesyRecord {
  ticketId: string;
  reason: string;
  givenBy: string; // accountUser (email/username)
  givenAt: string; // ISO datetime string
  propertyId: string;
  pin: string;
}

export interface TaxBreakdown {
  base: number;
  stateTax: number;
  stateTaxRate: number;
  cityTax: number;
  cityTaxRate: number;
  total: number;
}

//////////////////////////////////////////////////////////////////////////////

export interface ValetTransactionRequest {
  ticketId: string;
  propertyId: string;
  pin: string;
  latitude: number;
  longitude: number;
  paymentMethod: string;
  transactionTypeId: number;
  amount?: number;
  terminalId?: string;
  tip?: number;
  receiptOutput?: string;
  receiptEmail?: string;
  notes?: string;
}

export interface PropertyDevice {
  id: string;
  propertyId: string;
  name: string;
  phone?: string;
}

export interface PaymentTerminal {
  id: string;
  property_id: string;
  application_id: string;
  name: string;
  terminal_url: string;
  terminal_id: string;
  is_default: boolean;
  is_active: boolean;
}
