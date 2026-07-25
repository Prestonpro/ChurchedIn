import type { Icon } from "@phosphor-icons/react";
import {
  ForkKnife,
  UsersThree,
  Coffee,
  BookOpen,
  Compass,
  Airplane,
  Gift,
  DotsThreeCircle,
} from "@phosphor-icons/react/dist/ssr";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/lib/constants";

type CategoryStyle = {
  label: string;
  icon: Icon;
  text: string;
  bg: string;
  chipClass: string;
  /** Solid (non-"-soft") background class — used for small dots/markers,
   * e.g. the calendar view's per-day event indicators, where the pale
   * "-soft" tone doesn't read clearly at that size. */
  dot: string;
};

const BASE: Record<EventCategory, { icon: Icon; text: string; bg: string; dot: string }> = {
  DINNER: { icon: ForkKnife, text: "text-cat-dinner", bg: "bg-cat-dinner-soft", dot: "bg-cat-dinner" },
  MENTORSHIP: { icon: UsersThree, text: "text-cat-mentorship", bg: "bg-cat-mentorship-soft", dot: "bg-cat-mentorship" },
  COFFEE_CHAT: { icon: Coffee, text: "text-cat-coffee", bg: "bg-cat-coffee-soft", dot: "bg-cat-coffee" },
  STUDY_GROUP: { icon: BookOpen, text: "text-cat-study", bg: "bg-cat-study-soft", dot: "bg-cat-study" },
  CULTURAL_OUTING: { icon: Compass, text: "text-cat-cultural", bg: "bg-cat-cultural-soft", dot: "bg-cat-cultural" },
  AIRPORT_PICKUP: { icon: Airplane, text: "text-cat-airport", bg: "bg-cat-airport-soft", dot: "bg-cat-airport" },
  HOLIDAY_CELEBRATION: { icon: Gift, text: "text-cat-holiday", bg: "bg-cat-holiday-soft", dot: "bg-cat-holiday" },
  OTHER: { icon: DotsThreeCircle, text: "text-cat-other", bg: "bg-cat-other-soft", dot: "bg-cat-other" },
};

export function categoryStyle(category: EventCategory): CategoryStyle {
  const base = BASE[category];
  return {
    label: EVENT_CATEGORY_LABELS[category],
    icon: base.icon,
    text: base.text,
    bg: base.bg,
    chipClass: `${base.bg} ${base.text}`,
    dot: base.dot,
  };
}

export const ALL_CATEGORIES = Object.keys(BASE) as EventCategory[];
