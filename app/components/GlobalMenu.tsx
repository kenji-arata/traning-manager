"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
const menuItems = [
  {
    path: "/traning_record",
    label: "トレーニング記録",
    icon: <FitnessCenterIcon />,
  },
  {
    path: "/traning_item",
    label: "トレーニング項目",
    icon: <ListAltIcon />,
  },
  {
    path: "/traning_template",
    label: "トレーニングテンプレート",
    icon: <DescriptionIcon />,
  },
];
export const GlobalMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: isOpen ? 280 : 72,
        background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
        boxShadow: isOpen
          ? "4px 0 24px rgba(102, 126, 234, 0.3)"
          : "2px 0 12px rgba(102, 126, 234, 0.2)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        onClick={toggleMenu}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isOpen ? "space-between" : "center",
          p: 2,
          cursor: "pointer",
          minHeight: 64,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.05)",
          },
          transition: "all 0.3s ease",
        }}
      >
        {isOpen ? (
          <>
            <Box
              sx={{
                color: "white",
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              メニュー
            </Box>
            <IconButton
              sx={{
                color: "white",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <MenuIcon sx={{ color: "white", fontSize: 28 }} />
        )}
      </Box>
      <List sx={{ flex: 1, pt: 2, px: 1, overflow: "hidden" }}>
        {menuItems.map((item) => {
          const isActive = pathname?.startsWith(item.path);
          const listItemButton = (
            <ListItemButton
              component={Link}
              href={item.path}
              selected={isActive}
              sx={{
                borderRadius: 2,
                py: 1.5,
                mb: 1,
                transition: "all 0.2s ease-in-out",
                justifyContent: isOpen ? "flex-start" : "center",
                "&.Mui-selected": {
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.25)",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "white",
                  minWidth: isOpen ? 48 : "auto",
                  justifyContent: "center",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isOpen && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.95rem",
                    color: "white",
                  }}
                />
              )}
            </ListItemButton>
          );
          return (
            <ListItem key={item.path} disablePadding>
              {isOpen ? (
                listItemButton
              ) : (
                <Tooltip title={item.label} placement="right" arrow>
                  {listItemButton}
                </Tooltip>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
