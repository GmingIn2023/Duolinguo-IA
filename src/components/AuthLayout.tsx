import { Wordmark } from "@/components/Wordmark";

export function AuthLayout({ title, children, aside, track }: { title: string; children: React.ReactNode; aside?: React.ReactNode; track?: string }) {
  return (
    <div data-track={track} className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Wordmark />
        <main className="mx-auto grid w-full max-w-md flex-1 content-center gap-8 py-12">
          <h1 className="display display-l">{title}</h1>
          {children}
        </main>
      </div>
      <div className="hidden bg-accent lg:block" style={{ background: track ? undefined : "var(--ink)" }}>
        {aside}
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-[0.9375rem] font-medium text-bad">
      {message}
    </p>
  );
}
