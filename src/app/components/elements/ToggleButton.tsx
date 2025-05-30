interface ToggleButtonProps {
  data: any;
  onToggle: (value: boolean, name: string) => void;
  title?: string;
  name?: string;
  value: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  data,
  onToggle,
  title,
  name,
  value,
}) => {
  return (
    <div>
      {title && (
        <div className="font-bold tracking-tight mt-4 mb-2">{title}</div>
      )}
      <div
        className="relative flex items-center justify-between w-14 h-8 cursor-pointer"
        onClick={() => onToggle(data, name || "")}
      >
        <div
          className={`absolute w-full h-full rounded-full transition-all duration-300 ${
            value ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <div
          className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
            value ? "translate-x-[28px]" : "translate-x-[5px]"
          }`}
        />
      </div>
    </div>
  );
};

export default ToggleButton;
