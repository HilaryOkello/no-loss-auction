import { Badge } from "@/components/ui/badge"
import { AuctionStatus } from "@/types/auction"

const variants: Record<AuctionStatus, "default" | "secondary" | "destructive"> =
  {
    Open: "default",
    Finalized: "secondary",
    Cancelled: "destructive",
  }

export function StatusBadge({ status }: { status: AuctionStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>
}
