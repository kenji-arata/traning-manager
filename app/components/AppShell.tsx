"use client";

import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { GlobalMenu, MENU_DIMENSIONS } from "./GlobalMenu";

type Props = {
  children: React.ReactNode;
};

export const AppShell = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  if (isMobile) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: MENU_DIMENSIONS.header,
            background: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
          }}
        >
          <IconButton
            aria-label="グローバルメニューを開く"
            onClick={toggleMenu}
            sx={{ color: "white" }}
          >
            <MenuIcon />
          </IconButton>
        </div>
        {isMenuOpen && (
          <div
            onClick={() => setIsMenuOpen(false)}
            style={{
              position: "fixed",
              top: MENU_DIMENSIONS.header,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 30,
              transition: "opacity 0.3s ease",
            }}
          />
        )}
        <GlobalMenu mode="mobile" isOpen={isMenuOpen} onToggle={toggleMenu} />
        <div style={{ paddingTop: MENU_DIMENSIONS.header }}>{children}</div>
      </>
    );
  }

  return (
    <>
      <GlobalMenu mode="desktop" isOpen={isMenuOpen} onToggle={toggleMenu} />
      <div
        style={{
          marginLeft: isMenuOpen ? MENU_DIMENSIONS.open : MENU_DIMENSIONS.closed,
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </>
  );
};
