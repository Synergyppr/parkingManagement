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
        <div className="flex justify-between items-center mb-2 border-y-[.5px] border-solid border-gray-800 p-1">
          <h2 className="text-xl font-bold text-black tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedEntity(null);
              setIsFormOpen(true);
            }}
            className="cursor-pointer px-2.5 py-1 rounded-lg text-sm hover:scale-105 duration-700 transition text-blue-500"
          >
            <FaPlus className="inline w-4 h-4" />
          </button>
        </div>

        {activeTabs?.length > 1 && (
          <Tabs
            isSmallScreen={false}
            tabs={activeTabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setTransitionState={setTransitionState}
          />
        )}

        {Array.isArray(entities) &&
        entities?.filter((item) => (filterFn ?? (() => true))(item, activeTab))
          ?.length === 0 ? (
          <p className="text-gray-500 text-center italic min-h-[60px] flex items-center justify-center">
            {emptyMessage}
          </p>
        ) : (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              transitionState === "fade-out"
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100"
            } border rounded-b-md`}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-2 p-1">
              {Array.isArray(entities) &&
                entities
                  ?.filter((item) =>
                    (filterFn ?? (() => true))(item, activeTab)
                  )
                  .map((item, index) => (
                    <li key={index}>
                      {renderItem(item, (item) => fetchUserDetails(item))}
                    </li>
                  ))}
            </ul>
          </div>
        )}
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
