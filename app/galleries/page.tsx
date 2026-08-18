import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { GalleriesView } from "@/components/pages/GalleriesView";
import { loadLiveAlbums } from "@/lib/albums";

export const metadata: Metadata = {
  title: "Galleries",
  description:
    "Piles rather than folders — landscape and street photographs sorted by walk, drive and weather.",
};

export default async function GalleriesPage() {
  return (
    <Shell>
      <GalleriesView albums={await loadLiveAlbums()} />
    </Shell>
  );
}
