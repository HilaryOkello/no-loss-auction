import { AuctionStatus } from "@/types/auction"

const styles: Record<AuctionStatus, string> = {
  Open: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Finalized: "bg-slate-100 text-slate-600 border border-slate-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
}

const dots: Record<AuctionStatus, string> = {
  Open: "bg-emerald-500",
  Finalized: "bg-slate-400",
  Cancelled: "bg-red-400",
}

export function StatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  )
}
