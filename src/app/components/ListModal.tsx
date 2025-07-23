"use client";

import { useState, ReactNode } from "react";
import Modal from "./Modal";
import Tabs from "./elements/Tabs";
import { FaPlus } from "react-icons/fa6";

interface EntityListModalProps<T> {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  entities: T[] | null;
  activeTabs?: string[];
  renderItem: (item: T, onEdit: (item: T) => void) => ReactNode;
  FormComponent: React.ComponentType<{
    data: T | null;
    onClose: () => void;
    refresh: (id: string) => void;
    tenantId?: string;
  }>;
  tenantId?: string;
  refresh: (id: string) => void;
  filterFn?: (item: T, activeTab: string) => boolean;
  emptyMessage?: string;
}

export default function ListModal<T>({
  title,
  isOpen,
  onClose,
  entities,
  renderItem,
  FormComponent,
  tenantId,
  refresh,
  filterFn,
  activeTabs = ["Active", "Inactive"],
  emptyMessage = "No records found.",
}: EntityListModalProps<T>) {
  const [activeTab, setActiveTab] = useState(activeTabs[0]);
  const [transitionState, setTransitionState] = useState("fade-in");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntity(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseForm}>
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
                      {renderItem(item, (item) => {
                        setSelectedEntity(item);
                        setIsFormOpen(true);
                      })}
                    </li>
                  ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm}>
        <FormComponent
          tenantId={tenantId}
          data={selectedEntity}
          onClose={handleCloseForm}
          refresh={refresh}
        />
      </Modal>
    </>
  );
}
