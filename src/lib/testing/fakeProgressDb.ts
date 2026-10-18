import type { AwardArgs, AwardResult, LessonProgressRow, LessonProgressWrite, ProgressDb, ReviewRow, ReviewWrite } from "../progressDb";

/**
 * An in-memory MODEL of the progress tables and of the award_xp function, for tests only.
 *
 * It is not the real database. It reproduces what the logic relies on:
 * - every method is atomic (check and write happen in one synchronous step);
 * - every method first yields to the event loop, so two requests started together really interleave step by step
 *   (both read before either writes), which is what exposes read-then-write races;
 * - award_xp follows supabase/migrations/20261017000000 (replay window, one-off unique claims, amount range).
 * What the real database does (locks, transactions, SQL syntax) can only be checked by running the SQL tests in supabase/tests.
 */
type Event = { userId: string; amount: number; source: string; ref: string; at: number };
type Profile = { xp: number; streak: number; lastActive: string | null };

export class FakeProgressDb implements ProgressDb {
  lessonProgress = new Map<string, LessonProgressRow & { last_completed_at: string }>();
  reviewItems = new Map<string, ReviewRow & { last_reviewed_at: string | null }>();
  events: Event[] = [];
  profiles = new Map<string, Profile>();
  /** The model's clock, in milliseconds; tests move it to cross the replay window. */
  clock = Date.UTC(2026, 9, 17, 10, 0, 0);
  /** Counts how many compare-and-swap writes were refused: proof that a race really happened. */
  refusedWrites = 0;

  private async tick() {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  private key = (userId: string, id: string) => `${userId}|${id}`;
  private profile(userId: string): Profile {
    if (!this.profiles.has(userId)) this.profiles.set(userId, { xp: 0, streak: 0, lastActive: null });
    return this.profiles.get(userId)!;
  }

  async getLessonProgress(userId: string, lessonId: string) {
    await this.tick();
    const row = this.lessonProgress.get(this.key(userId, lessonId));
    return row ? { best_score: row.best_score, attempts: row.attempts, xp_earned: row.xp_earned, first_completed_at: row.first_completed_at } : null;
  }

  async insertLessonProgress(userId: string, lessonId: string, row: LessonProgressWrite & { first_completed_at: string }) {
    await this.tick();
    const k = this.key(userId, lessonId);
    if (this.lessonProgress.has(k)) {
      this.refusedWrites++;
      return false;
    }
    this.lessonProgress.set(k, { ...row });
    return true;
  }

  async updateLessonProgress(userId: string, lessonId: string, expectedAttempts: number, row: LessonProgressWrite) {
    await this.tick();
    const cur = this.lessonProgress.get(this.key(userId, lessonId));
    if (!cur || cur.attempts !== expectedAttempts) {
      this.refusedWrites++;
      return false;
    }
    Object.assign(cur, row);
    return true;
  }

  async getReviewItems(userId: string, questionIds: string[]): Promise<ReviewRow[]> {
    await this.tick();
    return questionIds.flatMap((id) => {
      const r = this.reviewItems.get(this.key(userId, id));
      return r ? [{ question_id: r.question_id, lesson_id: r.lesson_id, box: r.box, lapses: r.lapses, due_at: r.due_at }] : [];
    });
  }

  async upsertReviewItems(userId: string, rows: ReviewWrite[]) {
    await this.tick();
    for (const r of rows) this.reviewItems.set(this.key(userId, r.question_id), { ...r });
  }

  async claimReviewItem(userId: string, expected: { question_id: string; box: number; dueBefore: string }, next: ReviewWrite) {
    await this.tick();
    const cur = this.reviewItems.get(this.key(userId, expected.question_id));
    if (!cur || cur.box !== expected.box || Date.parse(cur.due_at) > Date.parse(expected.dueBefore)) {
      this.refusedWrites++;
      return false;
    }
    this.reviewItems.set(this.key(userId, expected.question_id), { ...next });
    return true;
  }

  async awardXp(a: AwardArgs): Promise<AwardResult> {
    await this.tick();
    if (a.amount < 0 || a.amount > 500) throw new Error(`award_xp: amount out of range (${a.amount})`);
    if (a.replayHours < 0 || a.replayHours > 24 * 31) throw new Error(`award_xp: replay window out of range (${a.replayHours})`);
    const profile = this.profile(a.userId);
    let paid = a.amount;
    if (a.replayHours > 0 && a.amount > 0) {
      const since = this.clock - a.replayHours * 3_600_000;
      if (this.events.some((e) => e.userId === a.userId && e.source === a.source && e.ref === a.ref && e.amount > 0 && e.at >= since)) paid = 0;
    }
    const oneOff = a.source === "weekly" || a.source === "checkpoint";
    if (oneOff && this.events.some((e) => e.userId === a.userId && e.source === a.source && e.ref === a.ref)) {
      return { totalXp: profile.xp, streak: profile.streak, awarded: false, paid: 0 };
    }
    this.events.push({ userId: a.userId, amount: paid, source: a.source, ref: a.ref, at: this.clock });
    profile.xp += paid;
    profile.streak = a.streak;
    profile.lastActive = a.today;
    return { totalXp: profile.xp, streak: profile.streak, awarded: true, paid };
  }

  /* ---- helpers for assertions and set-up ---- */
  paidTotal(userId: string, source?: string, ref?: string) {
    return this.events.filter((e) => e.userId === userId && (!source || e.source === source) && (ref === undefined || e.ref === ref)).reduce((s, e) => s + e.amount, 0);
  }
  seedReview(userId: string, row: ReviewRow) {
    this.reviewItems.set(this.key(userId, row.question_id), { ...row, last_reviewed_at: null });
  }
  review(userId: string, questionId: string) {
    return this.reviewItems.get(this.key(userId, questionId));
  }
  progress(userId: string, lessonId: string) {
    return this.lessonProgress.get(this.key(userId, lessonId));
  }
}
