import "./globals.css";
import { ThemeRegistry } from "./components/ThemeRegistry";
import { AppShell } from "./components/AppShell";
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
};
export default RootLayout;
