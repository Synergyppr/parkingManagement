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
      className="bg-white rounded-2xl p-5 space-y-4"
    >
      {vehicleData?.surveySubmitted ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <IoCheckmarkOutline className="text-emerald-500 w-7 h-7" />
          </div>
          <p className="font-semibold text-gray-900">
            Thanks for your feedback
            {vehicleData?.firstName ? `, ${vehicleData.firstName}` : ""}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            We truly appreciate your rating and look forward to serving you
            again.
          </p>
        </div>
      ) : (
        <>
          <p className="font-semibold text-gray-900">Rate Your Experience</p>
          <div className="flex justify-center space-x-1">
            {[...Array(5)]?.map((_, starIndex) => {
              const fullValue = starIndex + 1;
              const halfValue = starIndex + 0.5;

              return (
                <div key={starIndex} className="relative w-7 h-7">
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
                      <BsStarFill className="text-amber-400 w-6 h-6" />
                    ) : hoveredStars >= halfValue ? (
                      <BsStarHalf className="text-amber-400 w-6 h-6" />
                    ) : (
                      <BsStar className="text-gray-300 w-6 h-6" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            placeholder="Leave a comment (optional)"
            rows={3}
            disabled={submitted}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button
            type="button"
            onClick={(e) => handleSubmitRating(e)}
            disabled={submitted}
            className={`w-full h-11 font-semibold rounded-xl transition-colors text-sm cursor-pointer ${
              submitted
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            Submit Rating
          </button>
        </>
      )}
    </div>
  );
};
export default ClientRating;
