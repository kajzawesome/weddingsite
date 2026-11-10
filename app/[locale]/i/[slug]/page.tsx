import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { event } from "@/config/event";
import { getGuest } from "@/lib/sheet";
import { EnvelopeIntro } from "../../_home/EnvelopeIntro";
import { HomeSections } from "../../_home/HomeSections";
import { MarkOpened } from "./MarkOpened";

/*
  A guest's personal invite, e.g. /pt/i/ana-silva. The envelope says
  "Para Ana" and waits for a tap; then it's the same invite as the home page.
  The name comes from the Guests tab of the RSVP sheet (lib/sheet.ts).
*/

type Props = PageProps<"/[locale]/i/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [t, guest] = await Promise.all([getTranslations("Invite"), getGuest(slug)]);
  const meta = await getTranslations("Meta");
  const title = guest ? t("metaTitle", { name: guest.name }) : meta("title", event.couple);
  const description = t("metaDescription", event.couple);
  return { title, description, openGraph: { title, description }, robots: { index: false } };
}

export default function InvitePage({ params }: Props) {
  return (
    <>
      {/* The sealed envelope shows straight away; the name fills in a moment later. */}
      <Suspense fallback={<Envelope />}>
        <PersonalEnvelope params={params} />
      </Suspense>
      <HomeSections />
    </>
  );
}

async function PersonalEnvelope({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const guest = await getGuest(slug);
  if (!guest) return <Envelope />; // a mistyped link still gets the invite
  return (
    <>
      <Envelope name={guest.name} />
      <MarkOpened slug={guest.slug} />
    </>
  );
}

async function Envelope({ name }: { name?: string }) {
  const [hero, t] = await Promise.all([getTranslations("Hero"), getTranslations("Invite")]);
  return (
    <EnvelopeIntro
      first={event.couple.first}
      second={event.couple.second}
      kicker={hero("kicker")}
      skip={hero("skip")}
      to={name ? t("to", { name }) : undefined}
      tapHint={t("tap")}
    />
  );
}
