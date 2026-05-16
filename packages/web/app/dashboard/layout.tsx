import { DashNav } from "@/components/dashboard/DashNav";
import { DashSidebar } from "@/components/dashboard/DashSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashNav />
      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 54px)", marginTop: 54 }}>
        <DashSidebar />
        <main className="flex-1 overflow-y-auto px-12 py-10 pb-16">
          {children}
        </main>
      </div>
    </>
  );
}
