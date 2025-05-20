"use client";

import { useEffect, useState } from "react";
import TabNavigation from "@/app/components/TabNavigation";
import ReceiveForm from "@/app/components/ReceiveForm";
import {
  Vehicle,
  VehicleApiResponse,
  CarBrand,
  DropdownOption,
} from "@/app/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("receive");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DropdownOption[]>([]);
  const [vehicleColors, setVehicleColors] = useState<DropdownOption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: "be93637a-fc6e-4477-79f6-08dd93acf26b",
        }),
      });

      const data: VehicleApiResponse = await res.json();
      console.log("Data from API:", data);
      setVehicles(data.tickets);
      setCarBrands(data.carBrands);
      setVehicleTypes(data.vehicleTypes);
      setVehicleColors(data.vehicleColors);
    };

    fetchData();
  }, []);

  const filteredVehicles = vehicles?.filter((vehicle) => {
    if (activeTab === "receive")
      return vehicle.status === "" || vehicle.status === "receive";
    return vehicle.status === activeTab;
  });

  return (
    <section className="w-full max-w-screen-xl mx-auto mt-4 px-2 sm:px-4">
      <TabNavigation selected={activeTab} onSelect={setActiveTab} />

      <div className="mt-4">
        {activeTab === "receive" && (
          <ReceiveForm
            carBrands={carBrands}
            vehicleTypes={vehicleTypes}
            vehicleColors={vehicleColors}
          />
        )}

        {activeTab !== "receive" && (
          <div className="space-y-3">
            {filteredVehicles?.length > 0 ? (
              filteredVehicles?.map((vehicle) => (
                <div
                  key={vehicle.ticketNumber}
                  className="p-4 bg-white shadow rounded-md"
                >
                  <h4 className="font-semibold">
                    {vehicle.firstName} {vehicle.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Ticket: {vehicle.ticketNumber} | Type: {vehicle.type} |
                    Color: {vehicle.color}
                  </p>
                  <p className="text-sm text-gray-400">
                    Status: {vehicle.status || "Pending"} | Time:{" "}
                    {new Date(vehicle.createdDateTime).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No vehicles in this status.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
