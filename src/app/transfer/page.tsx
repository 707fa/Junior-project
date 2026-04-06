"use client";

import React, { useState, useEffect } from "react";
import { Container, Typography, Paper, Box, TextField, Button, MenuItem, InputAdornment, Alert, CircularProgress, IconButton, useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import PersonIcon from "@mui/icons-material/Person";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { formatCardNumber, isValidLuhn } from "@/lib/card-utils";
import { getLocalCards, updateLocalBalances } from "@/lib/local-cards";
import { Card } from "@/types";
import { useTranslation } from "@/lib/i18n";

export default function TransferPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslation();

  const [loading, setLoading] = useState(false);
  const [fetchingCards, setFetchingCards] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [receiverMode, setReceiverMode] = useState<"own" | "manual">("own");
  const [formData, setFormData] = useState({
    senderCard: "",
    receiverCard: "",
    receiverCardManual: "",
    amount: "",
    currency: "UZS",
  });
  const searchParams = useSearchParams();
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [cardType, setCardType] = useState<string | null>(null);
  const [isCheckingCard, setIsCheckingCard] = useState(false);

  useEffect(() => {
    const loadCards = async () => {
      try {
        let data: Card[] = [];
        try {
          await updateLocalBalances();
          data = getLocalCards();
        } catch (syncErr) {
          console.warn("Failed to sync balances on transfer load:", syncErr);
          data = getLocalCards();
        }

        setCards(data);
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            senderCard: data[0].number,
            receiverCard: data.length > 1 ? data[1].number : "",
          }));
        } else {
          setError(t("transfer_no_cards"));
        }
      } catch (err: unknown) {
        console.error("Unexpected error:", err);
        setError(t("transfer_no_cards"));
      } finally {
        setFetchingCards(false);
      }
    };
    loadCards();
    
    // Handle query param 'to' for QR scan or external link
    const toCard = searchParams.get("to");
    if (toCard) {
      setReceiverMode("manual");
      setFormData(prev => ({ ...prev, receiverCardManual: toCard }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const receiverCards = cards.filter(c => c.number !== formData.senderCard);

  const effectiveReceiverCard = receiverMode === "own"
    ? formData.receiverCard
    : formData.receiverCardManual;

  const isReceiverValid = receiverMode === "own"
    ? !!effectiveReceiverCard && effectiveReceiverCard !== formData.senderCard
    : effectiveReceiverCard.replace(/\s/g, "").length === 16 && isValidLuhn(effectiveReceiverCard.replace(/\s/g, ""));

  useEffect(() => {
    const cleanCard = effectiveReceiverCard.replace(/\s/g, "");
    if (cleanCard.length === 16 && isValidLuhn(cleanCard)) {
      const fetchReceiverName = async () => {
        setIsCheckingCard(true);
        try {
          const res = await api.checkCard({ receiver_card_number: cleanCard });
          const formattedName = res.receiver_name.replace(/\*/g, "").trim();
          setReceiverName(formattedName);
          setCardType(res.card_type);
        } catch (err) {
          console.error("Check card failed:", err);
          setReceiverName(null);
          setCardType(null);
        } finally {
          setIsCheckingCard(false);
        }
      };
      fetchReceiverName();
    } else {
      setReceiverName(null);
    }
  }, [effectiveReceiverCard]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReceiver = effectiveReceiverCard.replace(/\s/g, "");
    if (!isValidLuhn(cleanReceiver)) {
      setError(t("transfer_invalid_card"));
      return;
    }
    if (formData.senderCard.replace(/\s/g, "") === cleanReceiver) {
      setError(t("transfer_same_card"));
      return;
    }

    setLoading(true);
    setError(null);

    const ext_id = uuidv4();

    try {
      const result = await api.transferCreate({
        ext_id,
        sender_card_number: formData.senderCard.replace(/\s/g, ""),
        sender_card_expiry: cards.find(c => c.number === formData.senderCard)?.expire ?? "",
        receiver_card_number: cleanReceiver,
        sending_amount: parseFloat(formData.amount),
        currency: formData.currency as "USD" | "UZS" | "RUB",
      });

      if (result.otp_sent) {
        router.push(`/transfer/verify/${ext_id}`);
      }
    } catch (err: unknown) {
      const apiError = err as { code?: number; message?: string };
      setError(getErrorMessage(apiError.code as number, apiError.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: isMobile ? 10 : 0 }}>
      {!isMobile && <Header />}

      {isMobile && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton color="inherit" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("transfer")}</Typography>
        </Box>
      )}

      <Container maxWidth={isMobile ? "xs" : "sm"} sx={{ py: isMobile ? 1 : 6 }}>
        {!isMobile && (
          <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, textAlign: "center" }}>
            {t("transfer_title")}
          </Typography>
        )}

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {fetchingCards ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <form onSubmit={handleCreateTransfer}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

              {/* SENDER */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: "background.paper" }}>
                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 800, mb: 1, display: "block" }}>
                  {t("transfer_from")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <AccountBalanceWalletIcon sx={{ opacity: 0.5 }} />
                  <TextField
                    select
                    fullWidth
                    variant="standard"
                    value={formData.senderCard}
                    onChange={(e) => {
                      const newSender = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        senderCard: newSender,
                        receiverCard: prev.receiverCard === newSender
                          ? cards.find(c => c.number !== newSender)?.number || ""
                          : prev.receiverCard,
                      }));
                    }}
                    InputProps={{ disableUnderline: true, sx: { fontWeight: 600, fontSize: "1.1rem" } }}
                  >
                    {cards.map((card, idx) => (
                      <MenuItem key={idx} value={card.number}>
                        {card.cardName} • {card.number.slice(-4)}
                        {card.balance !== "—" ? ` — ${card.balance}` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Paper>

              {/* Swap icon */}
              <Box sx={{ display: "flex", justifyContent: "center", my: -1 }}>
                <IconButton
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    width: 36,
                    height: 36,
                    "&:hover": { bgcolor: "primary.dark" }
                  }}
                  onClick={() => {
                    if (receiverMode === "own" && formData.receiverCard) {
                      setFormData(prev => ({
                        ...prev,
                        senderCard: prev.receiverCard,
                        receiverCard: prev.senderCard,
                      }));
                    }
                  }}
                >
                  <SwapVertIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* RECEIVER */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: "background.paper" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 800 }}>
                    {t("transfer_to")}
                  </Typography>
                  <ToggleButtonGroup
                    value={receiverMode}
                    exclusive
                    size="small"
                    onChange={(_, val) => { if (val) setReceiverMode(val); setError(null); }}
                    sx={{ "& .MuiToggleButton-root": { py: 0.25, px: 1, fontSize: "0.7rem", textTransform: "none" } }}
                  >
                    <ToggleButton value="own">{t("transfer_my_card")}</ToggleButton>
                    <ToggleButton value="manual">{t("transfer_other_card")}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {receiverMode === "own" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PersonIcon sx={{ opacity: 0.5 }} />
                    {receiverCards.length > 0 ? (
                      <TextField
                        select
                        fullWidth
                        variant="standard"
                        value={formData.receiverCard}
                        onChange={(e) => setFormData({ ...formData, receiverCard: e.target.value })}
                        InputProps={{ disableUnderline: true, sx: { fontWeight: 600, fontSize: "1.1rem" } }}
                      >
                        {receiverCards.map((card, idx) => (
                          <MenuItem key={idx} value={card.number}>
                            {card.cardName} • {card.number.slice(-4)}
                            {card.balance !== "—" ? ` — ${card.balance}` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                        {t("transfer_no_other_cards")}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder={t("receiver_card")}
                    value={formatCardNumber(formData.receiverCardManual)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 16) {
                        setFormData({ ...formData, receiverCardManual: val });
                        if (val.length === 16 && !isValidLuhn(val)) {
                          setError(t("transfer_invalid_card"));
                        } else {
                          setError(null);
                        }
                      }
                    }}
                    type="tel"
                    error={!!error}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontWeight: 600, fontSize: "1.1rem" },
                      endAdornment: cardType && (
                        <InputAdornment position="end">
                          <Typography sx={{ color: "primary.main", fontWeight: 800, fontSize: "1.1rem" }}>
                            {cardType}
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                  />
                )}

                {receiverName && (
                  <Typography variant="caption" sx={{ mt: .2, display: "block", color: "primary.main", fontWeight: 700, fontSize: "1.1rem" }}>
                    {receiverName}
                  </Typography>
                )}
                {isCheckingCard && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <CircularProgress size={12} sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{t("loading")}</Typography>
                  </Box>
                )}
              </Paper>

              {/* AMOUNT */}
              <Paper sx={{ p: 2, borderRadius: 4, bgcolor: "background.paper", display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder={t("transfer_amount")}
                  type="text"
                  value={formData.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(",", ".");
                    if (/^\d*\.?\d*$/.test(val)) {
                      setFormData({ ...formData, amount: val });
                    }
                  }}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <TextField
                          select
                          variant="standard"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          InputProps={{ disableUnderline: true, sx: { fontWeight: 700, minWidth: 60 } }}
                        >
                          <MenuItem value="UZS">UZS</MenuItem>
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="RUB">RUB</MenuItem>
                        </TextField>
                      </InputAdornment>
                    )
                  }}
                />
              </Paper>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || cards.length === 0 || !formData.amount || !isReceiverValid}
                sx={{
                  mt: 4,
                  bgcolor: "primary.main",
                  color: "white",
                  py: 2,
                  fontSize: "1.1rem",
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "primary.dark" }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t("transfer_btn")}
              </Button>
            </Box>
          </form>
        )}
      </Container>
    </Box>
  );
}