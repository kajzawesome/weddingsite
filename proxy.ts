import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends "/" to "/en" (or the guest's browser language), and remembers the
// language a guest picks in a NEXT_LOCALE cookie.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and files with an extension (images etc.)
  matcher: "/((?!api|_next|_vercel|.*\..*).*)",
};
