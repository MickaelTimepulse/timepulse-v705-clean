import { useState, useRef } from 'react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import Hero from '../components/Home/Hero';
import EventList from '../components/Home/EventList';
import Features from '../components/Home/Features';
import Stats from '../components/Home/Stats';
import CTA from '../components/Home/CTA';

export default function Home() {
  const [heroFilters, setHeroFilters] = useState<{ month: string; sport: string; region: string } | null>(null);

  const handleHeroSearch = (filters: { month: string; sport: string; region: string }) => {
    setHeroFilters(filters);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero onSearch={handleHeroSearch} />
        <EventList heroFilters={heroFilters} />
        <Stats />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
