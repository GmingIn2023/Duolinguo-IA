import { AppShell } from "@/components/AppShell";
import { getDueItems, requireViewer } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  const due = await getDueItems();
  return (
    <AppShell profile={profile} dueCount={due.length}>
      {children}
    </AppShell>
  );
}
