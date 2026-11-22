import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge Plumb's type scale (index.css), so `text-ui` is read as a size and
// doesn't knock out a color like `text-paper` in the same class list.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["micro", "small", "caption", "ui", "body", "heading", "title", "display"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
