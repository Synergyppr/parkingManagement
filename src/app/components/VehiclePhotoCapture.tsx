"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
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
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
    return () => {
      if (!cameraOpen) stopStream();
    };
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

        setCapturedPhotos((prev) => {
          const updated = [...prev, newPhoto];
          return updated;
        });

        setCapturing(false);

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
    <div className="w-full mt-3">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600 font-medium text-sm"
      >
        <MdCameraAlt className="text-xl" />
        Take Vehicle Photos
        {photos.length > 0 && (
          <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold">
            {photos.length}
          </span>
        )}
      </button>

      {/* Thumbnails */}
      {capturedPhotos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {capturedPhotos.map((photo) => (
            <div
              key={photo.previewUrl}
              className="relative rounded-lg overflow-hidden aspect-video bg-black border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt="Vehicle photo"
                className="w-full h-full object-cover"
              />

              {photo.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <FaSpinner className="text-white text-lg animate-spin" />
                </div>
              )}

              {photo.error && (
                <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center p-1">
                  <span className="text-white text-[9px] text-center leading-tight">
                    {photo.error}
                  </span>
                </div>
              )}

              {!photo.uploading && !photo.error && photo.blobUrl && (
                <div className="absolute top-1 left-1 bg-green-500 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">✓</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(photo.previewUrl)}
                className="cursor-pointer absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5"
                aria-label="Remove photo"
              >
                <MdDeleteOutline className="text-white text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-white text-sm font-semibold">
              {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? "s" : ""} captured
            </span>
            <button
              type="button"
              onClick={handleFlip}
              className="cursor-pointer text-white p-2 rounded-full bg-white/20 hover:bg-white/30"
              aria-label="Flip camera"
            >
              <MdFlipCameraAndroid className="text-xl" />
            </button>
          </div>

          {/* Camera view */}
          <div className="flex-1 relative overflow-hidden">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <MdCameraAlt className="text-white/40 text-6xl" />
                <p className="text-white/80 text-sm">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Capture flash effect */}
            {capturing && (
              <div className="absolute inset-0 bg-white/60 pointer-events-none" />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-8 py-6">
            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              aria-label="Close camera"
            >
              <MdClose className="text-white text-2xl" />
            </button>

            {/* Shutter */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={!!cameraError || capturing}
              className="cursor-pointer w-16 h-16 rounded-full bg-white border-4 border-white/60 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
              aria-label="Take photo"
            />

            {/* Spacer to balance layout */}
            <div className="w-12" />
          </div>
        </div>
      )}

      {/* Off-screen canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
