import { motion } from "framer-motion"
import { FaCheck, FaTimes } from "react-icons/fa"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Card } from "./card"

interface BenefitProps {
  text: string
  checked: boolean
}

const Benefit = ({ text, checked }: BenefitProps) => {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black">
          <FaCheck size={10} />
        </span>
      ) : (
        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-600 text-gray-600">
          <FaTimes size={10} />
        </span>
      )}
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  )
}

interface PricingCardProps {
  tier: string
  price: string
  bestFor: string
  CTA: string
  benefits: Array<{ text: string; checked: boolean }>
  className?: string
  onSelect?: () => void
}

export const PricingCard = ({
  tier,
  price,
  bestFor,
  CTA,
  benefits,
  className,
  onSelect,
}: PricingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Card
        className={cn(
          "relative h-full w-full overflow-hidden border border-gray-800",
          "bg-[#111] hover:bg-[#151515] transition-colors duration-200",
          "p-6",
          className,
        )}
      >
        <div className="flex flex-col items-center border-b border-gray-800 pb-6">
          <span className="mb-6 inline-block text-xl font-medium text-white">
            {tier}
          </span>
          <span className="mb-3 inline-block text-4xl font-bold text-white">
            {price}
          </span>
          <span className="text-center text-gray-400 text-sm">
            {bestFor}
          </span>
        </div>
        <div className="space-y-4 py-6">
          {benefits.map((benefit, index) => (
            <Benefit key={index} {...benefit} />
          ))}
        </div>

        {tier === "Pro" ? (
          <button 
            onClick={onSelect}
            className="w-full mt-4 py-2 px-4 text-sm bg-white hover:bg-gray-100 text-black font-medium rounded-md transition-colors"
          >
            {CTA}
          </button>
        ) : (
          <button 
            onClick={onSelect}
            className="w-full mt-4 py-2 px-4 text-sm border border-gray-600 hover:border-white text-white font-medium rounded-md transition-colors"
          >
            {CTA}
          </button>
        )}
      </Card>
    </motion.div>
  )
} 