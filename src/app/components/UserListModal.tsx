"use client";
import { useState } from "react";
import { FaPencil } from "react-icons/fa6";
import { FaUserPlus } from "react-icons/fa";
import Modal from "./Modal";
import UserFormComponent from "./UserForm";
import Tabs from "./elements/Tabs";
import { UserForm } from "../types/index";
import { formatDateOfBirth } from "../lib/clientUtils";

interface Props {
  tenantId?: string;
  users: UserForm[] | null;
  onClose: () => void;
  isOpen: boolean;
  refresh: (id: string) => void;
}

export default function UserListModal({
  tenantId,
  users,
  isOpen,
  onClose,
  refresh,
}: Props) {
  const [activeTab, setActiveTab] = useState("Active");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForm | null>(null);

  const handleCloseModal = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex justify-between items-center mb-0 border-y-[.5px] border-solid border-gray-800 p-1">
          <h2 className="text-xl font-bold text-black tracking-tight">
            Users
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setIsUserFormOpen(true);
            }}
            className="cursor-pointer px-2.5 py-1 rounded-lg text-sm hover:scale-105 duration-700 transition text-blue-500"
          >
            <FaUserPlus className="inline w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="flex w-full">
            <Tabs
              isSmallScreen={false}
              tabs={["Active", "Inactive"]}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setTransitionState={setTransitionState}
            />
          </div>
        </div>

        {users?.filter((user) =>
          activeTab === "Active" ? user?.isActive : !user?.isActive
        ).length === 0 ? (
          <div className="text-gray-500 mt-0 min-h-[80px] flex items-center text-center w-full justify-center m-auto tracking-tight italic border border-gray-400 rounded-b-sm">
            No {activeTab?.toLowerCase()} users found.
          </div>
        ) : (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              transitionState === "fade-out"
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100"
            } border rounded-b-md ${
              activeTab ? "border-slate-400" : "border-gray-600"
            }`}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-2 p-1">
              {users
                ?.filter((user) =>
                  activeTab === "Active" ? user?.isActive : !user?.isActive
                )
                ?.map((user) => (
                  <li
                    key={user?.id}
                    className="rounded-xl shadow-md bg-white text-gray-800 flex flex-col overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg"
                  >
                    <div className="flex justify-between px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {user.fullName}
                        </h3>
                        <p className="text-xs text-white/80 capitalize">
                          {user.role}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser({
                            id: user?.id,
                            tenantId: "",
                            role: user?.role === "Admin" ? 1 : 2,
                            userName: user?.userName,
                            pin: "",
                            firstName: user?.fullName?.split(" ")[0] || "",
                            lastName: user?.fullName?.split(" ")[1] || "",
                            gender: user?.gender,
                            dateOfBirth: user?.dateOfBirth || "",
                            isActive: user?.isActive,
                          });
                          setIsUserFormOpen(true);
                        }}
                        className="p-2 rounded hover:bg-white/20 transition cursor-pointer"
                        title="Edit User"
                      >
                        <FaPencil className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 text-sm space-y-[0px]">
                      <p>
                        <strong className="text-gray-700">Username:</strong>{" "}
                        {user.userName}
                      </p>
                      <p className="capitalize">
                        <strong className="text-gray-700">Gender:</strong>{" "}
                        {user.gender}
                      </p>
                      <p>
                        <strong className="text-gray-700">DOB:</strong>{" "}
                        {user?.dateOfBirth
                          ? formatDateOfBirth(user?.dateOfBirth)
                          : ""}
                      </p>
                      {user?.identifier && (
                        <p>
                          <strong className="text-gray-700">Identifier:</strong>{" "}
                          {user?.identifier}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        Created:{" "}
                        {new Date(
                          user?.createdDateTime as string
                        ).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isUserFormOpen}
        onClose={() => {
          setIsUserFormOpen(false);
          setSelectedUser(null);
        }}
      >
        <UserFormComponent
          tenantId={tenantId as string}
          data={selectedUser as UserForm}
          onClose={handleCloseModal}
          refresh={refresh}
        />
      </Modal>
    </>
  );
}
