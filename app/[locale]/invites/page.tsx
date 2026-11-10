import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { galleryAccess } from "@/lib/gallery";
import { listGuests, type Guest } from "@/lib/sheet";
import { Flourish } from "../_components/Flourish";
import { UnlockForm } from "../gallery/UnlockForm";
import { InviteList, type InviteRow } from "./InviteList";
import { inviteLink, whatsappLink } from "./inviteLinks";

// For KAJ and Tayna: everyone on the guest list, with buttons to send each
// personal invite by email or WhatsApp, and who has opened theirs.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Invite.admin");
  return { title: t("title"), robots: { index: false } };
}

export default async function InvitesPage() {
  const t = await getTranslations("Invite.admin");
  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 pb-14">
      <h1 className="text-center font-serif text-5xl">{t("title")}</h1>
      <Flourish className="my-5" />
      <Suspense fallback={<div className="h-48" />}>
        <InvitesBody />
      </Suspense>
    </div>
  );
}

async function InvitesBody() {
  const t = await getTranslations("Invite.admin");
  if (!(await galleryAccess()).admin) {
    return (
      <div className="glass mx-auto max-w-md rounded-[2rem] p-6 text-center sm:p-8">
        <p className="mb-6 leading-relaxed text-muted">{t("intro")}</p>
        <UnlockForm role="admin" />
      </div>
    );
  }

  let guests: Guest[];
  try {
    guests = await listGuests();
  } catch (err) {
    console.error("Couldn't read guest list", err);
    return <p className="glass rounded-[2rem] p-6 text-center text-muted">{t("error")}</p>;
  }
  if (guests.length === 0) {
    return <p className="glass rounded-[2rem] p-6 text-center leading-relaxed text-muted">{t("empty")}</p>;
  }

  const rows: InviteRow[] = await Promise.all(
    guests.map(async (g) => ({
      slug: g.slug,
      name: g.name,
      lang: g.lang,
      hasEmail: Boolean(g.email),
      link: inviteLink(g),
      whatsappHref: await whatsappLink(g),
      emailed: g.emailed,
      whatsapp: g.whatsapp,
      opened: g.opened,
    })),
  );
  return <InviteList rows={rows} />;
}
