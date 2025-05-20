import { JSX } from "react";
// lib/types/index.ts
export interface Vehicle {
  ticketNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  placeToVisit: string;
  make: string | null;
  model: string | null;
  type: string;
  color: string;
  pin: string;
  status: 'receive' | 'parked' | 'requested' | 'ready' | '';
  createdDateTime: string;
}

export interface TabItem {
  label: string;
  icon: JSX.Element;
  key: 'receive' | 'parked' | 'requested' | 'ready';
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

export interface VehicleApiResponse {
  tickets: Vehicle[];
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
  statuses: string[];
}