"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { unlockAdmin, unlockGallery, type UnlockState } from "./actions";

// One code box, used for both the guest code and the admin code.
// The code is checked by a Server Action on our server, never in the browser.
export function UnlockForm({ role }: { role: "guest" | "admin" }) {
  const t = useTranslations("Gallery");
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    role === "admin" ? unlockAdmin : unlockGallery,
    {},
  );

  return (
    <form action={action} className="mx-auto max-w-xs space-y-3">
      <label htmlFor={`code-${role}`} className="block text-center text-sm font-medium">
        {role === "admin" ? t("admin.codeLabel") : t("codeLabel")}
      </label>
      <input
        id={`code-${role}`}
        name="code"
        required
        autoComplete="off"
        autoCapitalize="characters"
        className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-center text-base tracking-[0.3em] uppercase outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        aria-invalid={Boolean(state.error)}
      />
      {state.error && (
        <p className="text-center text-sm text-rose" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-primary px-8 py-3.5 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark disabled:opacity-70"
      >
        {role === "admin" ? t("admin.signIn") : t("unlock")}
      </button>
    </form>
  );
}
