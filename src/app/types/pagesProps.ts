// Dashboard, Ticket and Ticket Details, Receive Form Page Props
import { Dispatch } from "react";
import {
  CarBrand,
  CarPart,
  DropdownOption,
  LogEntry,
  Ticket,
  TicketDetails,
  Vehicle,
  VehicleColor,
  VehicleForm,
  VehicleType,
} from ".";

// Dashboard Page Props

export interface DashboardProps {
  initialStatus?: string | null;
}

// Ticket Details Page Props
export interface TicketDetailsModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  ticketDetails: TicketDetails;
  setTicketDetails: React.Dispatch<React.SetStateAction<TicketDetails>>;
  detailsActiveTab: string;
  setDetailsActiveTab: (tab: string) => void;
  transitionState: string;
  setTransitionState: (state: string) => void;
  // CarVector-related props
  noIncident: boolean;
  setNoIncident: React.Dispatch<React.SetStateAction<boolean>>;
  incidentParts: CarPart[];
  setIncidentParts: React.Dispatch<React.SetStateAction<CarPart[]>>;
  descriptions: Record<string, string>;
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  damagedParts: CarPart[];
  viewAllDamagedParts: boolean;
  setViewAllDamagedParts: (val: boolean) => void;
  formLicensePlate: string;
  findLinkedGroup: (id: string) => string[];
  frontViewLabelsMap: Record<string, string[]>;
  rearViewLabelsMap: Record<string, string[]>;
  passengerViewLabelsMap: Record<string, string[]>;
  driverViewLabelsMap: Record<string, string[]>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  saveClickedRef: React.MutableRefObject<boolean>;
}

// Receive Form Page Props
export interface ReceiveFormProps {
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
  form: Partial<Ticket>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
  initialForm?: Partial<Ticket>;
  setInitialForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
  isFormChanged?: () => boolean;
  shouldBypassUnloadPromptRef?: React.MutableRefObject<boolean>;
  closeModal?: () => void;
  modalType?: "none" | "report" | "incident";
  patronId: string;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  parkedTickets: Ticket[];
}

// Vehicle List Component Props (All Valet Parking Tickets)
export interface VehicleListProps {
  existingVehicles: Vehicle[];
  vehicleColors: VehicleColor[];
  vehicleTypes: VehicleType[];
  carBrands: CarBrand[];
  form: VehicleForm;
  showExistingVehicles: boolean;
  setShowExistingVehicles: (show: boolean) => void;
  handleSelectVehicle: (vehicle: Vehicle, index: number) => void;
}

// Car Vector Component Props

export interface CarVectorProps {
  noIncident: boolean;
  setNoIncident: React.Dispatch<React.SetStateAction<boolean>>;
  incidentParts: CarPart[];
  setIncidentParts: React.Dispatch<React.SetStateAction<CarPart[]>>;
  descriptions: Record<string, string>;
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  licensePlate?: string;
  findLinkedGroup: (id: string) => string[];
  frontViewLabelsMap: Record<string, string[]>;
  rearViewLabelsMap: Record<string, string[]>;
  passengerViewLabelsMap: Record<string, string[]>;
  driverViewLabelsMap: Record<string, string[]>;
  hideLabels?: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  saveClickedRef: React.RefObject<boolean>;
  shouldBypassUnloadPromptRef?: React.RefObject<boolean>;
  isFormChanged?: () => boolean;
  damagedParts?: CarPart[];
}

export interface PinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  setPin: Dispatch<React.SetStateAction<string>>;
  showPin: boolean;
  setShowPin: Dispatch<React.SetStateAction<boolean>>;
  buttonLoader: boolean;
  selectedTicketId: string | null;
  setSelectedTicketId: Dispatch<React.SetStateAction<string | null>>;
  nextStatus: "" | "received" | "parked" | "requested" | "ready" | null;
  setNextStatus: React.Dispatch<
    React.SetStateAction<
      "" | "received" | "parked" | "requested" | "ready" | null
    >
  >;
  vehicles: Ticket[];
  setVehicles: Dispatch<React.SetStateAction<Ticket[]>>;
  setShowPinConfirmationModal: Dispatch<React.SetStateAction<boolean>>;
  setButtonLoader: Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: Dispatch<React.SetStateAction<boolean>>;
}

// Logs Page Props

export interface LogProps {
  logs: LogEntry[];
}
