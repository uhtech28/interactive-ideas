import HeroSection from "@/components/hero-section";
import RoleSelector from "@/components/role-selector";
import FooterSection from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1100px] mx-auto px-4">
        <HeroSection />
        <RoleSelector />
      </div>

      <div className="max-w-[720px] mx-auto px-4">
        <FooterSection />
      </div>
    </div>
  );
}
