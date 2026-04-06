"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "@/lib/i18n";

interface BankCardProps {
  number: string;
  balance: string;
  cardName: string;
  type: string;
  isMobile?: boolean;
  onClick?: () => void;
  owner?: string;
  expire?: string;
  status?: "active" | "blocked" | "deleted";
}

export default function BankCard({
  number,
  balance,
  cardName,
  type,
  isMobile = false,
  onClick,
  owner,
  expire,
  status = "active",
}: BankCardProps) {
  const t = useTranslation();
  const normalizedType = type.toLowerCase();
  const isGreen = normalizedType !== "humo";

  const formatOwnerName = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return name.toUpperCase();
    return `${parts[0]} ${parts[1][0]}.`.toUpperCase();
  };

  const formattedOwner = formatOwnerName(owner);

  if (isMobile) {
    return (
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick && status !== "active" ? "default" : (onClick ? "pointer" : "default"),
          width: "100%",
          minHeight: 180,
          borderRadius: 4,
          background: isGreen
            ? `linear-gradient(135deg, #00A381 0%, #007A5E 100%)`
            : `linear-gradient(135deg, #4A5D23 0%, #303B16 100%)`,
          color: "white",
          position: "relative",
          mb: 2,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
          opacity: status === "blocked" ? 0.6 : 1,
          pointerEvents: status === "blocked" ? "none" : "auto",
          userSelect: "none",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: 1, textTransform: "uppercase", fontSize: "0.85rem" }}>
                Card<br />
                <Box component="span" sx={{ fontWeight: 400, opacity: 0.8 }}>bank</Box>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {balance.includes(" ") ? (
                <>
                  {balance.split(" ")[0]} <Typography component="span" variant="h6" sx={{ opacity: 0.8 }}>{balance.split(" ").slice(1).join(" ")}</Typography>
                </>
              ) : (
                balance
              )}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ letterSpacing: 1.5, opacity: 0.9 }}>
                {number.slice(0, 4)} **** **** {number.slice(-4)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
                {expire}
              </Typography>
              {owner && (
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, mt: 0.5, display: "block", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: 0.5 }}>
                  {formattedOwner}
                </Typography>
              )}
            </Box>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", px: 1, py: 0.5, borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", fontStyle: "italic" }}>
                {type}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {status === "blocked" && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              backdropFilter: "blur(2px)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "white",
                fontSize: "1.8rem",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {t("card_blocked")}
            </Typography>
          </Box>
        )}
      </Card>
    );
  }

  return (
    <Card
      onClick={status === "blocked" ? undefined : onClick}
      sx={{
        cursor: onClick && status !== "active" ? "default" : (onClick ? "pointer" : "default"),
        width: 340,
        height: 190,
        borderRadius: 4,
        background: isGreen
          ? `linear-gradient(135deg, #004B3D 0%, #007A65 100%)`
          : `linear-gradient(135deg, #2D3E33 0%, #1A2620 100%)`,
        color: "white",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0px 8px 16px rgba(0, 75, 61, 0.2)",
        flexShrink: 0,
        opacity: status === "blocked" ? 0.6 : 1,
        pointerEvents: status === "blocked" ? "none" : "auto",
        userSelect: "none",
      }}
    >
      <CardContent sx={{ h: "100%", p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.9 }}>
            {cardName}
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ mb: 2, letterSpacing: 2 }}>
          {number}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>
              Balance
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {balance}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>
              {expire}
            </Typography>
            {owner && (
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: "block", textTransform: "uppercase", fontSize: "0.7rem" }}>
                {formattedOwner}
              </Typography>
            )}
          </Box>
          <Typography variant="button" sx={{ opacity: 0.8, fontSize: "0.8rem", fontWeight: 800 }}>
            {type}
          </Typography>
        </Box>
      </CardContent>

      {status === "blocked" && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
            backdropFilter: "blur(2px)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "white",
              fontSize: "1.8rem",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {t("card_blocked")}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
