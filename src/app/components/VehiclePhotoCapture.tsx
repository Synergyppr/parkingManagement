"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MdCameraAlt,
  MdDeleteOutline,
  MdFlipCameraAndroid,
  MdClose,
} from "react-icons/md";
import { FaSpinner } from "react-icons/fa";

interface CapturedPhoto {
  previewUrl: string;
  blobUrl: string | null;
  uploading: boolean;
  error: string | null;
}

interface VehiclePhotoCaptureProps {
  photos: string[];
  onPhotoUrlsChange: (urls: string[]) => void;
}

export default function VehiclePhotoCapture({
  photos,
  onPhotoUrlsChange,
}: VehiclePhotoCaptureProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewStripRef = useRef<HTMLDivElement>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: "environment" | "user") => {
      stopStream();
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // autoPlay fallback — ignored if already playing
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera permission and try again."
            : "Unable to access camera on this device.";
        setCameraError(msg);
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (cameraOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const handleFlip = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setCapturing(false);
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const newPhoto: CapturedPhoto = {
          previewUrl,
          blobUrl: null,
          uploading: true,
          error: null,
        };

        setCapturedPhotos((prev) => [...prev, newPhoto]);
        setCapturing(false);

        // Scroll preview strip to the end after adding
        setTimeout(() => {
          previewStripRef.current?.scrollTo({
            left: previewStripRef.current.scrollWidth,
            behavior: "smooth",
          });
        }, 100);

        // Upload to Azure Blob
        try {
          const form = new FormData();
          form.append("file", blob, `vehicle-${Date.now()}.jpg`);
          form.append("side", `photo-${Date.now()}`);

          const res = await fetch("/api/vehiclePhotos/upload", {
            method: "POST",
            body: form,
          });

          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          const blobUrl: string = data.url;

          setCapturedPhotos((prev) => {
            const updated = prev.map((p) =>
              p.previewUrl === previewUrl
                ? { ...p, blobUrl, uploading: false }
                : p
            );
            onPhotoUrlsChange(
              updated.map((p) => p.blobUrl).filter(Boolean) as string[]
            );
            return updated;
          });
        } catch {
          setCapturedPhotos((prev) =>
            prev.map((p) =>
              p.previewUrl === previewUrl
                ? { ...p, uploading: false, error: "Upload failed" }
                : p
            )
          );
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const handleRemove = (previewUrl: string) => {
    setCapturedPhotos((prev) => {
      const updated = prev.filter((p) => {
        if (p.previewUrl === previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
          return false;
        }
        return true;
      });
      onPhotoUrlsChange(
        updated.map((p) => p.blobUrl).filter(Boolean) as string[]
      );
      return updated;
    });
  };

  const handleClose = () => {
    setCameraOpen(false);
  };

  return (
    <div className="mt-3 w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
      >
        <MdCameraAlt className="text-xl" />
        Take Vehicle Photos
        {photos.length > 0 && (
          <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {photos.length}
          </span>
        )}
      </button>

      {/* Thumbnails outside camera */}
      {capturedPhotos.length > 0 && !cameraOpen && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {capturedPhotos.map((photo) => (
            <div
              key={photo.previewUrl}
              className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt="Vehicle photo"
                className="h-full w-full object-cover"
              />

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <FaSpinner className="animate-spin text-lg text-white" />
                </div>
              )}

              {photo.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 p-1">
                  <span className="text-center text-[9px] leading-tight text-white">
                    {photo.error}
                  </span>
                </div>
              )}

              {!photo.uploading && !photo.error && photo.blobUrl && (
                <div className="absolute left-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500">
                  <span className="text-[8px] font-bold text-white">✓</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(photo.previewUrl)}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-red-500 p-0.5 hover:bg-red-600"
                aria-label="Remove photo"
              >
                <MdDeleteOutline className="text-xs text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen camera — portaled above everything */}
      {cameraOpen &&
        createPortal(
          <div className="fixed inset-0 z-999999 flex flex-col bg-black">
            {/* Camera viewfinder */}
            <div className="relative flex-1 overflow-hidden">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <MdCameraAlt className="text-6xl text-white/40" />
                  <p className="text-sm text-white/80">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              )}

              {/* Capture flash */}
              {capturing && (
                <div className="pointer-events-none absolute inset-0 bg-white/60" />
              )}

              {/* Close — top-left */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute left-3 top-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
                aria-label="Close camera"
              >
                <MdClose className="text-lg" />
                Done
              </button>

              {/* Flip — top-right */}
              <button
                type="button"
                onClick={handleFlip}
                className="absolute right-3 top-3 cursor-pointer rounded-full bg-black/50 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/70"
                aria-label="Flip camera"
              >
                <MdFlipCameraAndroid className="text-xl" />
              </button>
            </div>

            {/* Photo preview strip */}
            {capturedPhotos.length > 0 && (
              <div className="border-t border-white/10 bg-black/90 px-3 py-2">
                <div
                  ref={previewStripRef}
                  className="flex gap-2 overflow-x-auto"
                >
                  {capturedPhotos.map((photo) => (
                    <div
                      key={photo.previewUrl}
                      className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-white/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt="Captured"
                        className="h-full w-full object-cover"
                      />

                      {photo.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <FaSpinner className="animate-spin text-sm text-white" />
                        </div>
                      )}

                      {photo.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/70">
                          <span className="text-[8px] text-white">!</span>
                        </div>
                      )}

                      {!photo.uploading && !photo.error && photo.blobUrl && (
                        <div className="absolute bottom-0.5 left-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                          <span className="text-[7px] font-bold text-white">
                            ✓
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemove(photo.previewUrl)}
                        className="absolute right-0.5 top-0.5 cursor-pointer rounded-full bg-red-500/90 p-0.5 transition hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        <MdDeleteOutline className="text-[10px] text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="safe-area-bottom flex items-center justify-center bg-black px-8 py-5">
              {/* Shutter button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!cameraError || capturing}
                className="h-18 w-18 cursor-pointer rounded-full border-[5px] border-white/70 bg-white transition-transform active:scale-90 disabled:opacity-40"
                aria-label="Take photo"
              >
                <span className="block h-full w-full rounded-full bg-white" />
              </button>
            </div>

            {/* Photo count badge */}
            {capturedPhotos.length > 0 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {capturedPhotos.length} photo
                  {capturedPhotos.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Off-screen canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
