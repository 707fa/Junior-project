"use client";

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, IconButton, Typography, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n";

// Dynamically import the scanner to avoid SSR issues
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }
);

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const t = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      console.log("QR Scaled:", result[0].rawValue);
      onScan(result[0].rawValue);
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scan Error:", err);
    setError(err?.message || "Camera error");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: "#121A21", color: "white" }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>{t("qr_pay")}</Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {error ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="error" variant="body1" sx={{ mb: 2 }}>{error}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Please ensure camera permissions are granted and you are using a secure connection (HTTPS or localhost).
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", maxWidth: 500, overflow: "hidden", borderRadius: 4, position: "relative" }}>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              allowMultiple={false}
              scanDelay={500}
              sound={false}
              components={{
                finder: true,
              }}
              styles={{
                container: { width: "100%", aspectRatio: "1/1" }
              }}
            />
            <Box sx={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              border: "2px solid rgba(255,255,255,0.2)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Box sx={{
                width: "70%",
                height: "70%",
                border: "2px solid #00C1A3",
                borderRadius: 4,
                boxShadow: "0 0 0 4000px rgba(0,0,0,0.5)"
              }} />
            </Box>
          </Box>
        )}
        <Typography variant="body2" sx={{ mt: 4, px: 4, textAlign: "center", opacity: 0.7 }}>
          Наведите камеру на QR-код для сканирования
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
