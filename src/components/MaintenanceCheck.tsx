import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkMaintenanceMode();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkMaintenanceMode, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMaintenanceMode === true) {
      // Sauvegarder le message dans localStorage pour la page maintenance
      if (maintenanceMessage) {
        localStorage.setItem('maintenance_message', maintenanceMessage);
      }

      // Autoriser l'accès aux routes admin
      if (!location.pathname.startsWith('/admin')) {
        navigate('/maintenance', { replace: true });
      }
    } else if (isMaintenanceMode === false && location.pathname === '/maintenance') {
      // Si le mode maintenance est désactivé et qu'on est sur la page maintenance, rediriger
      navigate('/', { replace: true });
    }
  }, [isMaintenanceMode, location.pathname, navigate, maintenanceMessage]);

  async function checkMaintenanceMode() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);

      if (error) throw error;

      const maintenanceModeSetting = data?.find(s => s.key === 'maintenance_mode');
      const maintenanceMessageSetting = data?.find(s => s.key === 'maintenance_message');

      const isEnabled = maintenanceModeSetting?.value === 'true';

      setIsMaintenanceMode(isEnabled);
      setMaintenanceMessage(
        maintenanceMessageSetting?.value ||
        'Nous effectuons actuellement une maintenance programmée pour améliorer votre expérience.'
      );
    } catch (error) {
      console.error('Erreur lors de la vérification du mode maintenance:', error);
      setIsMaintenanceMode(false);
    }
  }

  // Pendant le chargement, ne rien afficher
  if (isMaintenanceMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
