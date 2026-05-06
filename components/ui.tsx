"use client";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import clsx from "clsx";

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-white rounded-2xl shadow-sm border border-[#e0dbd2] p-5 sm:p-7 mb-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-xl text-[#1a1a2e] mb-4 pb-3 border-b-2 border-[#e8d5a3]">
      {children}
    </h2>
  );
}

// ── Button ────────────────────────────────────────────────────────
type BtnVariant = "primary" | "accent" | "danger" | "success" | "outline";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md";
}
const variantCls: Record<BtnVariant, string> = {
  primary: "bg-[#1a1a2e] text-white hover:bg-[#2e2e4d]",
  accent:  "bg-[#c9a84c] text-white hover:bg-[#b8943e]",
  danger:  "bg-red-600 text-white hover:bg-red-700",
  success: "bg-green-700 text-white hover:bg-green-800",
  outline: "border border-[#e0dbd2] text-[#2c2c2c] hover:border-[#1a1a2e] bg-transparent",
};
export function Button({ variant = "primary", size = "md", className, children, ...rest }: BtnProps) {
  return (
    <button
      className={clsx(
        "rounded-xl font-semibold transition-all active:scale-95 cursor-pointer min-h-[40px]",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        variantCls[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full px-3 py-2 rounded-lg border-[1.5px] border-[#e0dbd2] text-[#2c2c2c]",
        "focus:outline-none focus:border-[#c9a84c] text-base bg-white",
        className
      )}
      {...props}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full px-3 py-2 rounded-lg border-[1.5px] border-[#e0dbd2] text-[#2c2c2c]",
        "focus:outline-none focus:border-[#c9a84c] text-base bg-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ── FormGroup ─────────────────────────────────────────────────────
export function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-[#7a7a7a] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span className={clsx(
      "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold",
      active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
    )}>
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-auto",
          "max-h-[92vh] sm:max-h-[90vh]",
          maxWidth,
          "p-5 sm:p-7"
        )}
      >
        <h3 className="font-display text-xl text-[#1a1a2e] mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── StatChip ──────────────────────────────────────────────────────
export function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#f4f1ed] border border-[#e0dbd2] rounded-md px-2.5 py-1 text-xs text-[#7a7a7a]">
      {label} <span className="font-bold text-[#1a1a2e]">{value}</span>
    </div>
  );
}

// ── SummaryBox ────────────────────────────────────────────────────
export function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f4f1ed] border border-[#e0dbd2] rounded-xl p-3 text-center">
      <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-wide mb-1">{label}</p>
      <p className="font-bold text-[#1a1a2e] text-base">{value}</p>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-10 text-[#7a7a7a]">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-[#e8d5a3] border-t-[#c9a84c] rounded-full animate-spin" />
    </div>
  );
}
