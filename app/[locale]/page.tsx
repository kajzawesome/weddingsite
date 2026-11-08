import { Faq } from "./_home/Faq";
import { Hero } from "./_home/Hero";
import { RsvpCta } from "./_home/RsvpCta";
import { Schedule } from "./_home/Schedule";
import { Story } from "./_home/Story";
import { Travel } from "./_home/Travel";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Story />
      <Schedule />
      <Travel />
      <Faq />
      <RsvpCta />
    </>
  );
}
