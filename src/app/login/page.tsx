"use client";

import React, { useState } from "react";
import { Container, Typography, Paper, Box, TextField, Button, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from "@mui/material";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "+998",
  });

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const t = useTranslation();

  React.useEffect(() => {
    localStorage.removeItem("loggedInPhone");
    localStorage.removeItem("loggedInFirstName");
    localStorage.removeItem("loggedInLastName");
  }, []);

  const handleLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || formData.phone.length < 13) return;

    setLoading(true);
    setError(null);
    try {
      await api.userLogin({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      });
      setStep("otp");
      setAttemptsLeft(3);
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { code?: number; message?: string };
      setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка при отправке SMS");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 5) return;

    setLoading(true);
    setError(null);
    try {
      await api.userLoginConfirm({
        phone: formData.phone,
        otp: otp,
      });

      // User logged in successfully
      localStorage.setItem("loggedInPhone", formData.phone);
      localStorage.setItem("loggedInFirstName", formData.firstName);
      localStorage.setItem("loggedInLastName", formData.lastName);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      if (newAttempts <= 0) {
        setError("Попытки исчерпаны. Пожалуйста, запросите код заново.");
        setStep("phone");
      } else {
        setError(`Неверный код. Осталось попыток: ${newAttempts}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
      {!isMobile && <Header />}
      {isMobile && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("login_title")}</Typography>
        </Box>
      )}
      <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 6 }}>
        <Paper sx={{ p: isMobile ? 3 : 4, borderRadius: 4, bgcolor: "background.paper" }}>
          {step === "phone" && (
            <Box>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, textAlign: "center" }}>{t("login_title")}</Typography>
              <Typography sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
                {t("login_desc")}
              </Typography>
              {error && <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>{error}</Typography>}
              <form onSubmit={handleLoginRequest}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    label={t("first_name")}
                    placeholder="Иван"
                    value={formData.firstName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "");
                      setFormData({ ...formData, firstName: val });
                    }}
                    required
                    sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  />
                  <TextField
                    label={t("last_name")}
                    placeholder="Иванов"
                    value={formData.lastName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "");
                      setFormData({ ...formData, lastName: val });
                    }}
                    required
                    sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  />
                  <TextField
                    label={t("phone_number")}
                    placeholder="+998 ** *** ****"
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("+998")) {
                        val = "+998";
                      }
                      if (/^\+?\d*$/.test(val)) {
                        setFormData({ ...formData, phone: val.slice(0, 13) });
                      }
                    }}
                    required
                    type="tel"
                    sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !formData.firstName || !formData.lastName || formData.phone.length < 13}
                    sx={{
                      mt: 2,
                      bgcolor: "primary.main",
                      py: 1.5,
                      fontSize: "1.1rem",
                      borderRadius: 3,
                      fontWeight: 700
                    }}
                  >
                    {loading ? t("loading") : t("login_btn")}
                  </Button>
                </Box>
              </form>
            </Box>
          )}

          {step === "otp" && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <IconButton onClick={() => setStep("phone")} sx={{ color: "white", mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{t("confirm")}</Typography>
              </Box>

              <Typography sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
                {t("transfer_sent_desc")} {formData.phone}
              </Typography>

              {error && <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>{error}</Typography>}

              <form onSubmit={handleOtpSubmit}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    label={t("code_from_sms")}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setOtp(val);
                    }}
                    required
                    type="text"
                    autoComplete="one-time-code"
                    sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || otp.length < 5}
                    sx={{
                      mt: 2,
                      bgcolor: "primary.main",
                      py: 1.5,
                      fontSize: "1.1rem",
                      borderRadius: 3,
                      fontWeight: 700
                    }}
                  >
                    {loading ? t("loading") : t("confirm")}
                  </Button>
                </Box>
              </form>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
