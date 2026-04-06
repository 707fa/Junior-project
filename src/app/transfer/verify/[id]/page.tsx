"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Container, Typography, Paper, Box, TextField, Button, Alert, CircularProgress, Stack, useMediaQuery, useTheme } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { updateLocalBalances, saveLocalTransaction, removeLocalTransaction } from "@/lib/local-cards";
import { TransferConfirmResult, Transaction } from "@/types";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function VerifyPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const params = useParams();
  const ext_id = params.id as string;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [blockUntil, setBlockUntil] = useState<number | null>(null);

  // Success View states
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [cancelTimeLeft, setCancelTimeLeft] = useState(90);
  const [transactionId, setTransactionId] = useState("");
  const [transferDetails, setTransferDetails] = useState<TransferConfirmResult | null>(null);

  useEffect(() => {
    // Initial block check
    const savedBlock = sessionStorage.getItem(`transfer_block_${ext_id}`);
    if (savedBlock) {
      const blockTime = parseInt(savedBlock, 10);
      if (Date.now() < blockTime) {
        setBlockUntil(blockTime);
        setError("Операция временно заблокирована из-за неверных попыток.");
      } else {
        sessionStorage.removeItem(`transfer_block_${ext_id}`);
      }
    }
  }, [ext_id]);

  useEffect(() => {
    if (!isConfirmed && timeLeft > 0 && !blockUntil) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (isConfirmed && cancelTimeLeft > 0) {
      const timer = setTimeout(() => setCancelTimeLeft(cancelTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Block timer
    if (blockUntil && Date.now() < blockUntil) {
      const timer = setTimeout(() => {
        if (Date.now() >= blockUntil) {
          setBlockUntil(null);
          setError(null);
          sessionStorage.removeItem(`transfer_block_${ext_id}`);
        } else {
          // Trigger re-render to update block status
          setBlockUntil(blockUntil);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, cancelTimeLeft, isConfirmed, blockUntil, ext_id]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.transferConfirm({
        ext_id,
        otp,
      });

      setTransactionId(result.transaction_id || "TRX-OK");
      setTransferDetails(result);
      setIsConfirmed(true);
      setCancelTimeLeft(90);

      const details = result.details;
      // Save to local history
      const tx: Transaction = {
        id: Date.now(),
        ext_id,
        title: `Перевод: ${details?.receiver_name || ("**** " + (details?.receiver?.slice(-4) || "****"))}`,
        amount: details?.amount || "0 UZS",
        date: new Date().toLocaleDateString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        status: "Успешно",
        details: details
      };
      saveLocalTransaction(tx);

      try {
        await updateLocalBalances();
      } catch (syncErr) {
        console.error("Failed to sync balances", syncErr);
      }
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string; data?: { expires_in?: number } };
      const code = apiError.code ?? 0;

      let msg = getErrorMessage(code, apiError.message) || "Ошибка подтверждения";

      if (code === 32711 || code === 32716) {
        const expiresIn = apiError.data?.expires_in || 120; // Default 2 mins
        const blockTime = Date.now() + expiresIn * 1000;
        setBlockUntil(blockTime);
        sessionStorage.setItem(`transfer_block_${ext_id}`, blockTime.toString());
        msg += ` Попробуйте через ${Math.ceil(expiresIn / 60)} мин.`;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.resendOtp({ ext_id });
      setTimeLeft(result.expires_in || 60);
      setSuccess("Код отправлен повторно.");
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string; data?: { expires_in?: number } };
      const code = apiError.code ?? 0;

      let msg = getErrorMessage(code, apiError.message) || "Ошибка отправки кода";

      if (code === 32711 || code === 32716) {
        const expiresIn = apiError.data?.expires_in || 120;
        const blockTime = Date.now() + expiresIn * 1000;
        setBlockUntil(blockTime);
        sessionStorage.setItem(`transfer_block_${ext_id}`, blockTime.toString());
      }

      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.transferCancel({ ext_id });
      if (result.state === "refunded" || result.state === "cancelled") {
        removeLocalTransaction(ext_id);
        setSuccess("Перевод успешно отменен. Средства возвращены.");
        setTimeout(() => router.push("/"), 2500);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };

      // If the transfer was not yet confirmed, we should allow the user to exit regardless of backend errors
      if (!isConfirmed) {
        router.push("/");
        return;
      }

      if (apiError.code === 32706) {
        setError("Ошибка при отмене. Возможно, время на отмену истекло или операция уже завершена.");
      } else {
        setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка отмены");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (isConfirmed) {
    const details = transferDetails?.details;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
        {!isMobile && <Header />}
        <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 6 }}>
          <Paper sx={{ p: isMobile ? 3 : 4, borderRadius: 6, textAlign: "center", bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>

            <Box sx={{ bgcolor: "success.main", py: 3, mx: -4, mt: -4, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "white" }}>
                ПЕРЕВОД УСПЕШЕН
              </Typography>
            </Box>

            <Typography variant="h3" sx={{ mb: 1, fontWeight: 900, color: "success.main" }}>
              {details?.amount}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, opacity: 0.6, letterSpacing: 1 }}>
              ID: {transactionId}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4, textAlign: "left", bgcolor: "rgba(255,255,255,0.03)", p: 3, borderRadius: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>Отправитель</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{details?.sender_name || "Bank Karta"}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>{details?.sender}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>Получатель</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{details?.receiver_name || "Foydalanuvchi"}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>{details?.receiver}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>Дата</Typography>
                <Typography variant="body2">{details?.date}</Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>Статус</Typography>
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: 800 }}>{details?.status || "ОПЛАЧЕНО"}</Typography>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box sx={{ mt: 2 }}>
              {cancelTimeLeft > 0 ? (
                <>
                  <Typography variant="caption" sx={{ mb: 1.5, display: "block", color: "text.secondary" }}>
                    Отмена доступна в течение {cancelTimeLeft} сек.
                  </Typography>
                  <Button
                    variant="text"
                    color="error"
                    fullWidth
                    onClick={handleCancel}
                    disabled={cancelling}
                    sx={{ mb: 2, textTransform: "none", py: 1 }}
                  >
                    {cancelling ? <CircularProgress size={20} color="error" /> : "Отменить перевод?"}
                  </Button>
                </>
              ) : (
                <Typography variant="caption" sx={{ mb: 3, display: "block", color: "text.secondary", opacity: 0.5 }}>
                  Время на отмену истекло
                </Typography>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/")}
                sx={{ py: 2, borderRadius: 3, bgcolor: "success.main", fontWeight: 800, "&:hover": { bgcolor: "success.dark" } }}
              >
                Вернуться на главную
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
      {!isMobile && <Header />}
      <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 6 }}>
        <Paper sx={{ p: isMobile ? 3 : 4, borderRadius: 4, textAlign: "center", bgcolor: "background.paper" }}>
          {!isMobile && (
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Подтверждение перевода
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: 4, opacity: 0.7 }}>
            Мы отправили 6-значный код на ваш номер телефона.
            (ID: {ext_id?.slice(0, 8) || "..."}...)
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleConfirm}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Tasdiqlash kodi"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoComplete="one-time-code"
                inputProps={{ maxLength: 6, style: { textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" } }}
                sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
              />

              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                {timeLeft > 0 ? (
                  `Отправить код повторно через: ${timeLeft} сек`
                ) : (
                  <Button
                    variant="text"
                    onClick={handleResend}
                    disabled={resending || !!blockUntil}
                    sx={{ textTransform: "none", color: "primary.main" }}
                  >
                    Отправить код повторно
                  </Button>
                )}
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleCancel}
                  disabled={cancelling || loading}
                  color="inherit"
                  sx={{ py: 1.5, borderRadius: 3, opacity: 0.6 }}
                >
                  {cancelling ? <CircularProgress size={24} color="inherit" /> : "Отмена"}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || otp.length < 6 || !!blockUntil}
                  sx={{ py: 1.5, borderRadius: 3, bgcolor: "primary.main", fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Подтвердить"}
                </Button>
              </Stack>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
