import Link from "next/link";
import { List, CalendarDots, MapTrifold } from "@phosphor-icons/react/dist/ssr";

export type EventViewMode = "list" | "calendar" | "map";

export function EventViewToggle({ currentView, dark = false }: { currentView: EventViewMode; dark?: boolean }) {
  const views = [
    { id: "list", label: "List", icon: List, href: "/events" },
    { id: "calendar", label: "Calendar", icon: CalendarDots, href: "/events/calendar" },
    { id: "map", label: "Map", icon: MapTrifold, href: "/events/map" },
  ];

  const containerClasses = dark 
    ? "flex items-center gap-1 rounded-lg p-1 bg-white/5 border border-white/10"
    : "flex items-center gap-1 rounded-lg border border-line-strong p-1 bg-paper/50";

  return (
    <div className={containerClasses}>
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        const activeClasses = dark
          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
          : "bg-surface text-ink shadow-sm ring-1 ring-line";
          
        const inactiveClasses = dark
          ? "text-white/60 hover:bg-white/10 hover:text-white"
          : "text-ink-soft hover:bg-surface/50 hover:text-ink";

        return (
          <Link
            key={view.id}
            href={view.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            <Icon weight={isActive ? "bold" : "regular"} className="size-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
