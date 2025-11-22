import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAIErrorMessage(error: unknown): string {
  if (error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
      return "Our AI is currently experiencing high demand. Please try again in a few moments.";
  }
  return 'An error occurred while communicating with the AI. Please try again.';
}
