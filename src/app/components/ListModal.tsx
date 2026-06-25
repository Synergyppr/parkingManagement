"use client";
import { useState, ReactNode } from "react";
import { getUserById } from "../helpers/propertyHelpers";
import { UserForm as UserFormType } from "../types";
import { FaPlus } from "react-icons/fa6";
import Modal from "./Modal";
import Tabs from "./elements/Tabs";

interface EntityListModalProps<T> {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  originalEntities: T[] | null;
  entities: T[] | null;
  activeTabs?: string[];
  renderItem: (item: T, onEdit: (item: T) => void) => ReactNode;
  FormComponent: React.ComponentType<{
    data: T | null;
    originalData?: T;
    onClose: (form?: string) => void;
    refresh: (id: string) => void;
    tenantId?: string;
  }>;
  tenantId?: string;
  refresh: (id: string) => void;
  filterFn?: (item: T, activeTab: string) => boolean;
  emptyMessage?: string;
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
  selectedEntity: T | null;
  setSelectedEntity: (entity: T | null) => void;
  handleCloseForm: (form?: string) => void;
}

export default function ListModal<
  T extends { id: string; isActive: boolean } | UserFormType
>({
  title,
  isOpen,
  onClose,
  originalEntities,
  entities,
  renderItem,
  FormComponent,
  tenantId,
  refresh,
  filterFn,
  isFormOpen,
  setIsFormOpen,
  selectedEntity,
  setSelectedEntity,
  handleCloseForm,
  activeTabs = ["Active", "Inactive"],
  emptyMessage = "No records found.",
}: EntityListModalProps<T>) {
  const [activeTab, setActiveTab] = useState(activeTabs[0]);
  const [transitionState, setTransitionState] = useState("fade-in");
  const [, setLoading] = useState(false);

  const originalSelectedEntity = originalEntities?.find(
    (item) => selectedEntity?.id === item?.id
  );

  const filteredEntities = Array.isArray(entities)
    ? entities.filter((item) => (filterFn ?? (() => true))(item, activeTab))
    : [];

  const fetchUserDetails = (item: T | { id: string }): void => {
    if (title === "Users") {
      getUserById(
        item?.id as string,
        setLoading,
        setIsFormOpen,
        setSelectedEntity as (user: UserFormType) => void
      );
    } else {
      setSelectedEntity(item as T);
      setIsFormOpen(true);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="mt-2 flex max-h-[90dvh] flex-col overflow-hidden rounded-4xl bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-linear-to-br from-white via-amber-50/60 to-white px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 shadow-sm">
                  Directory
                </span>

                <h2 className="mt-2 truncate font-serif text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h2>

                <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  Manage active and inactive records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedEntity(null);
                  setIsFormOpen(true);
                }}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-amber-500 text-white relative top-6
                shadow-[0_10px_24px_rgba(214,168,0,0.24)] transition hover:bg-amber-600"
                title={`Add ${title}`}
              >
                <FaPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Showing
                </p>
                <p className="text-xs font-extrabold text-slate-950">
                  {filteredEntities.length} records
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-200">
                {activeTab}
              </span>
            </div>
          </div>

          {activeTabs?.length > 1 && (
            <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-5">
              <Tabs
                isSmallScreen
                tabs={activeTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setTransitionState={setTransitionState}
              />
            </div>
          )}

          <div className="min-h-0 flex-1 p-3 sm:p-4">
            {filteredEntities.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 
              p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                  <FaPlus className="h-4 w-4" />
                </div>

                <p className="font-serif text-lg font-bold text-slate-950">
                  {emptyMessage}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add a new record or switch tabs.
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
                <ul className="grid max-h-[64vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 pb-28">
                  {filteredEntities.map((item, index) => (
                    <li
                      key={index}
                      className="min-w-0 [&>div]:rounded-2xl! [&>div]:p-3!  [&_h3]:text-base! [&_h3]:leading-tight! [&_p]:text-xs! [&_p]:leading-5!
                      [&_button]:text-xs!"
                    >
                      {renderItem(item, (item) => fetchUserDetails(item))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isFormOpen} onClose={(form) => handleCloseForm(form)}>
        <FormComponent
          tenantId={tenantId}
          originalData={originalSelectedEntity}
          data={selectedEntity}
          onClose={handleCloseForm}
          refresh={refresh}
        />
      </Modal>
    </>
  );
}