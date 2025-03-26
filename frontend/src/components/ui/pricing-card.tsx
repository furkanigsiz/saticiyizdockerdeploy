import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Card } from "./card"
import { FaCheck, FaTimes } from "react-icons/fa"

export interface PricingTier {
  id: string
  name: string
  price: {
    monthly: string | number
    yearly: string | number
  }
  description: string
  features: string[]
  cta: string
  popular?: boolean
  highlighted?: boolean
  disabled?: boolean
}

export interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
  className?: string
  onClick?: () => void
}

export function PricingCard({
  tier,
  paymentFrequency,
  className,
  onClick
}: PricingCardProps) {
  const price = typeof tier.price[paymentFrequency.toLowerCase() as keyof typeof tier.price] === "number"
    ? `${tier.price[paymentFrequency.toLowerCase() as keyof typeof tier.price]}₺`
    : tier.price[paymentFrequency.toLowerCase() as keyof typeof tier.price]

  return (
    <Card className={cn(
      "relative h-full flex flex-col p-6 border transition-all duration-200 hover:shadow-md",
      "bg-gray-950 text-gray-100 border-gray-800",
      tier.popular && "border-blue-600 ring-1 ring-blue-600",
      tier.highlighted && "border-blue-600 ring-1 ring-blue-600 bg-blue-950/20",
      tier.disabled && "opacity-60 cursor-not-allowed",
      className
    )}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium py-1 px-3 rounded-full shadow-lg">
          En Popüler
        </div>
      )}
      
      <div className="mb-5">
        <h3 className="text-xl font-medium mb-2 text-white">{tier.name}</h3>
        <p className="text-gray-400 text-sm">{tier.description}</p>
      </div>
      
      <div className="mb-5">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">{price}</span>
          {typeof tier.price[paymentFrequency.toLowerCase() as keyof typeof tier.price] === "number" && (
            <span className="text-gray-400 ml-2">/{paymentFrequency === "yearly" ? "yıl" : "ay"}</span>
          )}
        </div>
      </div>
      
      <ul className="mb-6 space-y-3 flex-grow">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <FaCheck className="text-green-500 mt-1 shrink-0" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={onClick}
        disabled={tier.disabled}
        className={cn(
          "w-full mt-auto px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200",
          tier.highlighted && "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
          tier.popular && "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
          !tier.highlighted && !tier.popular && "bg-transparent hover:bg-gray-800 text-white border border-gray-700",
          tier.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {tier.disabled ? "Kullanıldı" : tier.cta}
      </button>
      
      {tier.disabled && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center rounded-lg overflow-hidden">
          <div className="bg-red-900/60 text-white px-4 py-2 rounded shadow-lg transform rotate-45 absolute text-sm font-medium">
            Kullanıldı
          </div>
        </div>
      )}
    </Card>
  )
} 