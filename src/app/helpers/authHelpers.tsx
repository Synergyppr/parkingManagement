import Swal from "sweetalert2";
import { leaveGroup } from "../lib/SignalRProvider";

export const handleLogout = ({
  propertyId,
  setPropertyId,
  setPropertyName,
  setAccountUser,
  router,
}: {
  propertyId: string | null;
  setPropertyId: (id: string | null) => void;
  setPropertyName: (id: string | null) => void;
  setAccountUser: (id: string | null) => void;
  router: { replace: (path: string) => void };
}) => {
  Swal.fire({
    title: "Log Out",
    text: "Are you sure you want to log out?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (propertyId) await leaveGroup(propertyId);
      localStorage.clear();
      sessionStorage.clear();
      setPropertyId("");
      setPropertyName("");
      setAccountUser("");
      router.replace("/");
    }
  });
};
