import { CreateAuctionForm } from "@/components/auctions/CreateAuctionForm"

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Auction</h1>
        <p className="text-muted-foreground text-sm mt-1">
          List an item for auction. Losing bidders are always refunded automatically.
        </p>
      </div>
      <CreateAuctionForm />
    </div>
  )
}
