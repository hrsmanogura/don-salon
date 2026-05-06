"use client";
import { useEffect, useState, useCallback } from "react";
import { Employee, Service, PayrollRecord } from "@/lib/types";
import {
  Card, CardTitle, Button, Input, Select, FormGroup,
  Modal, SummaryBox, EmptyState, Spinner,
} from "@/components/ui";

// ── helpers ───────────────────────────────────────────────────────
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getDayLabel(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtMoney(n: number) {
  return `₱ ${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// A "tap" is a single service performed — clicking Add logs one tap
interface ServiceTap {
  service_name: string;
  price: number;
  rate: number; // commission %
}

// Grouped for display & saving
interface ServiceGroup {
  service_name: string;
  price: number;
  rate: number;
  count: number; // how many times tapped
  commission: number;
}

function groupTaps(taps: ServiceTap[]): ServiceGroup[] {
  const map = new Map<string, ServiceGroup>();
  for (const t of taps) {
    const key = t.service_name;
    if (map.has(key)) {
      const g = map.get(key)!;
      g.count += 1;
      g.commission += t.price * (t.rate / 100);
    } else {
      map.set(key, {
        service_name: t.service_name,
        price: t.price,
        rate: t.rate,
        count: 1,
        commission: t.price * (t.rate / 100),
      });
    }
  }
  return Array.from(map.values());
}

function calcTotals(taps: ServiceTap[], basePay: number, deductions: number) {
  const totalCommission = taps.reduce((s, t) => s + t.price * (t.rate / 100), 0);
  const gross = basePay + totalCommission;
  const net = gross - deductions;
  return { totalCommission, gross, net };
}

// ── Component ─────────────────────────────────────────────────────
export default function PayrollTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [workDate, setWorkDate] = useState("");
  const [dayLabel, setDayLabel] = useState("");
  const [basePay, setBasePay] = useState(2500);
  const [deductions, setDeductions] = useState(0);

  // Taps — each click of a service button adds one tap
  const [taps, setTaps] = useState<ServiceTap[]>([]);

  // Edit modal
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [editTaps, setEditTaps] = useState<ServiceTap[]>([]);
  const [editBase, setEditBase] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [editSelectedSvc, setEditSelectedSvc] = useState("");

  // Selected service for the "Add" button in entry form
  const [selectedSvc, setSelectedSvc] = useState("");

  // ── init ─────────────────────────────────────────────────────
  useEffect(() => {
    const today = getTodayDate();
    setWorkDate(today);
    setDayLabel(getDayLabel(today));
    loadMetadata();
  }, []);

  async function loadMetadata() {
    const [empRes, svcRes] = await Promise.all([
      fetch("/api/employees"),
      fetch("/api/services"),
    ]);
    const emps: Employee[] = await empRes.json();
    const svcs: Service[] = await svcRes.json();
    const activeEmps = emps.filter((e) => e.active);
    const activeSvcs = svcs.filter((s) => s.active);
    setEmployees(activeEmps);
    setServices(activeSvcs);
    if (activeEmps.length > 0) {
      const first = activeEmps[0];
      setSelectedEmpId(first.id);
      setBasePay(Number(first.base_pay));
    }
    if (activeSvcs.length > 0) {
      setSelectedSvc(activeSvcs[0].name);
      setEditSelectedSvc(activeSvcs[0].name);
    }
  }

  const loadRecords = useCallback(async (empId: number) => {
    if (!empId) return;
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/payroll?employee_id=${empId}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load records:", e);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmpId) loadRecords(selectedEmpId);
  }, [selectedEmpId, loadRecords]);

  function handleEmpChange(id: number) {
    setSelectedEmpId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setBasePay(Number(emp.base_pay));
  }

  // ── Add a tap ────────────────────────────────────────────────
  function handleAddTap() {
    const svc = services.find((s) => s.name === selectedSvc);
    if (!svc) return;
    setTaps((prev) => [
      ...prev,
      {
        service_name: svc.name,
        price: Number(svc.default_price),
        rate: Number(svc.commission_rate),
      },
    ]);
  }

  // Remove one tap of a service
  function removeOneTap(service_name: string) {
    const idx = [...taps].map((t) => t.service_name).lastIndexOf(service_name);
    if (idx === -1) return;
    setTaps((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedEmpId) return alert("Please select an employee");
    if (taps.length === 0) return alert("Please add at least one service");
    setSaving(true);
    const { totalCommission, gross, net } = calcTotals(taps, basePay, deductions);
    const grouped = groupTaps(taps);
    const payload = {
      employee_id: selectedEmpId,
      week_ending: workDate,
      week_label: dayLabel,
      base_pay: basePay,
      deductions,
      total_commission: totalCommission,
      gross_pay: gross,
      net_pay: net,
      services: grouped.map((g) => ({
        service_name: g.service_name,
        price: g.price,
        qty: g.count,
        commission_rate: g.rate,
        commission_amount: g.commission,
      })),
    };
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setTaps([]);
      await loadRecords(selectedEmpId);
      alert("Daily payroll saved!");
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
    setSaving(false);
  }

  // ── Edit modal ────────────────────────────────────────────────
  function openEdit(record: PayrollRecord) {
    setEditRecord(record);
    setEditBase(Number(record.base_pay));
    setEditDeductions(Number(record.deductions));
    // Reconstruct taps from saved services (qty = how many taps)
    const reconstructed: ServiceTap[] = [];
    for (const s of record.services || []) {
      for (let i = 0; i < Number(s.qty); i++) {
        reconstructed.push({
          service_name: s.service_name,
          price: Number(s.price),
          rate: Number(s.commission_rate),
        });
      }
    }
    setEditTaps(reconstructed);
    if (services.length > 0) setEditSelectedSvc(services[0].name);
  }

  function handleAddEditTap() {
    const svc = services.find((s) => s.name === editSelectedSvc);
    if (!svc) return;
    setEditTaps((prev) => [
      ...prev,
      {
        service_name: svc.name,
        price: Number(svc.default_price),
        rate: Number(svc.commission_rate),
      },
    ]);
  }

  function removeOneEditTap(service_name: string) {
    const idx = [...editTaps].map((t) => t.service_name).lastIndexOf(service_name);
    if (idx === -1) return;
    setEditTaps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveEdit() {
    if (!editRecord) return;
    setSaving(true);
    const { totalCommission, gross, net } = calcTotals(editTaps, editBase, editDeductions);
    const grouped = groupTaps(editTaps);
    await fetch(`/api/payroll/${editRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_pay: editBase,
        deductions: editDeductions,
        total_commission: totalCommission,
        gross_pay: gross,
        net_pay: net,
        services: grouped.map((g) => ({
          service_name: g.service_name,
          price: g.price,
          qty: g.count,
          commission_rate: g.rate,
          commission_amount: g.commission,
        })),
      }),
    });
    setEditRecord(null);
    await loadRecords(selectedEmpId);
    setSaving(false);
    alert("Record updated!");
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this payroll record?")) return;
    await fetch(`/api/payroll/${id}`, { method: "DELETE" });
    await loadRecords(selectedEmpId);
  }

  // ── Excel export ──────────────────────────────────────────────
  async function exportExcel() {
    if (records.length === 0) return alert("No records to export");
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const emp = employees.find((e) => e.id === selectedEmpId);
    const ws_data: unknown[][] = [
      [`${emp?.name ?? ""} — Daily Payroll History`],
      [],
      ["Date", "Day", "Total Services", "Base Pay", "Deductions", "Commission", "Gross", "Net"],
    ];
    records.forEach((r) => {
      const totalSvcs = (r.services || []).reduce((s, sv) => s + Number(sv.qty), 0);
      ws_data.push([
        r.week_ending, r.week_label, totalSvcs,
        r.base_pay, r.deductions, r.total_commission, r.gross_pay, r.net_pay,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [
      { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, emp?.name ?? "Payroll");
    const d = new Date();
    XLSX.writeFile(wb, `${emp?.name ?? "Payroll"}_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}.xlsx`);
  }

  const totals = calcTotals(taps, basePay, deductions);
  const editTotals = calcTotals(editTaps, editBase, editDeductions);
  const grouped = groupTaps(taps);
  const totalServices = taps.length;

  return (
    <div>
      {/* ── Entry Form ── */}
      <Card>
        <CardTitle>Daily Payroll Entry</CardTitle>
        <p className="text-[#c9a84c] font-semibold text-sm mb-4">{dayLabel}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <FormGroup label="Date">
            <Input
              type="date"
              value={workDate}
              onChange={(e) => {
                setWorkDate(e.target.value);
                setDayLabel(getDayLabel(e.target.value));
              }}
            />
          </FormGroup>
          <FormGroup label="Employee">
            <Select value={selectedEmpId} onChange={(e) => handleEmpChange(Number(e.target.value))}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Base Pay (₱)">
            <Input type="number" value={basePay} onChange={(e) => setBasePay(Number(e.target.value))} />
          </FormGroup>
          <FormGroup label="Deductions (₱)">
            <Input type="number" value={deductions} onChange={(e) => setDeductions(Number(e.target.value))} />
          </FormGroup>
        </div>

        {/* ── Service Tap Area ── */}
        <div className="bg-[#f4f1ed] rounded-xl p-4 mb-4 border border-[#e0dbd2]">
          <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-wide mb-3">
            Log a Service
          </p>
          <div className="flex gap-2 items-end flex-wrap">
            <FormGroup label="Select Service">
              <Select
                value={selectedSvc}
                onChange={(e) => setSelectedSvc(e.target.value)}
                className="min-w-[160px]"
              >
                {services.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormGroup>
            <Button variant="accent" onClick={handleAddTap} className="mb-0.5">
              + Add Service
            </Button>
          </div>
        </div>

        {/* ── Service Summary ── */}
        {grouped.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-wide">
                Services This Day
              </p>
              <span className="bg-[#1a1a2e] text-white text-xs font-bold px-3 py-1 rounded-full">
                Total: {totalServices} service{totalServices !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {grouped.map((g) => (
                <div
                  key={g.service_name}
                  className="flex items-center justify-between bg-white border border-[#e0dbd2] rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Tap counter badge */}
                    <span className="w-8 h-8 rounded-full bg-[#c9a84c] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {g.count}
                    </span>
                    <div>
                      <p className="font-semibold text-[#1a1a2e] text-sm">{g.service_name}</p>
                      <p className="text-xs text-[#7a7a7a]">
                        {fmtMoney(g.price)} × {g.count} — Commission {g.rate}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#c9a84c] text-sm">{fmtMoney(g.commission)}</span>
                    <button
                      onClick={() => removeOneTap(g.service_name)}
                      className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                      title="Remove one"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Totals + Save ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryBox label="Total Commission" value={fmtMoney(totals.totalCommission)} />
          <SummaryBox label="Gross Pay" value={fmtMoney(totals.gross)} />
          <SummaryBox label="Net Pay" value={fmtMoney(totals.net)} />
          <div className="flex items-center justify-center">
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Day"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Saved Records ── */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <CardTitle>Saved Records</CardTitle>
          <Button variant="success" size="sm" onClick={exportExcel}>📊 Export Excel</Button>
        </div>

        {loadingRecords ? (
          <Spinner />
        ) : records.length === 0 ? (
          <EmptyState icon="📋" text="No records yet for this employee." />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full mobile-table">
              <thead>
                <tr className="bg-[#1a1a2e] text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Date</th>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3">Services</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Net Pay</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const totalSvcs = (r.services || []).reduce(
                    (s, sv) => s + Number(sv.qty), 0
                  );
                  return (
                    <tr key={r.id} className="border-b border-[#e0dbd2] hover:bg-[#faf8f4] last:border-0">
                      <td className="px-4 py-3 text-left" data-label="Date">{r.week_ending}</td>
                      <td className="px-4 py-3 text-left" data-label="Day">{r.week_label}</td>
                      <td className="px-4 py-3 text-center" data-label="Services">
                        <span className="bg-[#1a1a2e] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {totalSvcs} service{totalSvcs !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" data-label="Commission">
                        {fmtMoney(r.total_commission)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold" data-label="Net Pay">
                        {fmtMoney(r.net_pay)}
                      </td>
                      <td className="px-4 py-3 actions-cell" data-label="">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button size="sm" onClick={() => openEdit(r)}>✏️ Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>🗑️</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Edit Modal ── */}
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="✏️ Edit Payroll Record">
        {editRecord && (
          <div>
            <p className="text-[#c9a84c] font-semibold text-sm mb-4">
              {editRecord.week_label} ({editRecord.week_ending})
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <FormGroup label="Base Pay">
                <Input type="number" value={editBase} onChange={(e) => setEditBase(Number(e.target.value))} />
              </FormGroup>
              <FormGroup label="Deductions">
                <Input type="number" value={editDeductions} onChange={(e) => setEditDeductions(Number(e.target.value))} />
              </FormGroup>
            </div>

            {/* Add service tap in edit modal */}
            <div className="bg-[#f4f1ed] rounded-xl p-3 mb-4 border border-[#e0dbd2] flex gap-2 items-end flex-wrap">
              <FormGroup label="Add Service">
                <Select
                  value={editSelectedSvc}
                  onChange={(e) => setEditSelectedSvc(e.target.value)}
                  className="min-w-[150px]"
                >
                  {services.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </Select>
              </FormGroup>
              <Button variant="accent" size="sm" onClick={handleAddEditTap} className="mb-0.5">
                + Add
              </Button>
            </div>

            {/* Edit service summary */}
            {groupTaps(editTaps).length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-wide">Services</p>
                  <span className="bg-[#1a1a2e] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Total: {editTaps.length} service{editTaps.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {groupTaps(editTaps).map((g) => (
                  <div
                    key={g.service_name}
                    className="flex items-center justify-between bg-[#f4f1ed] border border-[#e0dbd2] rounded-xl px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#c9a84c] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {g.count}
                      </span>
                      <div>
                        <p className="font-semibold text-[#1a1a2e] text-sm">{g.service_name}</p>
                        <p className="text-xs text-[#7a7a7a]">{fmtMoney(g.price)} × {g.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#c9a84c] text-sm">{fmtMoney(g.commission)}</span>
                      <button
                        onClick={() => removeOneEditTap(g.service_name)}
                        className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4">
              <SummaryBox label="Commission" value={fmtMoney(editTotals.totalCommission)} />
              <SummaryBox label="Gross" value={fmtMoney(editTotals.gross)} />
              <SummaryBox label="Net" value={fmtMoney(editTotals.net)} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}