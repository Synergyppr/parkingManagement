import { FaCar, FaChevronDown, FaChevronUp } from "react-icons/fa6";

const VehicleList = ({
  existingVehicles = [],
  vehicleColors = [],
  vehicleTypes = [],
  carBrands = [],
  form,
  showExistingVehicles,
  setShowExistingVehicles,
  handleSelectVehicle,
}: {
  existingVehicles: {
    id: string;
    make: string;
    model: string;
    type: string;
    color: string;
    licensePlate: string;
    damagedParts?: string[];
  }[];
  vehicleColors: { id: number; name: string }[];
  vehicleTypes: { id: number; name: string }[];
  carBrands: {
    id: number;
    name: string;
    models: { id: number; name: string }[];
  }[];
  form: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    areaCode?: string;
    make?: string;
    model?: string;
    type?: string;
    color?: string;
    licensePlate?: string;
    damagedParts?: string[];
  };
  showExistingVehicles: boolean;
  setShowExistingVehicles: (show: boolean) => void;
  handleSelectVehicle: (
    vehicle: {
      id: string;
      make: string;
      model: string;
      type: string;
      color: string;
      licensePlate: string;
      damagedParts?: string[];
    },
    index: number
  ) => void;
}) => {
  return (
    <div
      className={`${
        !showExistingVehicles ? "border-[.8px]" : "border-[.3px]"
      } overflow-hidden bg-white text-gray-800 relative  border-solid border-blue-700 mb-4`}
    >
      {/* Card Header */}
      <div
        className={`${
          !showExistingVehicles
            ? "border-none"
            : "border-b-[0.3px] border-solid"
        } flex items-center justify-between px-4 py-3 text-blue-600  border-blue-700`}
      >
        <h3 className="text-base font-bold tracking-tight">
          {form?.firstName ? `${form?.firstName}'s ` : ""}
          Existing Vehicles <span>({Number(existingVehicles?.length)})</span>
        </h3>
        <div>
          {/* Manage List Button */}
          {/* <button
          type="button"
          className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
          title="Toggle View"
          onClick={() => setManageModeOn(!manageModeOn)}
        >
          <IoSettingsSharp className="w-5 h-5" />
        </button> */}

          {/* Chevron up/down to collapse body */}
          <button
            type="button"
            onClick={() => {
              setShowExistingVehicles(!showExistingVehicles);
              const body = document.getElementById("existingVehiclesBody");
              if (body) {
                if (body.style.display === "none") {
                  body.style.display = "flex";
                } else {
                  body.style.display = "none";
                }
              }
            }}
            className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
            title="Toggle View"
          >
            {showExistingVehicles ? (
              <FaChevronUp className="w-5 h-5" />
            ) : (
              <FaChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div
        className={`${
          showExistingVehicles
            ? "max-h-[1000px] opacity-100 p-4"
            : "max-h-0 opacity-0 p-0"
        } transition-all duration-700 bg-gradient-to-br from-blue-100 to-slate-100 min-h-full flex flex-wrap gap-3`}
      >
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
            <div key={idx}>
              {/* {manageModeOn && (
              <div className="my-auto">
                <button type="button">
                  <FaTrash
                    onClick={() => handleDeleteVehicle(v?.id)}
                    className="text-gray-500 hover:text-red-600 cursor-pointer"
                  />
                </button>
              </div>
            )} */}
              <div
                onClick={() => handleSelectVehicle(v, idx)}
                className={`cursor-pointer px-4 py-3 rounded-xl shadow-md flex items-center gap-3 transition bg-white duration-500 
              border-[.8px] border-solid border-[#ef6c00] hover:scale-105`}
              >
                <div>
                  <p
                    className={`${
                      v?.licensePlate
                        ? "font-bold tracking-tight"
                        : "text-gray-400 font-medium"
                    } text-sm`}
                  >
                    {v?.licensePlate || "No Plate"}
                  </p>
                  <p className={`text-xs capitalize text-[#ef6c00]`}>
                    {selectedColor || v?.color} {selectedMake || v?.make}{" "}
                    {selectedModel || v?.model} – {selectedType || v?.type}
                  </p>
                </div>
                <FaCar className={`w-5 h-5 text-[#ef6c00]`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleList;
