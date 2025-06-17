const CarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="#ef6c00"
    className="absolute -top-8"
  >
    <path d="M5 11H19L17.5 6.5C17.22 5.67 16.45 5.12 15.59 5.05H8.41C7.55 5.12 6.78 5.67 6.5 6.5L5 11ZM19 13H5C4.45 13 4 13.45 4 14V18C4 18.55 4.45 19 5 19H6C6.55 19 7 18.55 7 18V17H17V18C17 18.55 17.45 19 18 19H19C19.55 19 20 18.55 20 18V14C20 13.45 19.55 13 19 13ZM7.5 16C6.67 16 6 15.33 6 14.5C6 13.67 6.67 13 7.5 13C8.33 13 9 13.67 9 14.5C9 15.33 8.33 16 7.5 16ZM16.5 16C15.67 16 15 15.33 15 14.5C15 13.67 15.67 13 16.5 13C17.33 13 18 13.67 18 14.5C18 15.33 17.33 16 16.5 16Z" />
  </svg>
);

const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const statuses = ["received", "parked", "requested", "ready"];

  return (
    <div className="flex justify-between items-center mt-10 px-6 relative">
      {statuses?.map((status, index) => (
        <div key={status} className="flex flex-col items-center w-1/4 relative">
          <div
            className={`${
              currentStatus === status ? "bg-[#ef6c00]" : "bg-gray-700"
            } w-5 h-5 rounded-full border-2 border-white  flex items-center justify-center relative z-10`}
          >
            {currentStatus === status && <CarIcon />}
          </div>
          <span className="mt-2 text-xs text-gray-600 capitalize tracking-tight">
            {status}
          </span>
          {index < statuses?.length - 1 && (
            <div className="absolute top-2 mx-auto left-[95%] w-full h-0.5 bg-gray-500 z-0 -translate-x-1/2"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusTimeline;
