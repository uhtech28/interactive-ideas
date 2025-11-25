import HeroSection from "@/components/hero-section";
import FAQsTwo from "@/components/faqs-2";
import WallOfLoveSection from "@/components/testimonials";
import FooterSection from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[720px] mx-auto px-4">
        <HeroSection />
        <FAQsTwo />
      </div>
      
      <WallOfLoveSection />
      
      <div className="max-w-[720px] mx-auto px-4">
        <FooterSection />
      </div>
    </div>
  );
}
