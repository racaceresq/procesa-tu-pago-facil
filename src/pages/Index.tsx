import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PayPalCalculator from "@/components/PayPalCalculator";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <PayPalCalculator />
    <Features />
    <HowItWorks />
    <Testimonials />
    <CTASection />
    <Footer />
  </div>
);

export default Index;
