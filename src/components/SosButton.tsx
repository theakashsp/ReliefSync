import { useNavigate } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { useState } from "react";
import { HelplineDrawer } from "@/components/HelplineDrawer";

export function SosButton() {
  const navigate = useNavigate();
  const [showHelplines, setShowHelplines] = useState(false);

  // Long-press / right-click shows helplines
  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  const handlePointerDown = () => {
    pressTimer = setTimeout(() => {
      setShowHelplines(true);
    }, 600);
  };

  const handlePointerUp = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If was a long press (helplines shown) don't navigate
    if (showHelplines) return;
    navigate({ to: "/submit" });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowHelplines(true);
  };

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full gradient-emergency text-white font-bold shadow-elevated flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="Emergency SOS — tap to report, hold for helplines"
        title="Tap to report · Hold for helplines"
        style={{
          boxShadow: "0 0 0 0 oklch(0.7 0.22 25 / 0.6)",
          animation: "sos-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      >
        <Siren className="h-5 w-5" />
        <span className="text-[10px] tracking-widest mt-0.5">SOS</span>
      </button>

      {/* Helplines modal triggered by long press */}
      {showHelplines && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowHelplines(false)}
        >
          <div className="glass-strong rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Opening helplines via Navbar…
            </p>
          </div>
        </div>
      )}
    </>
  );
}
