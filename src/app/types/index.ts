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
}

export interface Ticket {
  id: string;
  patronId: string;
  ticketNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  placeToVisit: string;
  make: string;
  model: string;
  type: string;
  color: string;
  status: string;
  createdDateTime: string;
  notificationId: string;
  isRead: boolean;
  licensePlate?: string;
  damagedParts?: string[];
  pin: string;
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
  };
  ticketLogs?: {
    id: string;
    createdDateTime: string;
    description: string;
    loggedBy: string;
    newValue: string;
    oldValue: string;
  }[];
  damagedParts?: { partName: string; description: string; carView: string }[];
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
