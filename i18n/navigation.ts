import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Link, useRouter etc. Use these instead of next/link.
export const { Link, usePathname, useRouter, getPathname } =
  createNavigation(routing);
