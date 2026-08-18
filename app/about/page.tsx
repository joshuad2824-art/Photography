import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { AboutView } from "@/components/pages/AboutView";

export const metadata: Metadata = {
  title: "About",
  description:
    "Joshua Davis — hospital IT by day, student minister by heart, photographs in whatever's left of the evening.",
};

export default async function AboutPage() {
  return (
    <Shell>
      <AboutView />
    </Shell>
  );
}
