"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Box, IconButton, List, ListItem, ListItemText, ListItemIcon, Avatar, CircularProgress, Alert, Paper, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import TranslateIcon from "@mui/icons-material/Translate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useRouter } from "next/navigation";
import BankCard from "@/components/BankCard";
import CardSettingsDrawer from "@/components/CardSettingsDrawer";
import QrScannerModal from "@/components/QrScannerModal";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-codes";
import { Card, Transaction } from "@/types";
import { InputBase, Menu, MenuItem, Tooltip } from "@mui/material";
import { getLocalCards, updateLocalBalances, getLocalTransactions, removeLocalTransaction, removeLocalTransactionById } from "@/lib/local-cards";
import { useTranslation } from "@/lib/i18n";
import { getLanguage, setLanguage, SupportedLang } from "@/lib/language";


export default function Dashboard() {
  const router = useRouter();

  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [cancelTx, setCancelTx] = useState<Transaction | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [settingsCard, setSettingsCard] = useState<Card | null>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLang>("ru");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    setCurrentLang(getLanguage());
    const phoneStr = localStorage.getItem("loggedInPhone");
    if (!phoneStr) {
      router.push("/login");
      return;
    }
    setPhone(phoneStr);

    const fetchData = async () => {
      // 1. Show local data immediately
      const localCards = getLocalCards();
      setCards(localCards);
      const localTxs = getLocalTransactions();
      setTransactions(localTxs.slice(0, 10));
      setLoading(false);

      // 2. Update balances in background
      try {
        await updateLocalBalances();
        setCards(getLocalCards());
      } catch (err: unknown) {
        console.error("Failed to update balances in background:", err);
      }
    };

    fetchData();
  }, [router]);

  const filteredCards = cards.filter(card =>
    card.number.replace(/\s/g, "").includes(searchQuery.replace(/\s/g, "")) ||
    (card.phone && card.phone.includes(searchQuery)) ||
    card.cardName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCancelTransaction = async () => {
    if (!cancelTx) return;
    setCancelLoading(true);
    try {
      // For transactions in history, we use the refund method
      await api.puliQaytarish({
        ext_id: cancelTx.ext_id || String(cancelTx.id)
      });

      // Remove from memory and storage
      if (cancelTx.ext_id) removeLocalTransaction(cancelTx.ext_id);
      setTransactions(prev => prev.filter(t => t.id !== cancelTx.id));

    } catch (err: unknown) {
      console.error("Refund failed:", err);
      const apiError = err as { code?: number; message?: string };
      setError(getErrorMessage(apiError.code ?? 0, apiError.message) || "Ошибка при возврате средств");
    } finally {
      setCancelLoading(false);
      setCancelTx(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInPhone");
    localStorage.removeItem("loggedInFirstName");
    localStorage.removeItem("loggedInLastName");
    sessionStorage.clear();
    router.push("/login");
  };

  const handleQrScan = (data: string) => {
    setIsQrModalOpen(false);
    // Usually QR data contains a card number or a payment link
    // For now, let's assume it's a card number and redirect to transfer
    if (data) {
      router.push(`/transfer?to=${data}`);
    }
  };

  const t = useTranslation();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#121A21", color: "white", pb: 4 }}>
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("cards_and_wallet")}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              onClick={(e) => setLangAnchor(e.currentTarget)}
              startIcon={<TranslateIcon fontSize="small" />}
              sx={{ textTransform: "none", color: "rgba(255,255,255,0.7)", minWidth: 0, p: 0.5 }}
            >
              {currentLang.toUpperCase()}
            </Button>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
              PaperProps={{ sx: { bgcolor: "#1C262F", color: "white" } }}
            >
              <MenuItem onClick={() => { setLanguage("ru"); setLangAnchor(null); }}>RU</MenuItem>
              <MenuItem onClick={() => { setLanguage("uz"); setLangAnchor(null); }}>UZ</MenuItem>
              <MenuItem onClick={() => { setLanguage("en"); setLangAnchor(null); }}>EN</MenuItem>
            </Menu>

            {phone && (
              <Typography variant="body1" sx={{ fontWeight: 600, color: "white", ml: 1 }}>
                {phone}
              </Typography>
            )}

            <Tooltip title={t("logout")}>
              <IconButton
                onClick={handleLogout}
                sx={{ color: "error.light", "&:hover": { bgcolor: "error.dark", color: "white" } }}
                size="small"
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "#1C262F",
          borderRadius: 3,
          px: 2,
          py: 1,
          mb: 3,
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <SearchIcon sx={{ color: "grey.500", mr: 1, fontSize: "1.2rem" }} />
          <InputBase
            placeholder={t("search_placeholder")}
            value={searchQuery}
            suppressHydrationWarning={true}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\+?\d*$/.test(val) || val === "") {
                setSearchQuery(val);
              }
            }}
            sx={{ color: "white", flex: 1, fontSize: "0.95rem" }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress color="primary" /></Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredCards.map((card, index) => (
              <BankCard key={index} {...card} isMobile={true} onClick={() => setSettingsCard(card)} />
            ))}

            {filteredCards.length === 0 && !loading && (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>{t("no_cards_found")}</Typography>
            )}

            <Paper sx={{ mt: 2, borderRadius: 4, bgcolor: "#1C262F", overflow: "hidden" }}>
              <Button
                fullWidth
                size="large"
                startIcon={<AddIcon />}
                onClick={() => router.push("/bind-card")}
                sx={{ py: 2.5, justifyContent: "flex-start", px: 3, color: "white", textTransform: "none", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                {t("add_card")}
              </Button>
              <Button
                fullWidth
                size="large"
                startIcon={<SwapHorizIcon />}
                onClick={() => router.push("/transfer")}
                sx={{ py: 2.5, justifyContent: "flex-start", px: 3, color: "white", textTransform: "none", fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                {t("transfer")}
              </Button>
              <Button
                fullWidth
                size="large"
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setIsQrModalOpen(true)}
                sx={{ py: 2.5, justifyContent: "flex-start", px: 3, color: "#00C1A3", borderTopLeftRadius: 0, borderTopRightRadius: 0, textTransform: "none", fontSize: "1.1rem", fontWeight: 700 }}
              >
                {t("qr_pay")}
              </Button>
            </Paper>

            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("latest_tx")}</Typography>
                <HistoryIcon sx={{ opacity: 0.5 }} />
              </Box>

              <Paper sx={{ p: 1, borderRadius: 4, bgcolor: "#1C262F" }}>
                <List sx={{ width: "100%" }}>
                  {transactions.map((tx) => (
                    <ListItem
                      key={tx.id}
                      disableGutters
                      secondaryAction={<IconButton edge="end" size="small"><ArrowForwardIosIcon sx={{ fontSize: "0.8rem", color: "white", opacity: 0.3 }} /></IconButton>}
                      onClick={() => setSelectedTx(tx)}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.02)" }, borderRadius: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 50, ml: 1 }}>
                        <Avatar sx={{ bgcolor: (tx.status === "cancelled" || tx.status === "refunded" || tx.status === "Отменено") ? "rgba(255,59,48,0.1)" : (tx.amount.startsWith("-") ? "rgba(255,255,255,0.05)" : "rgba(0,193,163,0.1)"), width: 40, height: 40 }}>
                          <SendIcon sx={{ fontSize: "1.1rem", color: (tx.status === "cancelled" || tx.status === "refunded" || tx.status === "Отменено") ? "#FF3B30" : (tx.amount.startsWith("-") ? "white" : "#00C1A3"), transform: tx.amount.startsWith("-") ? "rotate(-45deg)" : "rotate(135deg)" }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={tx.title}
                        secondary={tx.status === "Отменено" || tx.status === "cancelled" || tx.status === "refunded" ? `ОТМЕНЕНО • ${tx.date}` : tx.date}
                        primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem", color: "white" }}
                        secondaryTypographyProps={{ fontSize: "0.80rem", color: tx.status === "Отменено" ? "error.main" : "white", sx: { opacity: 0.5 } }}
                      />
                      <Box sx={{ ml: 1, textAlign: "right", pr: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "1rem", color: (tx.status === "cancelled" || tx.status === "refunded" || tx.status === "Отменено") ? "#FF3B30" : (tx.amount.startsWith("-") ? "white" : "#00C1A3") }}>{tx.amount}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                  {transactions.length === 0 && <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>{t("no_tx")}</Typography>}
                </List>
              </Paper>
            </Box>
          </Box>
        )}
      </Container>

      {/* Receipt Modal */}
      <Dialog
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        PaperProps={{ sx: { bgcolor: "#1C262F", color: "white", borderRadius: 6, maxWidth: 450, width: "95%", position: "relative", overflow: "hidden" } }}
      >
        {selectedTx && (
          <>
            <Box sx={{
              bgcolor: (selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "grey.700" : "success.main",
              py: 2.5,
              textAlign: "center"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: 1.5 }}>
                {(selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "ПЕРЕВОД ОТМЕНЕН" : "ЧЕК ОПЕРАЦИИ"}
              </Typography>
            </Box>

            <DialogContent sx={{ px: 3, pt: 4, pb: 1, textAlign: "center" }}>
              <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 900, color: (selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "text.secondary" : "success.main" }}>
                {selectedTx.amount}
              </Typography>
              <Typography variant="caption" sx={{ mb: 4, display: "block", opacity: 0.5, letterSpacing: 1 }}>
                ID: {selectedTx.ext_id || selectedTx.id}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left", bgcolor: "rgba(255,255,255,0.03)", p: 2.5, borderRadius: 4, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>Отправитель</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTx.details?.sender_name || "Моя карта"}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>{selectedTx.details?.sender || "****"}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 0.5, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>Получатель</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTx.details?.receiver_name || selectedTx.title.replace("Перевод: ", "")}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>{selectedTx.details?.receiver || "****"}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 0.5, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Дата и время</Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{selectedTx.date}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px dashed rgba(255,255,255,0.1)", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>Статус</Typography>
                  <Typography variant="body2" sx={{
                    color: (selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "error.main" : "success.main",
                    fontWeight: 800,
                    fontSize: "0.85rem"
                  }}>
                    {(selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "ОТМЕНЕНО" : "УСПЕШНО"}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: "column", gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setSelectedTx(null)}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: (selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "grey.800" : "success.main",
                  fontWeight: 700,
                  "&:hover": { bgcolor: (selectedTx.status === "Отменено" || selectedTx.status === "cancelled" || selectedTx.status === "refunded") ? "grey.700" : "success.dark" }
                }}
              >
                Закрыть
              </Button>
              <Button
                fullWidth
                startIcon={<DeleteOutlineIcon />}
                onClick={() => {
                  if (selectedTx) {
                    if (selectedTx.ext_id) {
                      removeLocalTransaction(selectedTx.ext_id);
                    } else {
                      removeLocalTransactionById(selectedTx.id);
                    }
                    setTransactions(prev => prev.filter(t => t.id !== selectedTx.id));
                    setSelectedTx(null);
                  }
                }}
                sx={{
                  py: 1,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  "&:hover": { color: "#FF3B30", bgcolor: "rgba(255, 59, 48, 0.05)" }
                }}
              >
                Удалить чек
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <CardSettingsDrawer
        open={!!settingsCard}
        onClose={() => setSettingsCard(null)}
        card={settingsCard}
        onCardModified={() => {
          setCards(getLocalCards());
        }}
      />
      <QrScannerModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScan={handleQrScan}
      />
    </Box>
  );
}
