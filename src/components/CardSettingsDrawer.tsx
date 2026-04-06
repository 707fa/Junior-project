"use client";

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";

import { Card } from "@/types";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { removeCard, updateCardStatus } from "@/lib/local-cards";

interface CardSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  card: Card | null;
  onCardModified: () => void; // Trigger refresh
}

export default function CardSettingsDrawer({
  open,
  onClose,
  card,
  onCardModified,
}: CardSettingsDrawerProps) {
  const [view, setView] = useState<"menu" | "balance" | "block" | "delete">("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [actionStep, setActionStep] = useState<"request" | "otp">("request");

  const resetState = () => {
    setView("menu");
    setLoading(false);
    setError(null);
    setSuccessMsg(null);
    setOtp("");
    setActionStep("request");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCheckBalance = async () => {
    if (!card || !card.expire) return;
    setView("balance");
    setLoading(true);
    setError(null);
    try {
      const res = await api.checkBalance({
        card_number: card.number.replace(/\s/g, ""),
        card_expire: card.expire,
      });
      setSuccessMsg(res.message);
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка проверки баланса");
    } finally {
      setLoading(false);
    }
  };

  const handleActionRequest = async (action: "block" | "delete") => {
    if (!card) return;
    setView(action);
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setOtp("");

    try {
      const cardNumber = card.number.replace(/\s/g, "");
      if (action === "block") {
        await api.cardBlockRequest({ card_number: cardNumber });
      } else {
        await api.cardDeleteRequest({ card_number: cardNumber });
      }
      setActionStep("otp");
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      const errorMessage = apiError.message || "";
      
      // If the card is already deleted or inactive, remove it locally
      if (action === "delete" && (
        apiError.code === 32766 || 
        errorMessage.includes("allaqachon o'chirigan") || 
        errorMessage.includes("Карта неактивна")
      )) {
        removeCard(card.number.replace(/\s/g, ""));
        setSuccessMsg("Карта уже удалена на сервере. Обновление списка...");
        setTimeout(() => {
          onCardModified();
          handleClose();
        }, 2000);
        return;
      }

      setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка при запросе SMS");
    } finally {
      setLoading(false);
    }

  };

  const handleActionConfirm = async () => {
    if (!card) return;
    setLoading(true);
    setError(null);

    try {
      const cardNumber = card.number.replace(/\s/g, "");
      if (view === "block") {
        await api.cardBlockConfirm({ card_number: cardNumber, otp });
        setSuccessMsg("Карта успешно заблокирована!");
        updateCardStatus(cardNumber, "blocked");
      } else if (view === "delete") {
        await api.cardDeleteConfirm({ card_number: cardNumber, otp });
        setSuccessMsg("Карта успешно удалена!");
        removeCard(cardNumber);
      }
      setTimeout(() => {
        onCardModified();
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка подтверждения OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!card) return null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          bgcolor: "#1C262F",
          color: "white",
          p: 2,
          pb: 4,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {view !== "menu" ? (
          <IconButton onClick={resetState} sx={{ color: "white" }}>
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <Box sx={{ width: 40 }} />
        )}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {view === "menu" && "Настройки карты"}
          {view === "balance" && "Баланс карты"}
          {view === "block" && "Блокировка"}
          {view === "delete" && "Удаление"}
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {view === "menu" && (
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleCheckBalance}>
              <ListItemIcon sx={{ color: "primary.main" }}>
                <AccountBalanceWalletIcon />
              </ListItemIcon>
              <ListItemText primary="Проверить баланс" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleActionRequest("block")}>
              <ListItemIcon sx={{ color: "warning.main" }}>
                <BlockIcon />
              </ListItemIcon>
              <ListItemText primary="Заблокировать карту" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleActionRequest("delete")}>
              <ListItemIcon sx={{ color: "error.main" }}>
                <DeleteOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Удалить карту" sx={{ color: "error.main" }} />
            </ListItemButton>
          </ListItem>
        </List>
      )}

      {view === "balance" && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          {loading ? (
            <CircularProgress color="primary" />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Alert severity="success">{successMsg}</Alert>
          )}
        </Box>
      )}

      {(view === "block" || view === "delete") && (
        <Box sx={{ mt: 2 }}>
          {actionStep === "request" ? (
            <Box sx={{ textAlign: "center" }}>
              {loading ? (
                <CircularProgress color="primary" />
              ) : error ? (
                <>
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                  <Button variant="outlined" onClick={() => handleActionRequest(view)}>Повторить</Button>
                </>
              ) : null}
            </Box>
          ) : (
            <Box>
              <Typography sx={{ mb: 2, textAlign: "center", color: "text.secondary" }}>
                Введите SMS код для подтверждения
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

              {!successMsg && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Код из SMS"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    fullWidth
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }}
                  />
                  <Button
                    variant="contained"
                    color={view === "delete" ? "error" : "primary"}
                    onClick={handleActionConfirm}
                    disabled={loading || otp.length < 5}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Подтвердить"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
}
