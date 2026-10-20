export default function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* Blurred photo layer */}
      <div
        className="fixed inset-0 bg-cover bg-center scale-110 blur-md"
        style={{
          backgroundImage: "url('/college.jpeg')",
        }}
      />

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-slate-950/65" />

      {/* Page content */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}