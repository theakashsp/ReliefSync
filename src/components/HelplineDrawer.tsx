import { useState } from "react";
import { Phone, X, ExternalLink } from "lucide-react";

const NATIONAL_LINES = [
  { name: "National Emergency", num: "112", desc: "Police · Fire · Ambulance" },
  { name: "Ambulance (EMRI)", num: "108", desc: "Emergency medical response" },
  { name: "Fire Department", num: "101", desc: "Fire emergencies" },
  { name: "Police", num: "100", desc: "Law & order" },
  { name: "NDRF", num: "011-26107923", desc: "National Disaster Response Force" },
];

const KARNATAKA_LINES = [
  { name: "BBMP Control Room", num: "1533", desc: "Bengaluru flood & disaster" },
  { name: "KSNDMC", num: "1070", desc: "Karnataka State Disaster Management" },
  { name: "Civil Supplies", num: "1967", desc: "Food & essential supply" },
  { name: "Women Helpline", num: "181", desc: "Women in distress" },
  { name: "Child Helpline", num: "1098", desc: "Children in distress" },
];

export function HelplineDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition-all"
        aria-label="Open emergency helplines"
        id="helpline-trigger"
      >
        <Phone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Helplines</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg gradient-emergency flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">Emergency Helplines</h2>
                    <p className="text-xs text-muted-foreground">Tap any number to call</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* National */}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-1">
                National
              </p>
              <div className="space-y-2">
                {NATIONAL_LINES.map((h) => (
                  <a
                    key={h.num}
                    href={`tel:${h.num.replace(/\s/g, "")}`}
                    className="flex items-center justify-between glass rounded-xl px-4 py-3 hover:border-primary/40 transition group"
                  >
                    <div>
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {h.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{h.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xl text-primary">{h.num}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Karnataka */}
            <div className="p-4 pt-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-1">
                Karnataka & Bengaluru
              </p>
              <div className="space-y-2">
                {KARNATAKA_LINES.map((h) => (
                  <a
                    key={h.num}
                    href={`tel:${h.num.replace(/\s/g, "")}`}
                    className="flex items-center justify-between glass rounded-xl px-4 py-3 hover:border-primary/40 transition group"
                  >
                    <div>
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {h.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{h.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-lg text-primary">{h.num}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="px-4 pb-6">
              <p className="text-xs text-center text-muted-foreground glass rounded-xl p-3">
                These are official government helplines. ReliefLink AI is a coordination aid and does not replace emergency services.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
