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
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={() => setShowExistingVehicles(!showExistingVehicles)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 bg-linear-to-br from-white via-(--primary-soft) to-white px-5 py-4 text-left 
        transition hover:bg-(--primary-soft)"
      >
        <div className="min-w-0">
          <span
            className="inline-flex rounded-full border border-(--primary-light) bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] 
          text-primary shadow-sm"
          >
            Vehicle History
          </span>

          <h3 className="mt-2 truncate font-serif text-xl font-bold text-slate-950">
            {form?.firstName ? `${form?.firstName}'s ` : ""}
            Existing Vehicles
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {Number(existingVehicles?.length)} saved vehicle(s)
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--primary-light) bg-white text-primary shadow-sm">
          {showExistingVehicles ? (
            <FaChevronUp className="h-4 w-4" />
          ) : (
            <FaChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {showExistingVehicles && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
          {existingVehicles?.length === 0 ? (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
                <FaCar className="h-5 w-5" />
              </div>

              <p className="font-serif text-lg font-bold text-slate-950">
                No saved vehicles
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Previously used vehicles will appear here.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
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
                    className="group relative min-h-35 w-48 shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br 
                    from-white via-(--primary-soft) to-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary-light) 
                    hover:shadow-[0_18px_45px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-(--primary-soft) transition group-hover:bg-(--primary-light)" />

                    <div className="relative z-10">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
                        <FaCar className="h-5 w-5" />
                      </div>

                      <p
                        className={`truncate font-mono text-sm font-black tracking-wide ${
                          v?.licensePlate ? "text-slate-950" : "text-slate-400"
                        }`}
                      >
                        {v?.licensePlate || "No Plate"}
                      </p>

                      <p className="mt-2 line-clamp-2 text-xs font-bold capitalize leading-5 text-primary">
                        {selectedColor || v?.color} {selectedMake || v?.make}{" "}
                        {selectedModel || v?.model}
                      </p>

                      <span
                        className="mt-3 inline-flex rounded-full border border-(--primary-light) bg-white px-3 py-1 text-[10px] font-black uppercase 
                      tracking-[0.12em] text-primary"
                      >
                        {selectedType || v?.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
