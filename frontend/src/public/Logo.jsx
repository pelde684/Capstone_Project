import fullUrl from "./logo.png";
import markUrl from "./logo-mark.png";

// Luggage Room logo.
//   variant="mark": the round emblem only (header, footer). `size` is the height in px.
//   variant="full": emblem plus the LUGGAGE ROOM title and tagline (login page).
//                   `size` is the widest it may be; it also never takes more than a third of the screen height.
export default function Logo({ variant = "mark", size, className = "" }) {
  if (variant === "full") {
    return (
      <img
        src={fullUrl}
        alt="Luggage Room, QR management system. Secure storage. Smarter collection."
        className={className}
        style={{
          display: "block",
          width: "100%",
          maxWidth: size ?? 300,
          maxHeight: "34vh",
          objectFit: "contain",
          height: "auto",
          margin: "0 auto",
        }}
      />
    );
  }
  return (
    <img
      src={markUrl}
      alt="Luggage Room logo"
      className={className}
      style={{ display: "block", height: size ?? 40, width: "auto", flex: "none" }}
    />
  );
}
