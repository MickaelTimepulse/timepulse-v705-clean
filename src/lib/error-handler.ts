export interface ErrorDetails {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
}

export function handleSupabaseError(error: any): ErrorDetails {
  if (!error) {
    return { message: 'Une erreur inconnue est survenue' };
  }

  // Supabase PostgrestError
  if (error.message) {
    let message = error.message;

    // RLS errors
    if (message.includes('row-level security policy')) {
      message = 'Vous n\'avez pas les permissions nécessaires pour cette action.';
    }

    // Foreign key errors
    if (message.includes('foreign key constraint')) {
      message = 'Impossible de supprimer : des données dépendent de cet élément.';
    }

    // Unique constraint errors
    if (message.includes('unique constraint')) {
      message = 'Cette valeur existe déjà dans la base de données.';
    }

    // Not null constraint errors
    if (message.includes('null value')) {
      message = 'Certains champs obligatoires sont manquants.';
    }

    return {
      message,
      code: error.code,
      hint: error.hint,
      details: error.details
    };
  }

  return { message: error.toString() };
}

export function showErrorToast(error: any, customMessage?: string): string {
  const errorDetails = handleSupabaseError(error);
  return customMessage || errorDetails.message;
}
