import { useState, useEffect, useCallback } from 'react'

const STATUS_COLORS = {
  pending: '#646cff',
  partial: '#f0a500',
  paid: '#44bb44',
  cancelled: '#ff4444',
};

const STATUS_LABELS = {
  pending: '⏳ pending',
  partial: '💳 partial',
  paid: '✓ paid',
  cancelled: '✕ cancelled',
};

function InvoicePrintView({ invoice, onClose }) {
  const studioName = 'Tattoo Workshop';

  const handlePrint = () => window.print();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, overflowY: 'auto' }}>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print-root { display: block !important; }
        }
        #invoice-print-root {
          background: white;
          color: #111;
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          border-radius: 8px;
          font-family: Inter, system-ui, sans-serif;
        }
        #invoice-print-root table { width: 100%; border-collapse: collapse; }
        #invoice-print-root th, #invoice-print-root td { padding: 0.6rem 0.8rem; text-align: left; border-bottom: 1px solid #ddd; }
        #invoice-print-root th { background: #f5f5f5; }
        .no-print { display: block; }
        @media print { .no-print { display: none !important; } }
      `}</style>
      <div id="invoice-print-root">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={handlePrint} style={{ background: '#646cff', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, cursor: 'pointer' }}>
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose} style={{ background: '#555', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '0.25rem' }}>{studioName}</h1>
            <p style={{ color: '#666' }}>Professional Tattoo Studio</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.25rem' }}>INVOICE</h2>
            <p style={{ color: '#666' }}><strong>{invoice.invoice_number}</strong></p>
            <p style={{ color: '#666' }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
            {invoice.due_date && <p style={{ color: '#666' }}>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: '#333', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>Bill To</h3>
            <p style={{ fontWeight: 600 }}>{invoice.customer_name}</p>
            {invoice.customer_email && <p style={{ color: '#555' }}>{invoice.customer_email}</p>}
            {invoice.customer_phone && <p style={{ color: '#555' }}>{invoice.customer_phone}</p>}
            {invoice.customer_address && <p style={{ color: '#555' }}>{invoice.customer_address}</p>}
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>Status</h3>
            <span style={{ padding: '0.3rem 0.8rem', borderRadius: 20, background: STATUS_COLORS[invoice.status] || '#999', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>
        </div>

        <table style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map(item => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>${Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ width: '280px' }}>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: 'right' }}>${Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
              {invoice.tax_rate > 0 && (
                <tr>
                  <td>Tax ({invoice.tax_rate}%)</td>
                  <td style={{ textAlign: 'right' }}>${Number(invoice.tax_amount).toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                <td>Total</td>
                <td style={{ textAlign: 'right' }}>${Number(invoice.total).toFixed(2)}</td>
              </tr>
              {invoice.amount_paid > 0 && (
                <tr style={{ color: '#44bb44' }}>
                  <td>Amount Paid</td>
                  <td style={{ textAlign: 'right' }}>${Number(invoice.amount_paid).toFixed(2)}</td>
                </tr>
              )}
              {invoice.total - invoice.amount_paid > 0 && (
                <tr style={{ fontWeight: 700, color: '#e05' }}>
                  <td>Balance Due</td>
                  <td style={{ textAlign: 'right' }}>${(Number(invoice.total) - Number(invoice.amount_paid)).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Notes</h3>
            <p style={{ color: '#555' }}>{invoice.notes}</p>
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}

function InvoiceForm({ invoice, customers, appointments, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    customer_id: invoice?.customer_id || '',
    appointment_id: invoice?.appointment_id || '',
    tax_rate: invoice?.tax_rate ?? 0,
    deposit_amount: invoice?.deposit_amount ?? 0,
    amount_paid: invoice?.amount_paid ?? 0,
    notes: invoice?.notes || '',
    due_date: invoice?.due_date ? invoice.due_date.slice(0, 10) : '',
  });
  const [items, setItems] = useState(invoice?.items || []);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: '' });

  const isEdit = !!invoice?.id;

  const addItem = () => {
    if (!newItem.description || newItem.unit_price === '') return;
    setItems([...items, { ...newItem, id: Date.now(), total: newItem.quantity * newItem.unit_price }]);
    setNewItem({ description: '', quantity: 1, unit_price: '' });
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, items });
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer *</label>
          <select required value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} disabled={isEdit}>
            <option value="">Select a customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Linked Appointment (optional)</label>
          <select value={formData.appointment_id} onChange={e => setFormData({ ...formData, appointment_id: e.target.value })} disabled={isEdit}>
            <option value="">None</option>
            {appointments.filter(a => !formData.customer_id || String(a.customer_id) === String(formData.customer_id)).map(a => (
              <option key={a.id} value={a.id}>{new Date(a.appointment_date).toLocaleDateString()} — {a.artist_name} ({a.status})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem' }}>Line Items</h3>
        {items.length > 0 && (
          <table style={{ marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id ?? idx}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                  <td><button type="button" className="btn-danger" onClick={() => removeItem(idx)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Description *</label>
            <input type="text" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Service description" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Qty</label>
            <input type="number" min="0.01" step="0.01" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Unit Price ($)</label>
            <input type="number" min="0" step="0.01" value={newItem.unit_price} onChange={e => setNewItem({ ...newItem, unit_price: e.target.value })} placeholder="0.00" />
          </div>
          <button type="button" className="btn-primary" onClick={addItem} style={{ marginBottom: '0.1rem' }}>+ Add</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Deposit / Amount Paid ($)</label>
            <input type="number" min="0" step="0.01" value={formData.amount_paid} onChange={e => setFormData({ ...formData, amount_paid: e.target.value })} />
          </div>
        </div>

        <div style={{ background: '#2a2a2a', padding: '1rem', borderRadius: 6, marginBottom: '1rem', maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {formData.tax_rate > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax ({formData.tax_rate}%)</span><span>${taxAmount.toFixed(2)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', borderTop: '1px solid #444', paddingTop: '0.5rem' }}><span>Total</span><span>${total.toFixed(2)}</span></div>
          {formData.amount_paid > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#44bb44' }}><span>Paid</span><span>${Number(formData.amount_paid).toFixed(2)}</span></div>}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn-success">{isEdit ? 'Update Invoice' : 'Create Invoice'}</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await fetch('/api/invoices').then(r => r.json());
      setInvoices(data);
    } catch {
      showMessage('error', 'Failed to fetch invoices');
    }
  }, [showMessage]);

  useEffect(() => {
    fetchInvoices();
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {});
    fetch('/api/appointments').then(r => r.json()).then(setAppointments).catch(() => {});
  }, [fetchInvoices]);

  const handleSave = async (formData) => {
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Request failed');
      }
      showMessage('success', editingInvoice ? 'Invoice updated!' : 'Invoice created!');
      setShowForm(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (err) {
      showMessage('error', err.message || 'Failed to save invoice');
    }
  };

  const handleEdit = async (invoice) => {
    const full = await fetch(`/api/invoices/${invoice.id}`).then(r => r.json());
    setEditingInvoice(full);
    setShowForm(true);
  };

  const handleView = async (invoice) => {
    const full = await fetch(`/api/invoices/${invoice.id}`).then(r => r.json());
    setPrintInvoice(full);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      showMessage('success', 'Invoice deleted!');
      fetchInvoices();
    } catch {
      showMessage('error', 'Failed to delete invoice');
    }
  };

  const handleMarkPaid = async (invoice) => {
    try {
      await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: invoice.total, status: 'paid' }),
      });
      showMessage('success', 'Invoice marked as paid!');
      fetchInvoices();
    } catch {
      showMessage('error', 'Failed to update invoice');
    }
  };

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inv.invoice_number.toLowerCase().includes(q) && !inv.customer_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
  const pendingRevenue = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0);

  return (
    <div className="container">
      {printInvoice && <InvoicePrintView invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🧾 Invoices</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingInvoice(null); }}>
          {showForm ? 'Cancel' : '+ New Invoice'}
        </button>
      </div>

      {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          customers={customers}
          appointments={appointments}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
        />
      )}

      <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3>💰 Total Revenue (Paid)</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#44bb44', marginTop: '0.5rem' }}>${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>⏳ Outstanding Balance</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f0a500', marginTop: '0.5rem' }}>${pendingRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <h2>All Invoices ({filtered.length})</h2>

        {filtered.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#aaa' }}>No invoices found. Create your first invoice!</p>
        ) : (
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.customer_name}</td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                  <td>${Number(inv.total).toFixed(2)}</td>
                  <td>${Number(inv.amount_paid).toFixed(2)}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 12, backgroundColor: STATUS_COLORS[inv.status] || '#999', color: inv.status === 'paid' ? '#111' : '#fff', fontSize: '0.85rem' }}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => handleView(inv)} style={{ marginRight: '0.3rem' }} title="View / Print">🖨️</button>
                    <button onClick={() => handleEdit(inv)} style={{ marginRight: '0.3rem' }}>Edit</button>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button className="btn-success" onClick={() => handleMarkPaid(inv)} style={{ marginRight: '0.3rem', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>✓ Paid</button>
                    )}
                    <button className="btn-danger" onClick={() => handleDelete(inv.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Invoices
