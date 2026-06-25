import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";
import { IoCheckmarkOutline } from "react-icons/io5";
import { VehicleData } from "../types";

const ClientRating = ({
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
      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
    >
      {vehicleData?.surveySubmitted ? (
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
            <IoCheckmarkOutline className="h-8 w-8 text-emerald-500" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-slate-950">
            Thanks for your feedback
            {vehicleData?.firstName ? `, ${vehicleData.firstName}` : ""}!
          </h3>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
            We truly appreciate your rating and look forward to serving you
            again.
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-slate-200 bg-gradient-to-br from-white via-amber-50/50 to-white p-6 text-center">
            <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
              Guest Feedback
            </span>

            <h3 className="mt-3 font-serif text-3xl font-bold text-slate-950">
              Rate Your Experience
            </h3>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Your feedback helps us deliver a more premium valet experience.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex justify-center gap-2">
              {[...Array(5)]?.map((_, starIndex) => {
                const fullValue = starIndex + 1;
                const halfValue = starIndex + 0.5;

                return (
                  <div key={starIndex} className="relative h-10 w-10">
                    <div
                      className="absolute left-0 top-0 z-10 h-full w-1/2 cursor-pointer"
                      onMouseEnter={() => handleMouseEnter(starIndex, true)}
                      onClick={() => handleStarClick(starIndex, true)}
                    />

                    <div
                      className="absolute right-0 top-0 z-10 h-full w-1/2 cursor-pointer"
                      onMouseEnter={() => handleMouseEnter(starIndex, false)}
                      onClick={() => handleStarClick(starIndex, false)}
                    />

                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100 transition">
                      {hoveredStars >= fullValue ? (
                        <BsStarFill className="h-7 w-7 text-amber-500 drop-shadow-sm" />
                      ) : hoveredStars >= halfValue ? (
                        <BsStarHalf className="h-7 w-7 text-amber-500 drop-shadow-sm" />
                      ) : (
                        <BsStar className="h-7 w-7 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="Leave a comment (optional)"
              rows={3}
              disabled={submitted}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              type="button"
              onClick={(e) => handleSubmitRating(e)}
              disabled={submitted}
              className={`flex h-13 w-full items-center justify-center rounded-2xl text-sm font-black transition ${
                submitted
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "cursor-pointer bg-amber-500 text-white shadow-[0_16px_36px_rgba(214,168,0,0.32)] hover:bg-amber-600"
              }`}
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