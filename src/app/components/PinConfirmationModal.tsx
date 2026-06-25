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
      <div className="p-6">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
            <span className="text-xl">🔐</span>
          </div>

          <h3 className="font-serif text-2xl font-bold text-slate-900">
            PIN Confirmation
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Enter your security PIN to authorize this valet status update.
          </p>
        </div>

        {/* PIN Input */}
        <div className="relative w-full">
          <input
            type={showPin ? "text" : "password"}
            name="pin"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              const val = e.target.value;

              if (/^\d{0,4}$/.test(val)) {
                setPin(val);
              }
            }}
            className="
              w-full
              h-14
              px-4
              pr-12
              rounded-2xl
              border
              border-slate-200
              bg-white
              text-center
              text-xl
              tracking-[0.5em]
              font-mono
              text-slate-900
              outline-none
              transition-all
              focus:border-amber-400
              focus:ring-4
              focus:ring-amber-100
            "
            maxLength={4}
            inputMode="numeric"
            pattern="\d*"
            required
          />

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-slate-400
              hover:text-amber-600
              transition-colors
              cursor-pointer
            "
          >
            {showPin ? (
              <FaEyeSlash className="h-5 w-5" />
            ) : (
              <FaEye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="mt-2 text-center text-xs text-slate-400">
          4-digit operator verification PIN
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              h-12
              rounded-2xl
              border
              border-slate-200
              bg-white
              text-slate-700
              font-semibold
              transition-all
              hover:bg-slate-50
              cursor-pointer
            "
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
            className="
              flex-1
              h-12
              rounded-2xl
              bg-amber-500
              hover:bg-amber-600
              disabled:opacity-60
              text-white
              font-bold
              shadow-[0_10px_30px_rgba(217,174,38,0.28)]
              transition-all
              cursor-pointer
              flex
              items-center
              justify-center
            "
          >
            {buttonLoader ? <ButtonLoader /> : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}