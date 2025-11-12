import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Info, Copy, Check, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface EmailVariable {
  category: string;
  variable_key: string;
  variable_name: string;
  description: string;
}

interface EmailVariablesPanelProps {
  onVariableCopy?: (variable: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  athlete: 'Athlète',
  event: 'Événement',
  race: 'Course',
  registration: 'Inscription',
  options: 'Options'
};

const CATEGORY_COLORS: Record<string, string> = {
  athlete: 'bg-blue-100 text-blue-800',
  event: 'bg-green-100 text-green-800',
  race: 'bg-purple-100 text-purple-800',
  registration: 'bg-orange-100 text-orange-800',
  options: 'bg-pink-100 text-pink-800'
};

export default function EmailVariablesPanel({ onVariableCopy }: EmailVariablesPanelProps) {
  const [variables, setVariables] = useState<EmailVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['athlete', 'event', 'race', 'registration'])
  );

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_available_email_variables');

      if (error) throw error;
      setVariables(data || []);
    } catch (err) {
      console.error('Error loading variables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVariable = (variableKey: string) => {
    const formattedVariable = `{{${variableKey}}}`;
    navigator.clipboard.writeText(formattedVariable);
    setCopiedVariable(variableKey);
    onVariableCopy?.(formattedVariable);

    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredVariables = variables.filter(v => {
    const query = searchQuery.toLowerCase();
    return (
      v.variable_key.toLowerCase().includes(query) ||
      v.variable_name.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query)
    );
  });

  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, EmailVariable[]>);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Chargement des variables...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Variables disponibles</h3>
            <p className="text-sm text-gray-600 mt-1">
              Cliquez sur une variable pour la copier et l'utiliser dans vos templates d'emails
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une variable..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {Object.entries(groupedVariables).map(([category, vars]) => (
          <div key={category} className="border-b border-gray-200 last:border-b-0">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-xs font-semibold px-2 py-1 rounded ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}`}>
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-sm text-gray-600">
                  {vars.length} variable{vars.length > 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {expandedCategories.has(category) && (
              <div className="px-6 pb-3 space-y-1">
                {vars.map((variable) => (
                  <button
                    key={variable.variable_key}
                    onClick={() => handleCopyVariable(variable.variable_key)}
                    className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-blue-600 font-semibold">
                            {`{{${variable.variable_key}}}`}
                          </code>
                          {copiedVariable === variable.variable_key && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Check className="w-3 h-3" />
                              Copié
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {variable.variable_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {variable.description}
                        </div>
                      </div>
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedVariables).length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune variable trouvée</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Variables d'options dynamiques</p>
              <p>
                Les variables d'options (ex: <code className="bg-yellow-100 px-1 py-0.5 rounded">option_tshirt_size</code>)
                sont générées automatiquement selon les options que vous configurez pour chaque course.
              </p>
              <p className="mt-2">
                Format : <code className="bg-yellow-100 px-1 py-0.5 rounded">option_[nom_option]</code>
              </p>
              <p className="mt-1 text-xs">
                Exemple : Si vous créez une option "T-shirt" avec choix de taille, la variable sera
                <code className="bg-yellow-100 px-1 py-0.5 rounded mx-1">option_t_shirt</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
