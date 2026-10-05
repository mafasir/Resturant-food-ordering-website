import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared styling for auth form inputs, with a red state for validation errors. */
export function inputClass(hasError: boolean, extra?: string): string {
  return cn(
    "w-full rounded-xl border bg-canvas-soft py-2.5 pl-10 pr-3.5 text-sm text-cream transition placeholder:text-faint focus:outline-none",
    hasError
      ? "border-chili-500/60 focus:border-chili-500"
      : "border-line focus:border-ember-500/60",
    extra,
  );
}