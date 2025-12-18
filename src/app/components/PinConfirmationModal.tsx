import { FaEye, FaEyeSlash } from "react-icons/fa";

import { handlePinSubmit, markAsRead } from "../helpers/dashboardHelpers";
import { useProperty } from "../context/PropertyContext";
import { PinConfirmationModalProps } from "../types/pagesProps";

import Modal from "./Modal";
import ButtonLoader from "./elements/ButtonLoader";

export default function PinConfirmationModal({
  isOpen,
  onClose,
  pin,
  setPin,
  showPin,
  setShowPin,
  buttonLoader,
  selectedTicketId,
  setSelectedTicketId,
  nextStatus,
  setNextStatus,
  vehicles,
  setVehicles,
  setShowPinConfirmationModal,
  setButtonLoader,
  setReloadPageData,
}: PinConfirmationModalProps) {
  const { propertyId, latitude, longitude, locationMode } = useProperty();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 text-gray-800">
        <h4 className="tracking-tight leading-5">
          Please enter your PIN to confirm the status change:
        </h4>

        <div className="relative w-full">
          <input
            type={showPin ? "text" : "password"}
            name="pin"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,4}$/.test(val)) {
                setPin(val);
              }
            }}
            className="border-b border-gray-500 px-2 py-2 pr-10 text-sm placeholder-gray-400 tracking-tight w-full"
            maxLength={4}
            inputMode="numeric"
            pattern="\d*"
            required
          />

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:opacity-50 focus:outline-none cursor-pointer"
          >
            {showPin ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="flex">
          <button
            disabled={buttonLoader || !pin || !propertyId}
            onClick={() =>
              handlePinSubmit({
                propertyId,
                locationMode, // "live" | "manual"
                latitude,
                longitude,
                pin,
                setPin,
                selectedTicketId,
                setSelectedTicketId,
                nextStatus,
                setNextStatus,
                vehicles,
                setVehicles,
                markAsRead,
                setShowPinConfirmationModal,
                setButtonLoader,
                setReloadPageData,
              })
            }
            className={` ${
              !pin || !propertyId
                ? "bg-blue-500/20"
                : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
            } w-full text-white px-4 py-2 rounded text-sm transition-colors duration-200`}
          >
            {buttonLoader ? <ButtonLoader /> : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
