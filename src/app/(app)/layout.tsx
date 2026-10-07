import { AppShell } from "@/components/AppShell";
import { getDueQuestionIds, requireViewer } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  const due = await getDueQuestionIds(99);
  return (
    <AppShell profile={profile} dueCount={due.length}>
      {children}
    </AppShell>
  );
}
