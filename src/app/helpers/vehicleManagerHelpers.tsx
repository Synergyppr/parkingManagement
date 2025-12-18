// Vehicles CRUD
// const fetchManageVehicles = async (form: { patronId: string }) => {
//   if (!form?.patronId) {
//     Swal.fire({
//       icon: "error",
//       title: "Manage Vehicles Failed",
//       text: "Patron ID is missing. Cannot manage vehicles.",
//     });
//     return;
//   }

//   try {
//     const res = await fetch("/api/bulkVehicles", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...form }),
//     });

//     const result = await res.json();


//     if (result?.result?.status === "200") {
//       // await fetchData(); // refresh the data from the API
//       router.refresh();
//       Swal.fire({
//         icon: "success",
//         title: "Manage Vehicles Successful",
//         text: "Vehicle list updated successfully.",
//         showConfirmButton: false,
//         timer: 1500,
//       });
//     } else {
//       Swal.fire({
//         icon: "error",
//         title: "Manage Vehicles Failed",
//         text:
//           result?.message || "Something went wrong. Please try again later.",
//       });
//       console.log("Error: Unexpected response:", result);
//       Swal.fire({
//         icon: "error",
//         title: "Submission Failed",
//         text: result?.message || "Something went wrong. Please try again.",
//         html: `<p>${
//           result?.message || "Something went wrong. Please try again."
//         }</p><pre style="text-align: left; white-space: pre-wrap; background: #f5f5f5; padding: 6px; border-radius: 4px;">${JSON.stringify(
//           manageVehicleSettings,
//           null,
//           2
//         )}</pre>`,
//       });
//     }
//   } catch (error) {
//     console.error("Error managing vehicles:", error);
//   }
// };

// Delete vehicle from existingVehicles list (in manageMode on)
// const handleDeleteVehicle = async (vehicleId: string) => {
//   Swal.fire({
//     title: "Delete Vehicle",
//     text: "Are you sure you want to delete this vehicle from the list?",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonText: "Yes, delete it!",
//     cancelButtonText: "No, keep it",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       const updatedVehicles = existingVehicles.filter(
//         (v) => v.id !== vehicleId
//       );
//       setExistingVehicles(updatedVehicles);

//       const sendForm = {
//         ...manageVehicleSettings,
//         deletes: [...manageVehicleSettings.deletes, vehicleId],
//         patronId: form?.patronId || "",
//       };

//       setManageVehicleSettings((prev) => ({
//         ...prev,
//         sendForm,
//       }));
//       fetchManageVehicles(sendForm);
//     }
//   });
// };
