"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "./pricing-card"
import { Tab } from "./pricing-tab"
import { cn } from "../../lib/utils"

interface PricingSectionProps {
  title: string
  subtitle: string
  tiers: PricingTier[]
  frequencies: string[]
  onSelectTier?: (tierId: string) => void
  hasUsedTrial?: boolean
}

export function PricingSection({
  title,
  subtitle,
  tiers,
  frequencies,
  onSelectTier,
  hasUsedTrial = false
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(frequencies[0])

  // Paketleri hasUsedTrial durumuna göre güncelle
  const updatedTiers = tiers.map(tier => {
    if (tier.id === "free" && hasUsedTrial) {
      return { ...tier, disabled: true };
    }
    return tier;
  });

  return (
    <section className="flex flex-col items-center gap-10 py-10">
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-medium md:text-5xl text-white">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        <div className="mx-auto inline-flex rounded-full bg-black p-1">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              setSelected={setSelectedFrequency}
              discount={freq === "yearly"}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {updatedTiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "cursor-pointer",
              tier.disabled && "cursor-not-allowed"
            )}
          >
            <PricingCard
              tier={tier}
              paymentFrequency={selectedFrequency}
              onClick={() => !tier.disabled && onSelectTier && onSelectTier(tier.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
} 