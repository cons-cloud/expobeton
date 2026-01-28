// Configuration des identifiants autorisés depuis les variables d'environnement
export const ALLOWED_CREDENTIALS = {
  email: import.meta.env.VITE_ALLOWED_EMAIL || 'expobeton@gmail.com',
  password: import.meta.env.VITE_ALLOWED_PASSWORD || 'Expobeton1@'
};

// Fonction pour valider les identifiants
export const validateCredentials = (email: string, password: string): boolean => {
  return email === ALLOWED_CREDENTIALS.email && password === ALLOWED_CREDENTIALS.password;
};

// Fonction pour vérifier si l'email est autorisé
export const isEmailAllowed = (email: string): boolean => {
  return email === ALLOWED_CREDENTIALS.email;
};
