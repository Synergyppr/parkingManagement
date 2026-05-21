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
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-base">PIN Confirmation</h3>
        <p className="text-sm text-gray-500">
          Enter your PIN to confirm the status change:
        </p>

        <div className="relative w-full">
          <input
            type={showPin ? "text" : "password"}
            name="pin"
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,4}$/.test(val)) {
                setPin(val);
              }
            }}
            className="w-full h-11 px-3 pr-10 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center text-lg tracking-widest font-mono"
            maxLength={4}
            inputMode="numeric"
            pattern="\d*"
            required
          />

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
          >
            {showPin ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={buttonLoader || !pin || !propertyId}
            onClick={() =>
              handlePinSubmit({
                propertyId,
                locationMode,
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
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer flex items-center justify-center"
          >
            {buttonLoader ? <ButtonLoader /> : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
