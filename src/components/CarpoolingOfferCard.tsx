import { useState } from 'react';
import { Car, Users, Clock, MapPin, Calendar, Edit, Trash2, X, Check } from 'lucide-react';

interface CarpoolingOfferCardProps {
  offer: {
    id: string;
    driver_first_name: string;
    driver_last_name: string;
    meeting_location: string;
    departure_time: string;
    available_seats: number;
    additional_info: string;
    management_code?: string;
  };
  availableSeats: number;
  onView: () => void;
  onUpdate?: (offerId: string) => void;
  onDelete?: (offerId: string) => void;
  showManagementButton?: boolean;
}

export default function CarpoolingOfferCard({
  offer,
  availableSeats,
  onView,
  onUpdate,
  onDelete,
  showManagementButton = false
}: CarpoolingOfferCardProps) {
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}.${lastName.charAt(0)}.`;
  };

  const formatDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleManageClick = (action: 'edit' | 'delete') => {
    setActionType(action);
    if (action === 'delete') {
      setShowDeleteConfirm(true);
    } else {
      setShowCodePrompt(true);
    }
    setCodeError('');
    setEnteredCode('');
  };

  const handleCodeSubmit = () => {
    if (enteredCode.toUpperCase() === offer.management_code) {
      setShowCodePrompt(false);
      if (actionType === 'edit' && onUpdate) {
        onUpdate(offer.id);
      }
    } else {
      setCodeError('Code incorrect. Vérifiez votre email.');
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setShowCodePrompt(true);
  };

  const handleDeleteWithCode = () => {
    if (enteredCode.toUpperCase() === offer.management_code) {
      setShowCodePrompt(false);
      if (onDelete) {
        onDelete(offer.id);
      }
    } else {
      setCodeError('Code incorrect. Vérifiez votre email.');
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all relative">
        {showManagementButton && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => handleManageClick('edit')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Modifier l'annonce"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManageClick('delete')}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Supprimer l'annonce"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-lg">
              {getInitials(offer.driver_first_name, offer.driver_last_name)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-1 text-pink-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Lieu de départ</p>
              <p className="font-medium">{offer.meeting_location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0 text-pink-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Date</p>
              <p className="font-medium">{formatDate(offer.departure_time)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 flex-shrink-0 text-pink-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Heure</p>
              <p className="font-medium">{formatTime(offer.departure_time)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 flex-shrink-0 text-pink-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Places disponibles</p>
              <p className="font-bold text-green-600 text-lg">{availableSeats}</p>
            </div>
          </div>
        </div>

        {offer.additional_info && (
          <p className="text-sm text-gray-500 italic mb-4 border-t border-gray-100 pt-3">
            "{offer.additional_info}"
          </p>
        )}

        <button
          onClick={onView}
          disabled={availableSeats === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {availableSeats === 0 ? 'Complet' : 'Rejoindre ce trajet'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer cette annonce de co-voiturage ?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-900">
                <strong>Attention :</strong> Un email d'annulation sera automatiquement envoyé à tous les passagers inscrits.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {actionType === 'edit' ? 'Modifier l\'annonce' : 'Supprimer l\'annonce'}
              </h3>
              <button
                onClick={() => setShowCodePrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Pour {actionType === 'edit' ? 'modifier' : 'supprimer'} cette annonce, entrez le code de gestion que vous avez reçu par email lors de la création de l'annonce.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de gestion *
              </label>
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                placeholder="Ex: ABC12345"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase text-center text-lg tracking-wider font-mono"
              />
              {codeError && (
                <p className="mt-2 text-sm text-red-600">{codeError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCodePrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={actionType === 'edit' ? handleCodeSubmit : handleDeleteWithCode}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
