import { useState } from 'react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import Hero from '../components/Home/Hero';
import EventCarousel from '../components/Home/EventCarousel';
import Features from '../components/Home/Features';
import Stats from '../components/Home/Stats';
import CTA from '../components/Home/CTA';

export default function Home() {
  const [filters, setFilters] = useState<{
    searchText: string;
    selectedSport: string;
    selectedMonth: string;
    selectedCharacteristics: string[];
  } | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero onFiltersChange={setFilters} />
        <EventCarousel filters={filters} />
        <Stats />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
