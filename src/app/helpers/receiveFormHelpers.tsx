import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { CarPart, Ticket, Vehicle } from "../types";

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
  driverViewLabelsMap: Record<string, string[]>
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

  if (Number(incidentParts?.length) < 1 && !noIncident) {
    Swal.fire({
      icon: "warning",
      title: "Incident Report Required",
      text: "Please complete the vehicle incident report. If there are no incidents, please check the box above before submission.",
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
          html: `<pre style="text-align: left; white-space: pre-wrap;">${JSON.stringify(
            sendForm,
            null,
            2
          )}</pre>`,
          icon: "warning",
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

// Keeps last 10 digits in phoneNumber; puts the rest (country code) in areaCode.
const splitPhone = (
  full: string | undefined,
  fallbackArea = "+1"
): { areaCode: string; phoneNumber: string } => {
  const digits = (full || "").replace(/\D/g, ""); // strip non-digits
  const local10 = digits.slice(-10); // last 10 digits
  const countryDigits = digits.slice(0, Math.max(0, digits.length - 10));
  const areaCode = countryDigits ? `+${countryDigits}` : fallbackArea;
  return { areaCode, phoneNumber: local10 };
};

// Modify fetchUserDataByPhone
export const fetchUserDataByPhone = async (
  phone: string,
  form: Partial<Ticket>,
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>,
  setExistingVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
): Promise<void> => {
  const validAreaCode = form?.areaCode || "+1";
  try {
    const res = await fetch(`/api/getVehicle/byPhone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: validAreaCode + phone }),
    });
    const data = await res.json();
    const preFill = data?.result?.data;

    if (preFill) {
      setExistingVehicles(preFill?.vehicles || []);
      const damaged = (data?.data?.damagedParts[0] as CarPart[]) || [];

      // ← normalize the incoming phone (e.g., "+18044845620")
      const { areaCode, phoneNumber } = splitPhone(
        preFill?.phoneNumber,
        form?.areaCode || "+1"
      );

      const initial = {
        patronId: preFill?.patronId,
        areaCode, // e.g. "+1"
        phoneNumber, // e.g. "8044845620" (last 10)
        firstName: preFill?.firstName,
        lastName: preFill?.lastName,
        placeToVisit: preFill?.placeToVisit,
        ticketNumber: form?.ticketNumber,
        vehicles: preFill?.vehicles || [],
        pin: "",
        damagedParts: damaged,
        // buildDamageStatus: {},
      };

      setForm(initial);
    }
  } catch (err) {
    console.error("Failed to fetch user data:", err);
  }
};
