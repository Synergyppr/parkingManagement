import { FaCar, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { VehicleListProps } from "../types/pagesProps";

const normalizeValue = (value?: string | number | null) =>
  String(value ?? "").trim().toLowerCase();

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
  const isSelectedVehicle = (
    vehicle: VehicleListProps["existingVehicles"][number]
  ) => {
    const vehiclePlate = normalizeValue(vehicle?.licensePlate);
    const formPlate = normalizeValue(form?.licensePlate);

    const samePlate =
      Boolean(vehiclePlate) &&
      Boolean(formPlate) &&
      vehiclePlate === formPlate;

    const sameVehicleDetails =
      normalizeValue(vehicle?.make) === normalizeValue(form?.make) &&
      normalizeValue(vehicle?.model) === normalizeValue(form?.model) &&
      normalizeValue(vehicle?.type) === normalizeValue(form?.type) &&
      normalizeValue(vehicle?.color) === normalizeValue(form?.color);

    /*
     * Prefer license plate matching when both values exist.
     * Fall back to matching the complete vehicle details when there is no plate.
     */
    if (vehiclePlate && formPlate) {
      return samePlate;
    }

    return sameVehicleDetails;
  };

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={() => setShowExistingVehicles(!showExistingVehicles)}
        aria-expanded={showExistingVehicles}
        className="flex w-full cursor-pointer items-center justify-between gap-4 bg-linear-to-br from-white via-(--primary-soft) to-white px-5 py-4 text-left transition hover:bg-(--primary-soft)"
      >
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
            Vehicle History
          </span>

          <h3 className="mt-2 truncate font-serif text-xl font-bold text-slate-950">
            {form?.firstName ? `${form.firstName}'s ` : ""}
            Existing Vehicles
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {existingVehicles.length} saved vehicle
            {existingVehicles.length === 1 ? "" : "s"}
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
          {existingVehicles.length === 0 ? (
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
            <div className="flex gap-3 overflow-x-auto px-1 pb-3 pt-1">
              {existingVehicles.map((vehicle, index) => {
                const selectedColor = vehicleColors.find(
                  (color) => color?.id === Number(vehicle?.color)
                )?.name;

                const selectedMakeObj = carBrands.find(
                  (brand) => brand?.id === Number(vehicle?.make)
                );

                const selectedMake = selectedMakeObj?.name;

                const selectedModel = selectedMakeObj?.models?.find(
                  (model) => model?.id === Number(vehicle?.model)
                )?.name;

                const selectedType = vehicleTypes.find(
                  (type) => type?.id === Number(vehicle?.type)
                )?.name;

                const isSelected = isSelectedVehicle(vehicle);

                return (
                  <button
                    key={
                      vehicle?.licensePlate
                        ? `${vehicle.licensePlate}-${index}`
                        : index
                    }
                    type="button"
                    onClick={() => handleSelectVehicle(vehicle, index)}
                    aria-pressed={isSelected}
                    className={`group relative min-h-35 w-48 shrink-0 cursor-pointer overflow-hidden rounded-3xl border bg-linear-to-br from-white via-(--primary-soft) to-white p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "scale-[1.015] border-primary ring-2 ring-(--primary-light) shadow-[0_20px_55px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                        : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:border-(--primary-light) hover:shadow-[0_18px_45px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
                    }`}
                  >
                    <div
                      className={`absolute -right-8 -top-8 h-24 w-24 rounded-full transition ${
                        isSelected
                          ? "bg-(--primary-light)"
                          : "bg-(--primary-soft) group-hover:bg-(--primary-light)"
                      }`}
                    />

                    {isSelected && (
                      <span className="absolute right-3 top-3 z-20 inline-flex rounded-full bg-primary px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                        Selected
                      </span>
                    )}

                    <div className="relative z-10">
                      <div
                        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white transition ${
                          isSelected
                            ? "ring-4 ring-(--primary-light) shadow-[0_16px_34px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                            : "shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                        }`}
                      >
                        <FaCar className="h-5 w-5" />
                      </div>

                      <p
                        className={`truncate font-mono text-sm font-black tracking-wide ${
                          vehicle?.licensePlate
                            ? "text-slate-950"
                            : "text-slate-400"
                        }`}
                      >
                        {vehicle?.licensePlate || "No Plate"}
                      </p>

                      <p className="mt-2 line-clamp-2 text-xs font-bold capitalize leading-5 text-primary">
                        {selectedColor || vehicle?.color}{" "}
                        {selectedMake || vehicle?.make}{" "}
                        {selectedModel || vehicle?.model}
                      </p>

                      <span
                        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-(--primary-light) bg-white text-primary"
                        }`}
                      >
                        {selectedType || vehicle?.type}
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