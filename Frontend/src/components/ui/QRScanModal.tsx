import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { Upload, X, QrCode, Camera } from "lucide-react";
import { decodeQR, QRDecodeResponseData } from "@/features/bank/api";

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: QRDecodeResponseData) => void;
}

export function QRScanModal({ isOpen, onClose, onScanSuccess }: QRScanModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera scanner states & refs
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        // Wait for video load/play
        await videoRef.current.play();
      }
      setCameraActive(true);
      setLoading(false);
      
      // Start the frame scanning loop
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setLoading(false);
      setCameraActive(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please grant camera access.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Failed to access camera: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        const qrData = code.data;
        const prefix = "https://nautilusbanking.vercel.app/qr/scan?data=";
        if (qrData.startsWith(prefix)) {
          const encryptedPayload = qrData.slice(prefix.length);
          stopCamera();
          setLoading(true);
          try {
            const res = await decodeQR(encryptedPayload);
            if (res.data && res.data.success && res.data.valid) {
              res.data.raw_token = encryptedPayload;
              onScanSuccess(res.data);
              onClose();
            } else {
              setError(res.error || res.data?.message || "Failed to decode QR code. It may be expired or invalid.");
              // Wait 3s before resuming camera scanning
              setTimeout(() => {
                if (isOpen && scanMode === "camera") {
                  startCamera();
                }
              }, 3000);
            }
          } catch (err: any) {
            setError(err.message || "Network error while decoding QR code.");
            setTimeout(() => {
              if (isOpen && scanMode === "camera") {
                startCamera();
              }
            }, 3000);
          }
          setLoading(false);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isOpen && scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Failed to create canvas context");
          setLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          const qrData = code.data;
          const prefix = "https://nautilusbanking.vercel.app/qr/scan?data=";
          if (qrData.startsWith(prefix)) {
            const encryptedPayload = qrData.slice(prefix.length);
            
            try {
              const res = await decodeQR(encryptedPayload);
              if (res.data && res.data.success && res.data.valid) {
                res.data.raw_token = encryptedPayload;
                onScanSuccess(res.data);
                onClose();
              } else {
                setError(res.error || res.data?.message || "Failed to decode QR code. It may be expired or invalid.");
              }
            } catch (err: any) {
              setError(err.message || "Network error while decoding QR code.");
            }
          } else {
            setError("Invalid QR Code format. Please scan a valid NAUTILUS QR code.");
          }
        } else {
          setError("No QR code found in the image. Please try another image.");
        }
        setLoading(false);
      };
      
      img.onerror = () => {
        setError("Failed to load image. Please try a different file.");
        setLoading(false);
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Scan QR Code">
      <div className="space-y-4">
        {/* Toggle between Camera and Upload */}
        <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg w-full">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScanMode("camera");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              scanMode === "camera"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Scan with Camera
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScanMode("upload");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              scanMode === "upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image
          </button>
        </div>

        {error && (
          <Alert variant="error" title="Scanning Failed">
            {error}
          </Alert>
        )}

        {scanMode === "camera" ? (
          <div className="space-y-4">
            {cameraError ? (
              <div className="border border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-50 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-xs font-mono text-zinc-600 mb-4">{cameraError}</p>
                <Button variant="outline" size="sm" onClick={startCamera} className="text-xs font-mono">
                  Grant Camera Permission
                </Button>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-200 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transform -scale-x-100"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scan Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/40 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -translate-x-[2px] translate-y-[2px]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 translate-x-[2px] translate-y-[2px]" />
                    
                    {/* Laser scanning line animation */}
                    <div className="absolute left-0 right-0 h-0.5 bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.8)] top-0 animate-[scan_2s_linear_infinite]" />
                  </div>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-mono tracking-wider">DECODING...</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-center text-[11px] font-mono text-zinc-500">
              Align the NAUTILUS QR code inside the frame to scan automatically.
            </p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              {loading ? "Processing..." : "Click to Upload QR Image"}
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Supports PNG, JPG
            </p>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 gap-2 font-mono text-xs"
              disabled={loading}
            >
              <Upload className="w-3.5 h-3.5" /> Select File
            </Button>
          </div>
        )}
      </div>
      
      {/* Dynamic Keyframe scan animation style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </Modal>
  );
}
