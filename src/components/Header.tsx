"use client";

import { AppBar, Toolbar, Typography, Container, Box, Menu, MenuItem, Button, IconButton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TranslateIcon from '@mui/icons-material/Translate';
import LogoutIcon from '@mui/icons-material/Logout';
import { getLanguage, setLanguage, SupportedLang } from "@/lib/language";
import { useTranslation } from "@/lib/i18n";

export default function Header() {
  const [phone, setPhone] = useState<string | null>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLang>("ru");
  const router = useRouter();
  const t = useTranslation();

  useEffect(() => {
    const savedPhone = localStorage.getItem("loggedInPhone");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedPhone) setPhone(savedPhone);
    const lang = getLanguage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lang) setCurrentLang(lang);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
  };
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#121A21", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              color: "#00C1A3",
              textDecoration: "none",
            }}
          >
            CARD
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              color="inherit"
              onClick={(e) => setLangAnchor(e.currentTarget)}
              startIcon={<TranslateIcon />}
              sx={{ textTransform: "none", color: "white" }}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: "white", ml: 1 }}>
                  {phone}
                </Typography>
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
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
