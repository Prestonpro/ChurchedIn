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
};

const BASE: Record<EventCategory, { icon: Icon; text: string; bg: string }> = {
  DINNER: { icon: ForkKnife, text: "text-cat-dinner", bg: "bg-cat-dinner-soft" },
  MENTORSHIP: { icon: UsersThree, text: "text-cat-mentorship", bg: "bg-cat-mentorship-soft" },
  COFFEE_CHAT: { icon: Coffee, text: "text-cat-coffee", bg: "bg-cat-coffee-soft" },
  STUDY_GROUP: { icon: BookOpen, text: "text-cat-study", bg: "bg-cat-study-soft" },
  CULTURAL_OUTING: { icon: Compass, text: "text-cat-cultural", bg: "bg-cat-cultural-soft" },
  AIRPORT_PICKUP: { icon: Airplane, text: "text-cat-airport", bg: "bg-cat-airport-soft" },
  HOLIDAY_CELEBRATION: { icon: Gift, text: "text-cat-holiday", bg: "bg-cat-holiday-soft" },
  OTHER: { icon: DotsThreeCircle, text: "text-cat-other", bg: "bg-cat-other-soft" },
};

export function categoryStyle(category: EventCategory): CategoryStyle {
  const base = BASE[category];
  return {
    label: EVENT_CATEGORY_LABELS[category],
    icon: base.icon,
    text: base.text,
    bg: base.bg,
    chipClass: `${base.bg} ${base.text}`,
  };
}

export const ALL_CATEGORIES = Object.keys(BASE) as EventCategory[];
