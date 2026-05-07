"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type QRScannerState =
  | "idle"
  | "requesting"
  | "scanning"
  | "success"
  | "error";

export type UseQRScannerOptions = {
  onDetected: (qrData: string) => void;
  scanInterval?: number;
};

export type UseQRScannerReturn = {
  state: QRScannerState;
  errorMessage: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  start: () => Promise<void>;
  stop: () => void;
};

export function useQRScanner({
  onDetected,
  scanInterval = 200,
}: UseQRScannerOptions): UseQRScannerReturn {
  const [state, setState] = useState<QRScannerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectedRef.current = false;
    setState("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
      }
    };
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && !detectedRef.current) {
      detectedRef.current = true;
      setState("success");
      stop();
      onDetected(code.data);
    }
  }, [onDetected, stop]);

  const start = useCallback(async () => {
    setErrorMessage("");
    detectedRef.current = false;
    setState("requesting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Trình duyệt không hỗ trợ truy cập camera.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("scanning");

      intervalRef.current = setInterval(scanFrame, scanInterval);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "Không tìm thấy camera trên thiết bị này."
            : "Không thể khởi động camera. Vui lòng thử lại.";

      setErrorMessage(message);
      setState("error");
    }
  }, [scanFrame, scanInterval]);

  return { state, errorMessage, videoRef, canvasRef, start, stop };
}
