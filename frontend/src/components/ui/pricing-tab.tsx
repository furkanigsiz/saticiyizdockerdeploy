import * as React from "react"
import { cn } from "../../lib/utils"

interface TabProps {
  text: string
  selected: boolean
  setSelected: (value: string) => void
  discount?: boolean
}

export function Tab({ text, selected, setSelected, discount = false }: TabProps) {
  return (
    <button
      className={cn(
        "relative px-4 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "text-white"
          : "text-gray-400 hover:text-gray-300"
      )}
      onClick={() => setSelected(text)}
    >
      {text === "yearly" && discount && (
        <span className="absolute -top-4 right-0 bg-blue-600 text-white text-[10px] py-0.5 px-2 rounded-full whitespace-nowrap">
          Save 35%
        </span>
      )}
      {text === "monthly" ? "Monthly" : "Yearly"}
    </button>
  )
} 