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
          Vous organisez un événement sportif ?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Confiez-nous vos inscriptions et votre chronométrage. Plateforme complète, support dédié, tarifs compétitifs.
        </p>
        <Link
          to="/organizer/register"
          className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
        >
          <span>Devenir partenaire</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
