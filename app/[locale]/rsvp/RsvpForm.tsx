"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Link } from "@/i18n/navigation";
import { submitRsvp, type RsvpState } from "./actions";

const input =
  "w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-base outline-none placeholder:text-muted/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
const label = "mb-1.5 block text-sm font-medium";

export function RsvpForm() {
  const t = useTranslations("Rsvp");
  const locale = useLocale();
  // useActionState runs our Server Action and gives back its result + a "pending" flag.
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, { status: "idle" });
  const [attending, setAttending] = useState<"yes" | "no">("yes");

  if (state.status === "done") {
    return (
      <div className="text-center" role="status">
        <h2 className="font-serif text-4xl">{t("thanks", { name: state.name })}</h2>
        <p className="mt-3 leading-relaxed text-muted">{state.attending ? t("doneYes") : t("doneNo")}</p>
        <Link href="/" className="mt-8 inline-block text-primary-dark underline underline-offset-4">
          {t("back")}
        </Link>
      </div>
    );
  }

  const fields = state.status === "error" ? state.fields ?? {} : {};

  return (
    <form action={action} className="space-y-5" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot for spam bots: hidden from people and screen readers */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div>
        <label htmlFor="name" className={label}>{t("fields.name")}</label>
        <input id="name" name="name" required minLength={2} autoComplete="name" className={input} aria-invalid={!!fields.name} />
        {fields.name && <p className="mt-1 text-sm text-rose">{fields.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className={label}>{t("fields.email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className={input} aria-invalid={!!fields.email} />
        <p className="mt-1 text-xs text-muted">{t("fields.emailHint")}</p>
        {fields.email && <p className="mt-1 text-sm text-rose">{fields.email}</p>}
      </div>

      <fieldset>
        <legend className={label}>{t("fields.attending")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-2xl border px-4 py-3 text-center transition ${
                attending === value
                  ? "border-primary bg-primary text-paper"
                  : "border-white/80 bg-white/70 hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="attending"
                value={value}
                checked={attending === value}
                onChange={() => setAttending(value)}
                className="sr-only"
              />
              {t(`fields.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {attending === "yes" && (
        <div>
          <label htmlFor="guests" className={label}>{t("fields.guests")}</label>
          <select id="guests" name="guests" defaultValue="1" className={input}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {t("fields.guestOption", { count: n })}
              </option>
            ))}
          </select>
          {fields.guests && <p className="mt-1 text-sm text-rose">{fields.guests}</p>}
        </div>
      )}

      <div>
        <label htmlFor="message" className={label}>
          {t("fields.message")} <span className="font-normal text-muted">({t("fields.optional")})</span>
        </label>
        <textarea id="message" name="message" rows={3} maxLength={1000} className={input} />
      </div>

      {state.status === "error" && (
        <p className="rounded-2xl bg-blush/70 px-4 py-3 text-sm" role="alert">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-primary px-8 py-3.5 font-medium text-paper shadow-lg shadow-primary/20 ring-1 ring-gold/40 hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
