"use client";
import { useEffect, useState } from "react";
import { Service } from "@/lib/types";
import {
  Card, CardTitle, Button, Input, Select, FormGroup, Modal,
  Badge, EmptyState, Spinner,
} from "@/components/ui";

const CATEGORIES = ["Hair", "Nails", "Skin", "Lashes", "Massage", "Other"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hair");
  const [price, setPrice] = useState(300);
  const [commRate, setCommRate] = useState(40);

  const [editSvc, setEditSvc] = useState<Service | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/services");
    setServices(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!name.trim()) return alert("Service name is required");
    setSaving(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, default_price: price, commission_rate: commRate }),
    });
    setName("");
    await load();
    setSaving(false);
  }

  async function handleToggle(svc: Service) {
    await fetch(`/api/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...svc, active: !svc.active }),
    });
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleSaveEdit() {
    if (!editSvc) return;
    setSaving(true);
    await fetch(`/api/services/${editSvc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSvc),
    });
    setEditSvc(null);
    await load();
    setSaving(false);
  }

  return (
    <div>
      {/* Add Service */}
      <Card>
        <CardTitle>Add New Service</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <FormGroup label="Service Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Balayage" />
          </FormGroup>
          <FormGroup label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Default Price (₱)">
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </FormGroup>
          <FormGroup label="Commission %">
            <Input type="number" value={commRate} onChange={(e) => setCommRate(Number(e.target.value))} />
          </FormGroup>
        </div>
        <Button variant="accent" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "+ Add Service"}
        </Button>
      </Card>

      {/* Catalog */}
      <Card>
        <CardTitle>Service Catalog</CardTitle>
        {loading ? (
          <Spinner />
        ) : services.length === 0 ? (
          <EmptyState icon="✨" text="No services yet. Add one above." />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full mobile-table">
              <thead>
                <tr className="bg-[#1a1a2e] text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b border-[#e0dbd2] hover:bg-[#faf8f4] last:border-0">
                    <td className="px-4 py-3 font-semibold text-left" data-label="Service">{svc.name}</td>
                    <td className="px-4 py-3 text-center" data-label="Category">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                        {svc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" data-label="Price">₱ {Number(svc.default_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center" data-label="Commission">{svc.commission_rate}%</td>
                    <td className="px-4 py-3 text-center" data-label="Status">
                      <Badge active={!!svc.active} />
                    </td>
                    <td className="px-4 py-3 text-center actions-cell" data-label="">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Button size="sm" onClick={() => setEditSvc({ ...svc })}>✏️</Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggle(svc)}>
                          {svc.active ? "Disable" : "Enable"}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(svc.id)}>🗑️</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal open={!!editSvc} onClose={() => setEditSvc(null)} title="✏️ Edit Service" maxWidth="max-w-md">
        {editSvc && (
          <div className="space-y-3">
            <FormGroup label="Service Name">
              <Input value={editSvc.name} onChange={(e) => setEditSvc({ ...editSvc, name: e.target.value })} />
            </FormGroup>
            <FormGroup label="Category">
              <Select value={editSvc.category} onChange={(e) => setEditSvc({ ...editSvc, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Default Price (₱)">
              <Input type="number" value={editSvc.default_price} onChange={(e) => setEditSvc({ ...editSvc, default_price: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="Commission %">
              <Input type="number" value={editSvc.commission_rate} onChange={(e) => setEditSvc({ ...editSvc, commission_rate: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="Status">
              <Select value={editSvc.active ? "active" : "inactive"} onChange={(e) => setEditSvc({ ...editSvc, active: e.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormGroup>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditSvc(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
