import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";
import { IoCheckmarkOutline } from "react-icons/io5";
import { VehicleData } from "../types";

const ClientRating = ({
  // rating,
  hoveredStars,
  handleMouseEnter,
  handleStarClick,
  handleSubmitRating,
  comment,
  setComment,
  submitted,
  ratingSectionRef,
  vehicleData,
}: {
  // rating: number;
  hoveredStars: number;
  handleMouseEnter: (starIndex: number, isHalf: boolean) => void;
  handleStarClick: (starIndex: number, isHalf: boolean) => void;
  handleSubmitRating: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  submitted: boolean;
  ratingSectionRef: React.RefObject<HTMLDivElement>;
  vehicleData: VehicleData;
}) => {
  return (
    <div
      ref={ratingSectionRef}
      className={`${
        submitted ? "opacity-50" : ""
      } border-t border-gray-200 pt-0`}
    >
      <hr className="border-gray-300 my-4" />

      {vehicleData?.surveySubmitted ? (
        <div
          className="flex flex-col items-center justify-center mt-6 px-4 py-8 rounded-xl shadow-inner transition-all duration-500 bg-opacity-80"
          style={{
            background: "radial-gradient(circle at center, #E2E8F0, #CBD5E1)",
          }}
        >
          <div
            className="w-16 h-16 mb-3 rounded-full p-2 flex items-center justify-center border border-orange-500 shadow-md"
            style={{
              background: "linear-gradient(135deg, #ff9800, #ef6c00)", // vibrant orange gradient
            }}
          >
            <IoCheckmarkOutline className="text-white w-10 h-10" />
          </div>{" "}
          <h3 className="text-lg font-semibold text-slate-700 text-center tracking-tight leading-5">
            Thank you for your feedback
            {vehicleData?.firstName ? `, ${vehicleData.firstName}` : ""}!
          </h3>
          <p className="text-slate-600 text-sm text-center mt-1">
            We truly appreciate your rating and look forward to serving you
            again.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-center text-lg text-gray-700 mb-2 font-bold tracking-tighter italic">
            How was your experience?
          </h2>
          <div className="flex justify-center space-x-1">
            {[...Array(5)]?.map((_, starIndex) => {
              const fullValue = starIndex + 1;
              const halfValue = starIndex + 0.5;

              return (
                <div key={starIndex} className="relative w-6 h-6">
                  {/* Left Half */}
                  <div
                    className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    onMouseEnter={() => handleMouseEnter(starIndex, true)}
                    onClick={() => handleStarClick(starIndex, true)}
                  ></div>

                  {/* Right Half */}
                  <div
                    className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    onMouseEnter={() => handleMouseEnter(starIndex, false)}
                    onClick={() => handleStarClick(starIndex, false)}
                  ></div>

                  {/* Icon Layer */}
                  <div className="z-0 flex justify-center items-center w-full h-full">
                    {hoveredStars >= fullValue ? (
                      <BsStarFill className="text-blue-600 w-5 h-5" />
                    ) : hoveredStars >= halfValue ? (
                      <BsStarHalf className="text-blue-600 w-5 h-5" />
                    ) : (
                      <BsStar className="text-primary w-5 h-5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mx-5">
            <textarea
              className="mt-4 w-full p-2 border border-gray-300 rounded"
              placeholder="Leave a comment (optional)"
              rows={3}
              disabled={submitted}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="flex mt-4 justify-center">
            <button
              type="button"
              onClick={(e) => handleSubmitRating(e)}
              disabled={submitted}
              className={`${
                submitted
                  ? "bg-blue-600/20 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
              } transition-colors text-white px-3 py-2 w-[95%] font-semibold shadow-md tracking-tight rounded cursor-pointer`}
            >
              Submit Rating
            </button>
          </div>
        </>
      )}
    </div>
  );
};
export default ClientRating;
