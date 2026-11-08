export default function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* Blurred photo layer */}
      <div
        className="fixed inset-0 scale-110 bg-cover bg-center blur-md"
        style={{ backgroundImage: "url('/college.jpeg')" }}
      />

      {/* Overlay: dark in dark mode, light in light mode */}
      <div className="fixed inset-0 bg-slate-950/65 [html[data-theme='light']_&]:bg-slate-100/70" />

      {/* Page content */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}