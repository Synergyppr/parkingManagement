import { FaCar, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { VehicleListProps } from "../types/pagesProps";

const VehicleList = ({
  existingVehicles = [],
  vehicleColors = [],
  vehicleTypes = [],
  carBrands = [],
  form,
  showExistingVehicles,
  setShowExistingVehicles,
  handleSelectVehicle,
}: VehicleListProps) => {
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
      {/* Card Header */}
      <button
        type="button"
        onClick={() => setShowExistingVehicles(!showExistingVehicles)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
      >
        <span className="font-medium text-gray-900 text-sm">
          {form?.firstName ? `${form?.firstName}'s ` : ""}
          Existing Vehicles ({Number(existingVehicles?.length)})
        </span>
        {showExistingVehicles ? (
          <FaChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Card Body */}
      {showExistingVehicles && (
        <div className="px-4 pb-4 flex gap-3 overflow-x-auto">
          {existingVehicles?.map((v, idx) => {
            const selectedColor = vehicleColors?.find(
              (c) => c?.id === parseInt(v?.color)
            )?.name;

            const selectedMakeObj = carBrands?.find(
              (b) => b?.id === parseInt(v?.make)
            );

            const selectedMake = selectedMakeObj?.name;

            const selectedModel = selectedMakeObj?.models.find(
              (m) => m?.id === parseInt(v?.model)
            )?.name;

            const selectedType = vehicleTypes?.find(
              (t) => t?.id === parseInt(v?.type)
            )?.name;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectVehicle(v, idx)}
                className="shrink-0 w-44 p-3 bg-white border-2 border-orange-200 hover:border-orange-400 rounded-xl text-left transition-all hover:scale-105 hover:shadow-md cursor-pointer"
              >
                <FaCar className="w-5 h-5 text-accent mb-2" />
                <p className={`${
                  v?.licensePlate ? "font-semibold" : "text-gray-400"
                } text-gray-900 text-sm`}>
                  {v?.licensePlate || "No Plate"}
                </p>
                <p className="text-accent text-xs mt-0.5 capitalize">
                  {selectedColor || v?.color} {selectedMake || v?.make}{" "}
                  {selectedModel || v?.model} &ndash; {selectedType || v?.type}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
