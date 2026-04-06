"use client";

import React, { useState, useEffect } from "react";
import { Container, Typography, Paper, Box, TextField, Button, Alert, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { saveCard } from "@/lib/local-cards";

export default function VerifyLoginOtpPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [blockUntil, setBlockUntil] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);

  useEffect(() => {
    const pendingPhone = sessionStorage.getItem("pendingLoginPhone");
    if (!pendingPhone) {
      router.push("/bind-card");
    } else {
      setPhone(pendingPhone);
    }

    // Check if there is an active block
    const savedBlock = sessionStorage.getItem("card_add_block_until");
    if (savedBlock) {
      const blockTime = parseInt(savedBlock, 10);
      if (Date.now() < blockTime) {
        setBlockUntil(blockTime);
        setError("Форма заблокирована из-за неверных попыток.");
      } else {
        sessionStorage.removeItem("card_add_block_until");
      }
    }
  }, [router]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (blockUntil && Date.now() < blockUntil) {
      interval = setInterval(() => {
        if (Date.now() >= blockUntil) {
          setBlockUntil(null);
          setError(null);
          sessionStorage.removeItem("card_add_block_until");
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [blockUntil]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || blockUntil) return;

    setLoading(true);
    setError(null);

    const pendingCard = sessionStorage.getItem("pendingCardNumber");

    if (!pendingCard) {
      setError("Номер карты не найден.");
      setLoading(false);
      return;
    }

    try {
      const result = await api.cardAddConfirm({
        card_number: pendingCard,
        otp: otp,
      });

      console.log("card_add_confirm result:", result);

      const expire = result.data?.card_expire;

      let balance = "—";
      if (result.data?.balance !== undefined) {
        balance = `${result.data.balance.toLocaleString('ru-RU')} UZS`;
      }

      const owner = result.data?.owner_name;

      saveCard(pendingCard, phone, balance, expire, owner);
      sessionStorage.removeItem("pendingCardNumber");
      sessionStorage.removeItem("pendingLoginPhone");
      sessionStorage.removeItem("card_add_block_until");

      router.push("/");
    } catch (err: unknown) {
      console.error("card_add_confirm error:", err);

      const apiError = err as { code?: number; message?: string; data?: { expires_in?: number } };
      let msg = getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка подтверждения кода";

      // Assume backend sends expires_in inside error.data when blocked
      if (apiError.data && apiError.data.expires_in) {
        const blockTimeMs = Date.now() + apiError.data.expires_in * 1000;
        setBlockUntil(blockTimeMs);
        sessionStorage.setItem("card_add_block_until", blockTimeMs.toString());
        msg += ` Попробуйте через ${Math.ceil(apiError.data.expires_in / 60)} мин.`;
      } else {
        const newAttempts = attemptsLeft - 1;
        setAttemptsLeft(newAttempts);
        if (newAttempts > 0) {
          msg += ` Осталось попыток: ${newAttempts}`;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
      {!isMobile && <Header />}

      {isMobile && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Вход</Typography>
        </Box>
      )}

      <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 6 }}>
        <Paper sx={{ p: isMobile ? 3 : 4, borderRadius: 4, bgcolor: "background.paper" }}>
          {!isMobile && (
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, textAlign: "center" }}>
              Подтверждение входа
            </Typography>
          )}

          <Typography sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
            Мы отправили SMS с кодом на ваш номер
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleVerifyOtp}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Код из SMS"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 6) {
                    setOtp(val);
                  }
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
                disabled={loading || otp.length < 5 || !!blockUntil}
                sx={{
                  mt: 2,
                  bgcolor: "primary.main",
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 3,
                  fontWeight: 700
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Подтвердить"}
              </Button>

              <Button
                variant="text"
                onClick={() => router.back()}
                sx={{ color: "text.secondary", textTransform: "none" }}
              >
                Назад
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
