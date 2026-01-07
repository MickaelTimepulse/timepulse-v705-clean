import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background image with 50% opacity - Mountain landscape */}
      <div
        className="absolute inset-0 opacity-50 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      ></div>

      {/* White overlay for softening */}
      <div className="absolute inset-0 bg-white/40"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Calendar className="w-16 h-16 text-pink-600 mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Votre événement mérite un partenaire d'excellence
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Chronométrage haute précision. Inscriptions illimitées. Support réactif. De l'inscription au podium, on gère tout.
        </p>
        <Link
          to="/organizer/register"
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-2 border-orange-400 hover:border-orange-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 font-bold tracking-wider bg-gradient-to-r from-white via-orange-50 to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] text-lg" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif", letterSpacing: '0.02em' }}>
            Devenir partenaire
          </span>
          <ArrowRight className="w-5 h-5 relative z-10 text-orange-400 group-hover:text-orange-300 transition-colors" />
          <div className="absolute top-0 -right-12 w-24 h-full bg-white/10 transform skew-x-12 group-hover:right-full transition-all duration-700"></div>
        </Link>
      </div>
    </section>
  );
}
