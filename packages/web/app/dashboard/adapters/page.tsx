export const dynamic = "force-dynamic";

import { getDashboardAdapters } from "@/lib/dashboard-data";
import AdaptersList from "@/components/dashboard/AdaptersList";
import { requireOwnerKey } from "@/lib/session";

export default async function AdaptersPage() {
  const ownerKey = await requireOwnerKey();
  const adapters = await getDashboardAdapters(ownerKey);

  return (
    <div>
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Adapters</h1>
          <p className="font-mono text-[13px] text-(--indox-muted)">
            {adapters.length === 0
              ? "no adapters configured yet"
              : `${adapters.length} configured · ${adapters.reduce((s, a) => s + a.readyCount, 0)} sources indexed`}
          </p>
        </div>
      </div>

      <AdaptersList adapters={adapters} />
    </div>
  );
}
