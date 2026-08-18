import { Shell } from "@/components/Shell";
import { HomeView } from "@/components/pages/HomeView";
import { loadHomePicks } from "@/lib/albums";

export default async function HomePage() {
  const picks = await loadHomePicks();

  return (
    <Shell>
      <HomeView picks={picks} />
    </Shell>
  );
}
