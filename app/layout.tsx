import "./globals.css";
import { GlobalMenu } from "./components/GlobalMenu";
import { ThemeRegistry } from "./components/ThemeRegistry";
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeRegistry>
          <GlobalMenu />
          <div style={{ marginLeft: 72 }}>{children}</div>
        </ThemeRegistry>
      </body>
    </html>
  );
};
export default RootLayout;
