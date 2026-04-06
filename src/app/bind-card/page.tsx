"use client";

import React, { useState } from "react";
import { Container, Typography, Paper, Box, TextField, Button, Alert, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { formatCardNumber, isValidLuhn } from "@/lib/card-utils";
import { useTranslation } from "@/lib/i18n";


export default function BindCardPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    phone: "+998",
  });
  const t = useTranslation();
  const isPhoneError = errorCode === 32726 ||
    errorCode === 32722 ||
    error?.toLowerCase().includes("телефон") ||
    error?.toLowerCase().includes("phone") ||
    error?.toLowerCase().includes("telefon");

  React.useEffect(() => {
    const loggedPhone = localStorage.getItem("loggedInPhone");
    if (loggedPhone) {
      setFormData(prev => ({ ...prev, phone: loggedPhone }));
    }
  }, []);

  const handleBindCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanCard = formData.cardNumber.replace(/\s/g, "");
    if (!isValidLuhn(cleanCard)) {
      setError("Неверный номер карты (ошибка контрольной суммы Luhn).");
      setErrorCode(32718); // Map local Luhn error to card format error code
      setLoading(false);
      return;
    }

    try {
      const result = await api.cardAddRequest({
        card_number: cleanCard,
        phone: formData.phone.replace(/\s/g, ""),
      });

      console.log("card_add_request result:", result);

      if (
        result.status === "enabled" ||
        result.status === "sms_sent" ||
        result.status === "otp_sent" ||
        result.status === "created" ||
        result.status === "pending" ||
        result.status === "already_enabled"
      ) {
        sessionStorage.setItem("pendingLoginPhone", formData.phone);
        sessionStorage.setItem("pendingCardNumber", cleanCard);
        setSuccess("SMS код отправлен.");
        setTimeout(() => router.push("/bind-card/verify"), 1000);
      } else {
        setError(`Статус: ${result.status}`);
      }
    } catch (err: unknown) {
      console.error("card_add_request error:", err);
      const apiError = err as { code?: number; message?: string };
      const code = apiError.code ?? 0;
      setErrorCode(code);
      setError(getErrorMessage(code, apiError.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
      {!isMobile && <Header />}

      {isMobile && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("bind_card_title")}</Typography>
        </Box>
      )}

      <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 6 }}>
        <Paper sx={{ p: isMobile ? 3 : 4, borderRadius: 4, bgcolor: "background.paper" }}>
          {!isMobile && (
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, textAlign: "center" }}>
              {t("bind_card_title")}
            </Typography>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleBindCard}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label={t("card_number")}
                placeholder="8600 **** **** ****"
                value={formatCardNumber(formData.cardNumber)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 16) {
                    setFormData({ ...formData, cardNumber: val });
                    if (val.length === 16 && !isValidLuhn(val)) {
                      setError("Неверный номер карты.");
                      setErrorCode(32718);
                    } else {
                      setError(null);
                      setErrorCode(null);
                    }
                  }
                }}
                error={!!error && !isPhoneError}
                helperText={(!isPhoneError && error) || ""}
                required
                type="tel"
                sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
              />
              <TextField
                label={t("phone_number")}
                placeholder="+998 ** *** ****"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\+?\d*$/.test(val) || val === "") {
                    setFormData({ ...formData, phone: val.slice(0, 13) });
                  }
                }}
                error={!!error && isPhoneError}
                helperText={(isPhoneError && error) || ""}
                required
                type="tel"
                sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1, opacity: isPhoneError ? 1 : 0.7 }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  bgcolor: "primary.main",
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 3,
                  fontWeight: 700
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t("confirm")}
              </Button>

              <Button
                variant="text"
                onClick={() => router.back()}
                sx={{ color: "text.secondary", textTransform: "none" }}
              >
                {t("back")}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
