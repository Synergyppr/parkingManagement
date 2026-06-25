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

  const filteredUsers =
    users?.filter((user) =>
      activeTab === "Active" ? user?.isActive : !user?.isActive
    ) || [];

  const handleCloseModal = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="overflow-hidden rounded-4xl bg-white">
          <div className="border-b border-slate-200 bg-linear-to-br from-white via-amber-50/60 to-white px-5 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
                  User Directory
                </span>

                <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-950">
                  Users
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage employee accounts, permissions, and active status.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setIsUserFormOpen(true);
                }}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)] transition hover:bg-amber-600"
                title="Add User"
              >
                <FaUserPlus className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Showing
                </p>
                <p className="text-sm font-extrabold text-slate-950">
                  {filteredUsers.length} {activeTab.toLowerCase()} users
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                {activeTab}
              </span>
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 py-4">
            <Tabs
              isSmallScreen={false}
              tabs={["Active", "Inactive"]}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setTransitionState={setTransitionState}
            />
          </div>

          <div className="p-5">
            {filteredUsers.length === 0 ? (
              <div className="flex min-h-45 flex-col items-center justify-center rounded-4xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                  <FaUserPlus className="h-5 w-5" />
                </div>

                <p className="font-serif text-xl font-bold text-slate-950">
                  No {activeTab.toLowerCase()} users found.
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add a new user or switch tabs to view another status.
                </p>
              </div>
            ) : (
              <div
                className={`transition-all duration-500 ease-in-out ${
                  transitionState === "fade-out"
                    ? "scale-95 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              >
                <ul className="grid max-h-[62vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredUsers.map((user) => (
                    <li
                      key={user?.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-200 hover:bg-amber-50/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-linear-to-br from-amber-50/80 to-white px-4 py-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-extrabold text-slate-950">
                            {user.fullName}
                          </h3>

                          <p className="mt-1 text-xs font-bold capitalize text-amber-700">
                            {user.role}
                          </p>
                        </div>

                        <button
                          type="button"
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
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-500 hover:text-white"
                          title="Edit User"
                        >
                          <FaPencil className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2 bg-slate-50/70 p-4 text-sm">
                        <InfoRow label="Username" value={user.userName} />

                        <InfoRow
                          label="Gender"
                          value={user.gender}
                          capitalize
                        />

                        <InfoRow
                          label="DOB"
                          value={
                            user?.dateOfBirth
                              ? formatDateOfBirth(user?.dateOfBirth)
                              : "—"
                          }
                        />

                        {user?.identifier && (
                          <InfoRow label="Identifier" value={user.identifier} />
                        )}

                        <div className="pt-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Created
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
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
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-red-50 text-red-700 ring-red-200"
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
          </div>
        </div>
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
          setModalOpen={(isOpen) => {
            if (!isOpen) handleCloseModal();
          }}
          refresh={refresh}
        />
      </Modal>
    </>
  );
}

function InfoRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value?: string | number | null;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold text-slate-700 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}