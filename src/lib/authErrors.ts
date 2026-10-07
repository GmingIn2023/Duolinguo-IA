/** Supabase auth messages, in the learner's language with a way forward. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect. Vérifie-les, ou crée un compte.";
  if (m.includes("email not confirmed")) return "Ton email n'est pas encore confirmé. Ouvre le lien reçu par email, puis reconnecte-toi.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Un compte existe déjà avec cet email. Connecte-toi plutôt.";
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak"))) return "Mot de passe trop court : 8 caractères minimum.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives d'un coup. Attends une minute puis réessaie.";
  if (m.includes("invalid") && m.includes("email")) return "Cette adresse email n'a pas l'air valide.";
  if (m.includes("fetch") || m.includes("network")) return "Connexion impossible. Vérifie ta connexion internet et réessaie.";
  return `Ça n'a pas marché : ${message}`;
}
