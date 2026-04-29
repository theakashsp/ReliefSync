import { useEffect, useMemo, useRef, useState } from "react";

interface TickerItem {
  id: string;
  text: string;
  color?: string;
}

interface ActivityTickerProps {
  items: TickerItem[];
}

export function ActivityTicker({ items }: ActivityTickerProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  const doubled = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden glass border-b border-border h-8 flex items-center"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s" }}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-0 whitespace-nowrap"
        style={{
          animation: "ticker-scroll 40s linear infinite",
          display: "flex",
          willChange: "transform",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-center gap-2 px-6 text-xs"
          >
            <span
              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
              style={{ background: item.color || "currentColor" }}
            />
            <span className={item.color ? "" : "text-muted-foreground"} style={item.color ? { color: item.color } : {}}>
              {item.text}
            </span>
            <span className="text-muted-foreground/30 mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
