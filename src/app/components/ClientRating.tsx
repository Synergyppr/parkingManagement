import { BsStar, BsStarFill } from "react-icons/bs";
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
  handleMouseEnter: (starIndex: number) => void;
  handleStarClick: (starIndex: number) => void;
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
      className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
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
          <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)] to-white p-6 text-center">
            <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
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

                return (
                  <div
                    key={starIndex}
                    className="h-10 w-10 cursor-pointer"
                    onMouseEnter={() => handleMouseEnter(starIndex)}
                    onClick={() => handleStarClick(starIndex)}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-(--primary-soft) ring-1 ring-(--primary-light) transition">
                      {hoveredStars >= fullValue ? (
                        <BsStarFill className="h-7 w-7 text-primary drop-shadow-sm" />
                      ) : (
                        <BsStar className="h-7 w-7 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition 
              placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-(--primary-soft) disabled:bg-slate-50 disabled:text-slate-400"
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
                  : "cursor-pointer bg-primary text-white shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-secondary"
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