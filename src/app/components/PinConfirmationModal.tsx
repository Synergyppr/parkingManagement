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
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-(--primary-soft) ring-1 ring-(--primary-light)">
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
            autoFocus={false}
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
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-center font-mono text-xl tracking-[0.5em]
            text-slate-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-(--primary-soft)"
            maxLength={4}
            inputMode="numeric"
            pattern="\d*"
            required
          />

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute
              right-4
              top-1/2
              -translate-y-1/2
              cursor-pointer
              text-slate-400
              transition-colors
              hover:text-primary
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
              h-12
              flex-1
              cursor-pointer
              rounded-2xl
              border
              border-slate-200
              bg-white
              font-semibold
              text-slate-700
              transition-all
              hover:bg-slate-50
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
              flex
              h-12
              flex-1
              cursor-pointer
              items-center
              justify-center
              rounded-2xl
              bg-primary
              font-bold
              text-white
              shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_28%,transparent)]
              transition-all
              hover:bg-secondary
              disabled:opacity-60
            "
          >
            {buttonLoader ? <ButtonLoader /> : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
