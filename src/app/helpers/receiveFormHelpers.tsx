import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { CarBrand, CarPart, DropdownOption, Ticket, Vehicle, VehiclePhoto } from "../types";
import { formatPhoneNumber } from "../lib/clientUtils";

export const generateTicketNumber = ({
  setForm,
}: {
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
}) => {
  // Generate a UUID, remove dashes, and take the first 6 alphanumeric characters
  const alphanumericSix = uuidv4()
    .replace(/-/g, "")
    .substring(0, 6)
    .toUpperCase();

  setForm((prev: Partial<Ticket>) => ({
    ...prev,
    ticketNumber: alphanumericSix,
  }));
};

const buildDamageStatus = (
  incidentParts: CarPart[],
  descriptions: Record<string, string>,
  labelMapsByView: { [view: string]: Record<string, string[]> }
): Record<
  string,
  Record<string, { isDamaged: boolean; description: string }>
> => {
  const damageStatus: Record<
    string,
    Record<string, { isDamaged: boolean; description: string }>
  > = {};

  for (const view in labelMapsByView) {
    const labelMap = labelMapsByView[view];
    const viewDamage: Record<
      string,
      { isDamaged: boolean; description: string }
    > = {};

    for (const label in labelMap) {
      const partIds = labelMap[label];
      const isDamaged = partIds?.some((id) =>
        incidentParts?.includes(id as unknown as CarPart)
      );

      if (isDamaged) {
        const cleanLabel = label.replace(/\s+/g, "").toLowerCase(); // Normalize label
        viewDamage[cleanLabel] = {
          isDamaged: true,
          description: descriptions[label] || "",
        };
      }
    }

    if (Object.keys(viewDamage).length > 0) {
      damageStatus[view] = viewDamage;
    }
  }

  return damageStatus;
};

// Submit Form
export const handleParkVehicle = async (
  e: React.FormEvent,
  form: Partial<Ticket>,
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>,
  incidentParts: CarPart[],
  descriptions: Record<string, string>,
  noIncident: boolean,
  setLoader: React.Dispatch<React.SetStateAction<boolean>>,
  locationMode: "live" | "manual",
  latitude: number,
  longitude: number,
  propertyId: string | null,
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>,
  router: { refresh: () => void },
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>,
  setInitialForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>,
  setIncidentParts: React.Dispatch<React.SetStateAction<CarPart[]>>,
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  frontViewLabelsMap: Record<string, string[]>,
  rearViewLabelsMap: Record<string, string[]>,
  passengerViewLabelsMap: Record<string, string[]>,
  driverViewLabelsMap: Record<string, string[]>,
  photos: string[] = [],
  setVehiclePhotoUrls?: React.Dispatch<React.SetStateAction<string[]>>
) => {
  e.preventDefault();

  if (!form?.areaCode) {
    setForm((prev) => ({ ...prev, areaCode: "+1" }));
  }

  if (
    !form?.phoneNumber ||
    !form?.make ||
    !form?.model ||
    !form?.type ||
    !form?.color ||
    !form?.pin
  ) {
    const missingFields: string[] = [];

    if (!form?.areaCode || !form?.phoneNumber)
      missingFields.push("Phone Number");
    if (!form?.make) missingFields.push("Make");
    if (!form?.model) missingFields.push("Model");
    if (!form?.type) missingFields.push("Type");
    if (!form?.color) missingFields.push("Color");
    if (!form?.pin) missingFields.push("PIN");

    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: `Please fill all required fields: ${missingFields.join(", ")}`,
    });

    return;
  }

  const hasIncidentData =
    Number(incidentParts?.length) > 0 || photos.length > 0;

  if (!hasIncidentData && !noIncident) {
    Swal.fire({
      icon: "warning",
      title: "Incident Report Required",
      text: "Please complete the vehicle incident report by marking damaged parts, taking photos, or checking 'No Incident'.",
    });
    return;
  }

  const rawPhone = (form?.phoneNumber || "").replace(/\D/g, "");
  if (rawPhone?.length < 10) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Phone Number",
      text: "Please enter a valid phone number with at least 10 digits.",
    });
    return;
  }

  // Check for missing descriptions before submission
  const allLabelsMap = {
    ...frontViewLabelsMap,
    ...rearViewLabelsMap,
    ...passengerViewLabelsMap,
    ...driverViewLabelsMap,
  };

  // Create a reverse map: partId -> label
  const partIdToLabelMap = Object.entries(allLabelsMap).reduce(
    (acc, [label, ids]) => {
      ids.forEach((id) => {
        acc[id] = label;
      });
      return acc;
    },
    {} as Record<string, string>
  );

  const missingDescriptions = incidentParts?.filter((partId) => {
    const label = partIdToLabelMap[partId as unknown as string];
    return label && (!descriptions[label] || descriptions[label].trim() === "");
  });

  if (Number(missingDescriptions?.length) > 0 && !noIncident) {
    Swal.fire({
      icon: "warning",
      title: "Missing Descriptions",
      text: "Please provide a description for all marked damages before submitting.",
    });
    return;
  }

  setLoader(true);

  // const rawPhone = (form?.phoneNumber || "").replace(/\D/g, ""); // Remove non-digit characters

  let damageStatus = buildDamageStatus(incidentParts, descriptions, {
    frontview: frontViewLabelsMap,
    rearview: rearViewLabelsMap,
    passengerview: passengerViewLabelsMap,
    driverview: driverViewLabelsMap,
  });

  if (Object.keys(damageStatus)?.length === 0) {
    damageStatus = {};
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude: userLat, longitude: userLng } = position.coords;
    const rawPhone = (form?.phoneNumber || "").replace(/\D/g, "");
    const last10 = rawPhone.slice(-10); // always keep only 10 digits
    const validAreaCode = form?.areaCode || "+1";

    const sendForm = {
      latitude: locationMode === "manual" ? latitude : userLat,
      // latitude: 18.426434330459355, //250
      longitude: locationMode === "manual" ? longitude : userLng,
      // longitude: -66.05954507209249, //250
      propertyId: propertyId,
      firstName: form?.firstName,
      lastName: form?.lastName,
      phone: validAreaCode + last10, // correct composition
      pin: form?.pin,
      makeId: parseInt(form?.make || "0"),
      modelId: parseInt(form?.model || "0"),
      typeId: parseInt(form?.type || "0"),
      colorId: parseInt(form?.color || "0"),
      licensePlate: form?.licensePlate || "",
      ticketNumber: form?.ticketNumber || uuidv4().slice(0, 6),
      destination: form?.placeToVisit as string,
      damageStatus,
      photos: photos.length > 0 ? photos.map((url) => ({ url })) : undefined,
    };

    // console.log("Submitting form:", sendForm);

    // return; // Uncomment this line to prevent actual submission during development

    const willCharge = await Swal.fire({
      title: "Are You Sure?",
      html: `
        <p>This form submission will trigger a text message to the visitor.</p>
        <p><strong>You may incur a small charge.</strong></p>
        <p class="mt-2 text-gray-500 text-sm">Do you wish to proceed?</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    });

    if (!willCharge.isConfirmed) {
      setLoader(false);
      return;
    }

    try {
      const res = await fetch("/api/vehicleCheckIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendForm }),
      });

      const result = await res.json();

      if (result?.status === "200") {
        setReloadPageData(true); // refresh the data from the API
        // router.refresh();

        // Successful login
        Swal.fire({
          title: "Form Sent",
          // html: `<pre style="text-align: left; white-space: pre-wrap;">${JSON.stringify(
          //   sendForm,
          //   null,
          //   2
          // )}</pre>`,
          // icon: "warning",
          icon: "success",
          text: "Vehicle checked in successfully!",
          confirmButtonText: "Continue",
        }).then(async (response) => {
          if (response.isConfirmed) {
            // Swal.fire({
            //   icon: "success",
            //   title: "Success",
            //   text: "Vehicle checked in successfully!",
            //   showConfirmButton: false,
            //   timer: 1500,
            // });
            setSubmitted(true);
            setForm({});
            setIncidentParts([]);
            setDescriptions({});
            setInitialForm({});
            setVehiclePhotoUrls?.([]);
            setSubmitted(true);
          }
        });
      } else {
        console.log("Error: Unexpected response:", result);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result?.message || "Something went wrong. Please try again.",
          html: `<p>${
            result?.message || "Something went wrong. Please try again."
          }</p><pre style="text-align: left; white-space: pre-wrap; background: #f5f5f5; padding: 6px; border-radius: 4px;">${JSON.stringify(
            sendForm,
            null,
            2
          )}</pre>`,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoader(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (error: unknown) => {
      console.error("Geolocation error:", error);
      Swal.fire({
        icon: "error",
        title: "Location Error",
        text: "Unable to retrieve your location. Please allow location access and try again.",
      });
      setLoader(false);
    };
  });
};


// Resolve a value to a numeric ID string.
// The API may return either a numeric ID or a name string.
const resolveToId = (
  value: unknown,
  list?: { id: number; name: string }[]
): string => {
  if (value == null || value === "") return "";
  const str = String(value);
  // Already a numeric ID — return as-is
  if (/^\d+$/.test(str)) return str;
  // Reverse-lookup: find the ID by matching the name
  if (list) {
    const match = list.find(
      (item) => item.name.toLowerCase() === str.toLowerCase()
    );
    if (match) return String(match.id);
  }
  return "";
};

export const fetchUserDataByPhone = async (
  areaCode: string,
  phone: string,
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>,
  setExistingVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>,
  carBrands?: CarBrand[],
  vehicleTypes?: DropdownOption[],
  vehicleColors?: DropdownOption[],
  setModels?: React.Dispatch<React.SetStateAction<DropdownOption[]>>,
  setIsPhoneLookupLoading?: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedVehiclePhotos?: React.Dispatch<React.SetStateAction<VehiclePhoto[]>>
): Promise<void> => {
  try {
    setIsPhoneLookupLoading?.(true);

    // Compose full international number: e.g. "+1" + "7874849124" → "+17874849124"
    const digits = phone.replace(/\D/g, "");
    const code = (areaCode || "+1").trim();
    const fullPhone = code + digits;

    const res = await fetch(`/api/getVehicle/byPhone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: fullPhone }),
    });

    const data = await res.json();
    const preFill = data?.result?.data;

    if (!preFill) return;

    // Flatten carBrands to a simple list for make lookup
    const brandsFlat = carBrands?.map((b) => ({ id: b.id, name: b.name }));

    // Normalize vehicles: API may return name strings ("Hyundai", "SUV", "Gray")
    // but our dropdowns use numeric IDs. Resolve names → IDs.
    const rawVehicles = preFill?.vehicles || [];
    const vehicles: Vehicle[] = rawVehicles.map(
      (v: Record<string, unknown>) => {
        // Resolve make: prefer makeId, fall back to make (could be name or ID)
        const makeId = resolveToId(v.makeId ?? v.make, brandsFlat);

        // Resolve model: needs brand context to find the correct model list
        const brand = carBrands?.find((b) => b.id === parseInt(makeId || "0"));
        const modelId = resolveToId(v.modelId ?? v.model, brand?.models);

        return {
          id: String(v.id || ""),
          make: makeId,
          model: modelId,
          type: resolveToId(v.typeId ?? v.type, vehicleTypes),
          color: resolveToId(v.colorId ?? v.color, vehicleColors),
          licensePlate: String(v.licensePlate || ""),
          damagedParts: v.damagedParts as CarPart[] | undefined,
          photos: Array.isArray(v.photos) ? v.photos as { id: number; url: string; createdDateTime: string }[] : undefined,
        };
      }
    );
    setExistingVehicles(vehicles);

    // Use functional updater to avoid spreading stale form state
    setForm((prev) => {
      const updated: Partial<Ticket> = {
        ...prev,
        patronId: preFill?.patronId,
        areaCode: prev?.areaCode || "+1",
        phoneNumber: formatPhoneNumber(phone),
        firstName: preFill?.firstName,
        lastName: preFill?.lastName,
        placeToVisit: preFill?.placeToVisit,
      };

      // Auto-fill vehicle fields when exactly one vehicle is saved
      if (vehicles.length === 1) {
        const vehicle = vehicles[0];
        updated.make = vehicle.make;
        updated.model = vehicle.model;
        updated.type = vehicle.type;
        updated.color = vehicle.color;
        updated.licensePlate = vehicle.licensePlate || "";
        updated.damagedParts = vehicle.damagedParts;
      }

      return updated;
    });

    // Populate model dropdown and photos when one vehicle is auto-selected
    if (vehicles.length === 1) {
      if (carBrands && setModels) {
        const brand = carBrands.find(
          (b) => b.id === parseInt(vehicles[0].make || "0")
        );
        if (brand) setModels(brand.models);
      }
      setSelectedVehiclePhotos?.(vehicles[0].photos || []);
    }
  } catch (err) {
    console.error("Failed to fetch user data:", err);
  } finally {
    setIsPhoneLookupLoading?.(false);
  }
};
