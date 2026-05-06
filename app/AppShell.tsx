"use client";
import { useState } from "react";
import PayrollTab from "@/components/pages/PayrollTab";
import EmployeesTab from "@/components/pages/EmployeesTab";
import ServicesTab from "@/components/pages/ServicesTab";

const TABS = [
  { id: "payroll",   label: "📋 Payroll",   icon: "📋" },
  { id: "employees", label: "👥 Employees", icon: "👥" },
  { id: "services",  label: "✨ Services",  icon: "✨" },
];

export default function AppShell() {
  const [tab, setTab] = useState("payroll");

  return (
    <div className="min-h-screen bg-[#f4f1ed]">
      <header className="bg-white border-b border-[#e0dbd2] shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-[#1a1a2e] leading-tight">✂️ Salon Payroll</h1>
            <p className="text-xs text-[#7a7a7a] hidden sm:block">Daily payroll management</p>
          </div>
          <nav className="hidden sm:flex gap-1 bg-[#f4f1ed] p-1 rounded-xl">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  tab === t.id
                    ? "bg-[#1a1a2e] text-white shadow"
                    : "text-[#7a7a7a] hover:bg-white hover:text-[#1a1a2e]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 pb-24 sm:pb-6">
        {tab === "payroll"   && <PayrollTab />}
        {tab === "employees" && <EmployeesTab />}
        {tab === "services"  && <ServicesTab />}
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e0dbd2] shadow-lg z-40">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === t.id ? "text-[#1a1a2e] border-t-2 border-[#c9a84c]" : "text-[#7a7a7a]"
              }`}
            >
              <span className="text-lg mb-0.5">{t.icon}</span>
              {t.id.charAt(0).toUpperCase() + t.id.slice(1)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
