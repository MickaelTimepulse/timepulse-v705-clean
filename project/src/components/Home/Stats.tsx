import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function Stats() {
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [chronometeredEvents, setChronometeredEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const calculateYearsOfExperience = () => {
    const foundingYear = 2009;
    const currentYear = new Date().getFullYear();
    return currentYear - foundingYear;
  };

  const fetchTotalRaces = async () => {
    try {
      const { count, error } = await supabase
        .from('races')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return (count || 0) + 4888;
    } catch (err) {
      console.error('Error fetching races:', err);
      return 4888;
    }
  };

  const fetchTotalRegistrations = async () => {
    try {
      const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return (count || 0) + 1600000;
    } catch (err) {
      console.error('Error fetching registrations:', err);
      return 1600000;
    }
  };

  const easeOutQuad = (t: number): number => {
    return t * (2 - t);
  };

  const animateValue = (
    start: number,
    end: number,
    duration: number,
    setter: (value: number) => void,
    isDecimal: boolean = false
  ) => {
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      const current = start + (end - start) * easedProgress;

      if (isDecimal) {
        setter(Math.round(current * 10) / 10);
      } else {
        setter(Math.floor(current));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setter(end);
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            const years = calculateYearsOfExperience();
            animateValue(0, years, 2000, setYearsOfExperience);

            fetchTotalRaces().then((total) => {
              animateValue(0, total, 2500, setChronometeredEvents);
            });

            fetchTotalRegistrations().then((total) => {
              animateValue(0, total, 2500, setTotalParticipants);
            });

            animateValue(0, 99.9, 2000, setSatisfaction, true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated]);

  const formatNumber = (num: number, forceFullNumber: boolean = false): string => {
    if (forceFullNumber) {
      return num.toLocaleString('fr-FR');
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return num.toString();
  };

  const stats = [
    {
      value: yearsOfExperience > 0 ? `${yearsOfExperience}` : '0',
      label: 'Années d\'expérience',
      suffix: ''
    },
    {
      value: chronometeredEvents > 0 ? formatNumber(chronometeredEvents, true) : '0',
      label: 'Événements chronométrés',
      suffix: ''
    },
    {
      value: totalParticipants > 0 ? formatNumber(totalParticipants) : '0',
      label: 'Participants inscrits',
      suffix: ''
    },
    {
      value: satisfaction > 0 ? satisfaction.toFixed(1) : '0',
      label: 'Satisfaction client',
      suffix: '%'
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      {/* Background Image - Open Water Swimming */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/85"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center transform hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-white/90 font-medium text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  );
}
