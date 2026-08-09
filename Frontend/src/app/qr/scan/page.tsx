"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeQR } from "@/features/bank/api";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

function QRScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (!data) {
      setError("No QR data found in the URL.");
      return;
    }

    let isMounted = true;

    const processQR = async () => {
      try {
        const res = await decodeQR(data);
        if (!isMounted) return;

        if (res.data && res.data.success && res.data.valid) {
          const qrData = res.data;
          
          if (qrData.type === "share" || qrData.type === "transfer") {
            const query = new URLSearchParams({
              bank_id: qrData.bank_id || "",
              bank_user_id: qrData.bank_user_id ? qrData.bank_user_id.toString() : "",
              name: qrData.account_holder_name || "",
              amount: qrData.amount ? qrData.amount.toString() : "",
            });
            router.push(`/transfer?${query.toString()}`);
          } else if (qrData.type === "faucet") {
            router.push(`/faucet?token=${data}&amount=${qrData.amount}&bank_id=${qrData.bank_id}&bank_user_id=${qrData.bank_user_id}`);
          } else {
            setError("Unsupported QR type scanned.");
          }
        } else {
          setError(res.error || res.data?.message || "Failed to decode QR code. It may be expired or invalid.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Network error while decoding QR code.");
        }
      }
    };

    processQR();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Processing QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="error" title="Scanning Failed">
              {error}
            </Alert>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-mono text-zinc-500">Decrypting QR payload...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QRScanContent />
    </Suspense>
  );
}
