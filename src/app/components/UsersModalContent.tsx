"use client";

import { useState } from "react";
import Modal from "./Modal";
import { FaPencil, FaPlus } from "react-icons/fa6";
import UserForm from "./UserForm";
import Tabs from "./elements/Tabs";

interface User {
  id: string;
  role: string;
  userName: string;
  fullName: string;
  gender: string;
  identifier: string;
  isActive: boolean;
  createdDateTime: string;
}

interface UserFormData {
  id: string;
  tenantId: string;
  role: number;
  userName: string;
  pin: string;
  firstName: string;
  lastName: string;
  gender: string;
  identifier: string;
  dateOfBirthDateTime: string;
  isActive: boolean;
}

interface Props {
  tenantId?: string;
  users: User[] | null;
  onClose: () => void;
  isOpen: boolean;
}

export default function UsersModalContent({
  tenantId,
  users,
  isOpen,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState("Active");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#ef6c00] tracking-tight">
            Users
          </h2>
          <button
            onClick={() => {
              setSelectedUser(null);
              setIsUserFormOpen(true);
            }}
            className="cursor-pointer px-2.5 py-1 rounded-lg text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600/80 hover:shadow-md delay-300 duration-700 transition-colors text-white"
          >
            <FaPlus className="inline w-3 h-3" />
          </button>
        </div>

        <Tabs
          isSmallScreen={false}
          tabs={["Active", "Inactive"]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setTransitionState={setTransitionState}
        />

        {users?.filter((user) =>
          activeTab === "Active" ? user?.isActive : !user?.isActive
        ).length === 0 ? (
          <div className="text-gray-500 mt-0 min-h-[80px] flex items-center text-center w-full justify-center m-auto tracking-tight italic border border-gray-400 rounded-b-sm">
            No {activeTab?.toLowerCase()} users found.
          </div>
        ) : (
          <div
            className={`transition-opacity duration-300 border rounded-b-md ${
              activeTab ? "border-blue-600" : "border-gray-600"
            } ${transitionState === "fade-out" ? "opacity-0" : "opacity-100"}`}
          >
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 text-gray-200 p-1 rounded-sm">
              {users
                ?.filter((user) =>
                  activeTab === "Active" ? user?.isActive : !user?.isActive
                )
                ?.map((user) => (
                  <li
                    key={user?.id}
                    className="p-4 text-sm flex flex-col gap-[2px] text-gray-700"
                  >
                    <p>
                      <strong className="text-gray-800 tracking-tight">
                        Name:
                      </strong>{" "}
                      {user?.fullName}
                    </p>
                    <p>
                      <strong className="text-gray-800 tracking-tight">
                        Username:
                      </strong>{" "}
                      {user?.userName}
                    </p>
                    <p>
                      <strong className="text-gray-800 tracking-tight">
                        Role:
                      </strong>{" "}
                      {user?.role}
                    </p>
                    <p>
                      <strong className="text-gray-800 tracking-tight">
                        Gender:
                      </strong>{" "}
                      {user?.gender}
                    </p>
                    {user?.identifier && (
                      <p>
                        <strong className="text-gray-800 tracking-tight">
                          Identifier:
                        </strong>{" "}
                        {user?.identifier}
                      </p>
                    )}

                    <p className="text-xs text-gray-600">
                      Created:{" "}
                      <span className="text-gray-600">
                        {new Date(user?.createdDateTime).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <div className="flex flex-end justify-end-safe">
                      <button
                        onClick={() => {
                          setSelectedUser({
                            id: user?.id,
                            tenantId: "",
                            role: user?.role === "Admin" ? 1 : 2, // 1 is Admin and 2 is General
                            userName: user?.userName,
                            pin: "",
                            firstName: user?.fullName?.split(" ")[0] || "",
                            lastName: user?.fullName?.split(" ")[1] || "",
                            gender: user?.gender,
                            identifier: user?.identifier,
                            dateOfBirthDateTime: "",
                            isActive: user?.isActive,
                          });
                          setIsUserFormOpen(true);
                        }}
                        className="text-sm py-1 px-3 rounded-md text-white bg-blue-600"
                      >
                        <FaPencil className="inline" />
                      </button>
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
        <UserForm
          tenantId={tenantId}
          initialData={selectedUser ?? null}
          setModalOpen={setIsUserFormOpen}
        />
      </Modal>
    </>
  );
}
