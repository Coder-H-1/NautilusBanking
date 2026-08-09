import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { Upload, X, QrCode } from "lucide-react";
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
          // Check for URL prefix
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
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code" size="md">
      <div className="space-y-6">
        <p className="text-sm text-zinc-500 font-mono">
          Upload a NAUTILUS QR code image to securely load account details.
        </p>

        {error && (
          <Alert variant="error" title="Scanning Failed">
            {error}
          </Alert>
        )}

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
      </div>
    </Modal>
  );
}
