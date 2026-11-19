import { Link, NavLink } from "react-router-dom";
import Footer from "./Footer";
import Logo from "./Logo";
import "./public-layout.css";

// Page shell for logged-out pages: header, welcome area, footer.
// Usage:
//   <PublicLayout backgroundSrc={college} themeSlot={<ThemeToggle />}>
//     ...your login card...
//   </PublicLayout>
export default function PublicLayout({
  children,
  bannerSrc,            // optional: your own image to show instead of the logo
  backgroundSrc,        // campus photo behind the welcome area (optional)
  themeSlot = null,     // e.g. <ThemeToggle />
  themeSlotCompact = null, // optional smaller version for phones, e.g. <ThemeToggle iconOnly />
  showBrandText = false,   // the big logo already says "Luggage Room", so the header shows only the emblem
  loginPath = "/",
  registerPath = "/signup",
}) {
  return (
    <div className="pl">
      <header className="pl-header">
        <Link to={loginPath} className="pl-brand" aria-label="Luggage Room, home">
          <Logo variant="mark" size={44} />
          {showBrandText && (
            <span>
              <strong>Luggage Room</strong>
              <small>QR Management System</small>
            </span>
          )}
        </Link>
        <nav className="pl-nav" aria-label="Account">
          <NavLink to={loginPath} end className={({ isActive }) => `pl-link${isActive ? " active" : ""}`}>
            Log in
          </NavLink>
          <Link to={registerPath} className="pl-btn">Register</Link>
          <span className="pl-theme-full">{themeSlot}</span>
          <span className="pl-theme-compact">{themeSlotCompact ?? themeSlot}</span>
        </nav>
      </header>

      <main
        className="pl-hero"
        style={backgroundSrc ? { backgroundImage: `url(${backgroundSrc})` } : undefined}
      >
        <div className="pl-hero-tint" />
        <div className="pl-stack">
          {bannerSrc ? (
            <img className="pl-banner" src={bannerSrc} alt="Luggage Room, QR management system" />
          ) : (
            <div className="pl-logo-full">
              <Logo variant="full" size={280} />
            </div>
          )}
          {children}
        </div>
      </main>

      <Footer loginPath={loginPath} registerPath={registerPath} />
    </div>
  );
}
