import type { TrackId } from "@/content/types";

export type Moment = "correct" | "streak" | "wrong" | "retry" | "done" | "perfect" | "welcome" | "idle";

/**
 * What each mascot says. One voice per animal:
 * Bird is warm and encouraging, Gecko is calm and precise, Fox is dry and brief.
 * Lines stay short and never talk down to the learner.
 */
const LINES: Record<TrackId, Record<Moment, string[]>> = {
  bird: {
    correct: ["Juste !", "Bien vu.", "Exactement.", "Tu l'as."],
    streak: ["Trois d'affilée !", "Tu es lancé.", "Ça déroule."],
    wrong: ["Pas tout à fait.", "Presque. Regarde l'explication.", "On la reverra."],
    retry: ["Deuxième chance.", "Cette fois, c'est la bonne."],
    done: ["Un cours de plus dans la poche.", "Beau travail."],
    perfect: ["Sans faute !", "Tout juste, du premier coup."],
    welcome: ["Content de te revoir.", "On reprend où tu t'étais arrêté ?"],
    idle: ["Prends ton temps."],
  },
  gecko: {
    correct: ["Correct.", "C'est ça.", "Bien raisonné.", "Juste."],
    streak: ["Trois sur trois.", "Régulier. J'aime ça.", "Série propre."],
    wrong: ["Pas encore.", "Erreur utile : lis la correction.", "À revoir, calmement."],
    retry: ["On la reprend.", "Même question, tête reposée."],
    done: ["Cours terminé. Les révisions feront le reste.", "C'est acquis pour aujourd'hui."],
    perfect: ["Zéro erreur.", "Maîtrisé du premier coup."],
    welcome: ["Prêt pour une séance ?", "Un pas par jour suffit."],
    idle: ["Lis bien l'énoncé."],
  },
  fox: {
    correct: ["Net.", "Validé.", "Bien joué.", "Oui."],
    streak: ["Trois de suite. Continue.", "Efficace.", "Rien à redire."],
    wrong: ["Raté. La correction vaut le détour.", "Non. Mais c'est un bon piège.", "À retravailler."],
    retry: ["Revanche.", "Deuxième passe."],
    done: ["Terminé. Suivant ?", "Une brique de plus."],
    perfect: ["Sans une erreur.", "Propre."],
    welcome: ["On s'y remet ?", "Au travail."],
    idle: ["À toi."],
  },
};

/** A line for the moment. `turn` rotates through the options so the same line does not repeat back to back. */
export function mascotLine(track: TrackId, moment: Moment, turn = 0): string {
  const lines = LINES[track][moment];
  return lines[Math.abs(turn) % lines.length];
}

export const MASCOT_NAME: Record<TrackId, string> = { bird: "Bird", gecko: "Gecko", fox: "Fox" };
