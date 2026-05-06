"use client";
import { useEffect, useState } from "react";
import { Employee } from "@/lib/types";
import {
  Card, CardTitle, Button, Input, FormGroup, Modal,
  Badge, StatChip, EmptyState, Spinner,
} from "@/components/ui";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [basePay, setBasePay] = useState(2500);
  const [commRate, setCommRate] = useState(40);

  // Edit modal
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!name.trim()) return alert("Name is required");
    setSaving(true);
    await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, base_pay: basePay, commission_rate: commRate }),
    });
    setName(""); setRole("");
    await load();
    setSaving(false);
  }

  async function handleToggle(emp: Employee) {
    await fetch(`/api/employees/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emp, active: !emp.active }),
    });
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this employee? Their payroll records will also be removed.")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleSaveEdit() {
    if (!editEmp) return;
    setSaving(true);
    await fetch(`/api/employees/${editEmp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editEmp),
    });
    setEditEmp(null);
    await load();
    setSaving(false);
  }

  return (
    <div>
      {/* Add Employee */}
      <Card>
        <CardTitle>Add New Employee</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <FormGroup label="Full Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Santos" />
          </FormGroup>
          <FormGroup label="Role / Position">
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Stylist" />
          </FormGroup>
          <FormGroup label="Base Pay (₱)">
            <Input type="number" value={basePay} onChange={(e) => setBasePay(Number(e.target.value))} />
          </FormGroup>
          <FormGroup label="Default Commission %">
            <Input type="number" value={commRate} onChange={(e) => setCommRate(Number(e.target.value))} />
          </FormGroup>
        </div>
        <Button variant="accent" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "+ Add Employee"}
        </Button>
      </Card>

      {/* Employee Directory */}
      <Card>
        <CardTitle>Employee Directory</CardTitle>
        {loading ? (
          <Spinner />
        ) : employees.length === 0 ? (
          <EmptyState icon="👤" text="No employees yet. Add one above." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="border border-[#e0dbd2] rounded-xl p-4 hover:border-[#c9a84c] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center font-display text-lg flex-shrink-0">
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a1a2e]">{emp.name}</div>
                    <div className="text-sm text-[#7a7a7a]">{emp.role || "—"}</div>
                    <Badge active={!!emp.active} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <StatChip label="Base" value={`₱${Number(emp.base_pay).toLocaleString()}`} />
                  <StatChip label="Commission" value={`${emp.commission_rate}%`} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => setEditEmp({ ...emp })}>✏️ Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(emp)}>
                    {emp.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(emp.id)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal open={!!editEmp} onClose={() => setEditEmp(null)} title="✏️ Edit Employee" maxWidth="max-w-md">
        {editEmp && (
          <div className="space-y-3">
            <FormGroup label="Full Name">
              <Input value={editEmp.name} onChange={(e) => setEditEmp({ ...editEmp, name: e.target.value })} />
            </FormGroup>
            <FormGroup label="Role / Position">
              <Input value={editEmp.role} onChange={(e) => setEditEmp({ ...editEmp, role: e.target.value })} />
            </FormGroup>
            <FormGroup label="Base Pay (₱)">
              <Input type="number" value={editEmp.base_pay} onChange={(e) => setEditEmp({ ...editEmp, base_pay: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="Default Commission %">
              <Input type="number" value={editEmp.commission_rate} onChange={(e) => setEditEmp({ ...editEmp, commission_rate: Number(e.target.value) })} />
            </FormGroup>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditEmp(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
