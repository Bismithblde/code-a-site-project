import { createClient } from "@/lib/supabase/server";
import { OceanHeroSection } from "@/components/hero/OceanHeroSection";
import { WaveDivider } from "@/components/animation/WaveDivider";
import { HomePinnedStory } from "@/components/home/HomePinnedStory";

export default async function HomePage() {
  await createClient();

  return (
    <>
      {/* Ocean Hero - full viewport scroll experience */}
      <div className="-mt-16">
        <OceanHeroSection />
      </div>

      <WaveDivider variant="gentle" />

      <div className="pb-20 md:pb-28">
        <HomePinnedStory />
      </div>
    </>
  );
}
