import { createSeedDb } from './seed';
import type {
  AppDb, MedicineBase, Medicine, Lot, Movement, Sale, SaleItem,
  User, BackupJob, Receipt, Role, AdjustmentReason, Session,
} from './types';
import { MockApiError } from './types';

const DB_KEY = 'mld_db_v1';

function reqId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function apiErr(status: number, code: string, message: string, details?: Record<string, string>): MockApiError {
  return new MockApiError(status, { code, message, details, requestId: reqId() });
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export class MockApiClient {
  private session: Session | null = null;

  // ── DB ──────────────────────────────────────────────────────────────────
  getDb(): AppDb {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try {
        const db = JSON.parse(raw) as AppDb;
        if (db.version === 1) return db;
      } catch { /* fall through */ }
    }
    const fresh = createSeedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }

  saveDb(db: AppDb) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  resetDb() {
    localStorage.removeItem(DB_KEY);
    return this.getDb();
  }

  // ── Stock helpers ────────────────────────────────────────────────────────
  computeStock(lots: Lot[], medicineId: string): number {
    const t = today();
    return lots
      .filter(l => l.medicineId === medicineId && l.quantity > 0 && l.expiresAt >= t)
      .reduce((s, l) => s + l.quantity, 0);
  }

  enrichMedicine(m: MedicineBase, lots: Lot[]): Medicine {
    return { ...m, stockOnHand: this.computeStock(lots, m.id) };
  }

  private allocateFefo(db: AppDb, medicineId: string, qty: number): Array<{ lotId: string; qty: number }> | null {
    const t = today();
    const available = db.lots
      .filter(l => l.medicineId === medicineId && l.quantity > 0 && l.expiresAt >= t)
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    let remaining = qty;
    const allocs: Array<{ lotId: string; qty: number }> = [];
    for (const lot of available) {
      if (remaining <= 0) break;
      const take = Math.min(lot.quantity, remaining);
      allocs.push({ lotId: lot.id, qty: take });
      remaining -= take;
    }
    return remaining > 0 ? null : allocs;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  login(username: string, password: string): User {
    const db = this.getDb();
    const user = db.users.find(u => u.username === username && u.active);
    if (!user) throw apiErr(401, 'invalid_credentials', 'Invalid username or password.');
    if (db.passwords[user.id] !== password) throw apiErr(401, 'invalid_credentials', 'Invalid username or password.');
    this.session = { userId: user.id, user };
    return user;
  }

  logout() {
    this.session = null;
  }

  getMe(): User {
    if (!this.session) throw apiErr(401, 'unauthenticated', 'Not authenticated.');
    return this.session.user;
  }

  getSession(): Session | null {
    return this.session;
  }

  changePassword(currentPassword: string, newPassword: string) {
    const s = this.requireAuth();
    const db = this.getDb();
    if (db.passwords[s.userId] !== currentPassword) {
      throw apiErr(422, 'validation_failed', 'Current password is incorrect.', { currentPassword: 'Incorrect password.' });
    }
    if (currentPassword === newPassword) {
      throw apiErr(422, 'validation_failed', 'New password must differ from current.', { newPassword: 'Must differ from current password.' });
    }
    db.passwords[s.userId] = newPassword;
    this.saveDb(db);
  }

  private requireAuth(): Session {
    if (!this.session) throw apiErr(401, 'unauthenticated', 'Not authenticated.');
    return this.session;
  }

  private requireAdmin() {
    const s = this.requireAuth();
    if (s.user.role !== 'admin') throw apiErr(403, 'forbidden', 'Admin access required.');
    return s;
  }

  // ── Medicines ─────────────────────────────────────────────────────────────
  listMedicines(params: { q?: string; active?: boolean; lowStock?: boolean; page?: number; perPage?: number } = {}) {
    this.requireAuth();
    const db = this.getDb();
    const threshold = db.config.lowStockThreshold;
    let list = db.medicines.map(m => this.enrichMedicine(m, db.lots));
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter(m =>
        m.genericName.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.storageLocation.toLowerCase().includes(q)
      );
    }
    if (params.active !== undefined) list = list.filter(m => m.active === params.active);
    if (params.lowStock) list = list.filter(m => m.stockOnHand < threshold);
    const total = list.length;
    const page = params.page ?? 1;
    const perPage = Math.min(params.perPage ?? 25, 100);
    const start = (page - 1) * perPage;
    return { data: list.slice(start, start + perPage), meta: { page, perPage, total } };
  }

  getMedicine(id: string): Medicine {
    this.requireAuth();
    const db = this.getDb();
    const m = db.medicines.find(m => m.id === id);
    if (!m) throw apiErr(404, 'not_found', 'Medicine not found.');
    return this.enrichMedicine(m, db.lots);
  }

  createMedicine(data: Omit<MedicineBase, 'id' | 'active' | 'createdAt'>): Medicine {
    const s = this.requireAuth();
    const db = this.getDb();
    const m: MedicineBase = {
      id: newId('med'),
      ...data,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.medicines.push(m);
    this.saveDb(db);
    return this.enrichMedicine(m, db.lots);
  }

  updateMedicine(id: string, data: Partial<Omit<MedicineBase, 'id' | 'active' | 'createdAt'>>): Medicine {
    this.requireAuth();
    const db = this.getDb();
    const idx = db.medicines.findIndex(m => m.id === id);
    if (idx < 0) throw apiErr(404, 'not_found', 'Medicine not found.');
    db.medicines[idx] = { ...db.medicines[idx], ...data };
    this.saveDb(db);
    return this.enrichMedicine(db.medicines[idx], db.lots);
  }

  archiveMedicine(id: string) {
    this.requireAuth();
    const db = this.getDb();
    const idx = db.medicines.findIndex(m => m.id === id);
    if (idx < 0) throw apiErr(404, 'not_found', 'Medicine not found.');
    db.medicines[idx].active = false;
    this.saveDb(db);
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  getInventoryOverview() {
    this.requireAuth();
    const db = this.getDb();
    const threshold = db.config.lowStockThreshold;
    const t = today();
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 30);
    const soonStr = soonDate.toISOString().split('T')[0];

    const activeMeds = db.medicines.filter(m => m.active);
    const stockMap: Record<string, number> = {};
    activeMeds.forEach(m => { stockMap[m.id] = this.computeStock(db.lots, m.id); });

    return {
      medicineCount: activeMeds.length,
      totalStockUnits: Object.values(stockMap).reduce((s, v) => s + v, 0),
      lowStockCount: activeMeds.filter(m => stockMap[m.id] < threshold).length,
      expiringSoonCount: db.lots.filter(l => l.quantity > 0 && l.expiresAt >= t && l.expiresAt <= soonStr).length,
      expiredLotsCount: db.lots.filter(l => l.quantity > 0 && l.expiresAt < t).length,
    };
  }

  listLots(params: { medicineId?: string; expiresBefore?: string; available?: boolean } = {}) {
    this.requireAuth();
    const db = this.getDb();
    const t = today();
    let lots = db.lots;
    if (params.medicineId) lots = lots.filter(l => l.medicineId === params.medicineId);
    if (params.expiresBefore) lots = lots.filter(l => l.expiresAt <= params.expiresBefore!);
    if (params.available) lots = lots.filter(l => l.quantity > 0 && l.expiresAt >= t);
    // Enrich with medicine names
    return lots.map(l => {
      const m = db.medicines.find(m => m.id === l.medicineId);
      return { ...l, genericName: m?.genericName ?? '', brandName: m?.brandName ?? '', isExpired: l.expiresAt < t };
    });
  }

  receiveStock(data: { receivedAt: string; items: Array<{ medicineId: string; quantity: number; expiresAt: string }>; idempotencyKey?: string }) {
    const s = this.requireAuth();
    const db = this.getDb();
    if (data.idempotencyKey) {
      if (db.idempotencyKeys[data.idempotencyKey]) {
        return db.idempotencyKeys[data.idempotencyKey] as unknown as Receipt;
      }
    }
    // Validate
    for (const item of data.items) {
      if (!db.medicines.find(m => m.id === item.medicineId)) throw apiErr(422, 'validation_failed', `Medicine ${item.medicineId} not found.`);
      if (item.quantity <= 0) throw apiErr(422, 'validation_failed', 'Quantity must be positive.');
    }
    const receiptId = newId('rec');
    const now = new Date().toISOString();
    const receiptItems: Receipt['items'] = [];
    for (const item of data.items) {
      const lotId = newId('lot');
      const lot: Lot = {
        id: lotId, medicineId: item.medicineId,
        quantity: item.quantity, initialQuantity: item.quantity,
        expiresAt: item.expiresAt, receiptId, createdAt: now,
      };
      db.lots.push(lot);
      const med = db.medicines.find(m => m.id === item.medicineId)!;
      db.movements.push({
        id: newId('mv'), lotId, medicineId: item.medicineId, genericName: med.genericName,
        type: 'receipt', quantityDelta: item.quantity, referenceId: receiptId,
        actorId: s.userId, actorName: s.user.fullName, createdAt: now,
      });
      receiptItems.push({ medicineId: item.medicineId, lotId, quantity: item.quantity, expiresAt: item.expiresAt });
    }
    const receipt: Receipt = { id: receiptId, receivedAt: data.receivedAt, createdBy: s.userId, items: receiptItems };
    db.receipts.push(receipt);
    if (data.idempotencyKey) db.idempotencyKeys[data.idempotencyKey] = receipt as unknown as string;
    this.saveDb(db);
    return receipt;
  }

  recordAdjustment(data: { reason: AdjustmentReason; items: Array<{ lotId: string; quantityDelta: number }> }) {
    const s = this.requireAuth();
    const db = this.getDb();
    // Validate all first
    for (const item of data.items) {
      const lot = db.lots.find(l => l.id === item.lotId);
      if (!lot) throw apiErr(404, 'not_found', `Lot ${item.lotId} not found.`);
      if (lot.quantity + item.quantityDelta < 0) {
        throw apiErr(422, 'validation_failed', `Adjustment would put lot ${item.lotId} below zero.`);
      }
    }
    const now = new Date().toISOString();
    for (const item of data.items) {
      const lot = db.lots.find(l => l.id === item.lotId)!;
      lot.quantity += item.quantityDelta;
      const med = db.medicines.find(m => m.id === lot.medicineId)!;
      db.movements.push({
        id: newId('mv'), lotId: lot.id, medicineId: lot.medicineId, genericName: med?.genericName ?? '',
        type: 'adjustment', quantityDelta: item.quantityDelta, reason: data.reason,
        actorId: s.userId, actorName: s.user.fullName, createdAt: now,
      });
    }
    this.saveDb(db);
  }

  listMovements(params: { medicineId?: string; type?: string; page?: number; perPage?: number } = {}) {
    this.requireAuth();
    const db = this.getDb();
    let mvs = [...db.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (params.medicineId) mvs = mvs.filter(m => m.medicineId === params.medicineId);
    if (params.type) mvs = mvs.filter(m => m.type === params.type);
    const total = mvs.length;
    const page = params.page ?? 1;
    const perPage = Math.min(params.perPage ?? 25, 100);
    const start = (page - 1) * perPage;
    return { data: mvs.slice(start, start + perPage), meta: { page, perPage, total } };
  }

  // ── Sales ─────────────────────────────────────────────────────────────────
  listSales(params: { paymentStatus?: string; state?: string; from?: string; to?: string; createdBy?: string; page?: number; perPage?: number } = {}) {
    this.requireAuth();
    const db = this.getDb();
    let list = [...db.sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (params.paymentStatus) list = list.filter(s => s.paymentStatus === params.paymentStatus);
    if (params.state) list = list.filter(s => s.state === params.state);
    if (params.from) list = list.filter(s => s.createdAt >= params.from!);
    if (params.to) list = list.filter(s => s.createdAt <= params.to! + 'T23:59:59Z');
    if (params.createdBy) list = list.filter(s => s.createdBy === params.createdBy);
    const total = list.length;
    const page = params.page ?? 1;
    const perPage = Math.min(params.perPage ?? 25, 100);
    const start = (page - 1) * perPage;
    return { data: list.slice(start, start + perPage), meta: { page, perPage, total } };
  }

  getSale(id: string): Sale {
    this.requireAuth();
    const db = this.getDb();
    const sale = db.sales.find(s => s.id === id);
    if (!sale) throw apiErr(404, 'not_found', 'Sale not found.');
    return sale;
  }

  createSale(items: Array<{ medicineId: string; quantity: number }>, idempotencyKey?: string): Sale {
    const s = this.requireAuth();
    const db = this.getDb();
    if (idempotencyKey && db.idempotencyKeys[idempotencyKey]) {
      return db.idempotencyKeys[idempotencyKey] as unknown as Sale;
    }
    const now = new Date().toISOString();
    const saleId = newId('sale');
    const saleItems: SaleItem[] = [];
    // Allocate stock for all items atomically
    const allocs: Array<{ medicineId: string; allocs: Array<{ lotId: string; qty: number }>; med: MedicineBase; qty: number }> = [];
    for (const item of items) {
      const med = db.medicines.find(m => m.id === item.medicineId && m.active);
      if (!med) throw apiErr(404, 'not_found', `Medicine ${item.medicineId} not found.`);
      if (item.quantity <= 0) throw apiErr(422, 'validation_failed', 'Quantity must be positive.');
      const alloc = this.allocateFefo(db, item.medicineId, item.quantity);
      if (!alloc) throw apiErr(409, 'insufficient_stock', `Insufficient stock for ${med.genericName}.`);
      allocs.push({ medicineId: item.medicineId, allocs: alloc, med, qty: item.quantity });
    }
    // Apply allocations
    for (const a of allocs) {
      const itemId = newId('si');
      saleItems.push({
        id: itemId, saleId, medicineId: a.medicineId,
        genericName: a.med.genericName, brandName: a.med.brandName,
        dosageForm: a.med.dosageForm, strength: a.med.strength,
        quantity: a.qty, unitPrice: a.med.unitPrice,
        lineTotal: (a.qty * parseFloat(a.med.unitPrice)).toFixed(2),
        removed: false,
      });
      for (const alloc of a.allocs) {
        const lot = db.lots.find(l => l.id === alloc.lotId)!;
        lot.quantity -= alloc.qty;
        db.movements.push({
          id: newId('mv'), lotId: alloc.lotId, medicineId: a.medicineId, genericName: a.med.genericName,
          type: 'sale', quantityDelta: -alloc.qty, referenceId: saleId,
          actorId: s.userId, actorName: s.user.fullName, createdAt: now,
        });
      }
    }
    const grandTotal = saleItems.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2);
    const sale: Sale = {
      id: saleId, state: 'open', paymentStatus: 'unpaid', items: saleItems, grandTotal,
      createdBy: s.userId, createdByName: s.user.fullName, createdAt: now,
    };
    db.sales.push(sale);
    if (idempotencyKey) db.idempotencyKeys[idempotencyKey] = sale as unknown as string;
    this.saveDb(db);
    return sale;
  }

  addSaleItem(saleId: string, item: { medicineId: string; quantity: number }, idempotencyKey?: string): Sale {
    const s = this.requireAuth();
    const db = this.getDb();
    if (idempotencyKey && db.idempotencyKeys[idempotencyKey]) {
      const cached = db.sales.find(sale => sale.id === saleId);
      if (cached) return cached;
    }
    const saleIdx = db.sales.findIndex(s => s.id === saleId);
    if (saleIdx < 0) throw apiErr(404, 'not_found', 'Sale not found.');
    const sale = db.sales[saleIdx];
    if (sale.state !== 'open') throw apiErr(409, 'invalid_state', 'Sale is not open.');
    const med = db.medicines.find(m => m.id === item.medicineId && m.active);
    if (!med) throw apiErr(404, 'not_found', 'Medicine not found.');
    if (item.quantity <= 0) throw apiErr(422, 'validation_failed', 'Quantity must be positive.');
    const alloc = this.allocateFefo(db, item.medicineId, item.quantity);
    if (!alloc) throw apiErr(409, 'insufficient_stock', `Insufficient stock for ${med.genericName}.`);
    const now = new Date().toISOString();
    const itemId = newId('si');
    const newItem: SaleItem = {
      id: itemId, saleId, medicineId: item.medicineId,
      genericName: med.genericName, brandName: med.brandName,
      dosageForm: med.dosageForm, strength: med.strength,
      quantity: item.quantity, unitPrice: med.unitPrice,
      lineTotal: (item.quantity * parseFloat(med.unitPrice)).toFixed(2),
      removed: false,
    };
    for (const a of alloc) {
      const lot = db.lots.find(l => l.id === a.lotId)!;
      lot.quantity -= a.qty;
      db.movements.push({
        id: newId('mv'), lotId: a.lotId, medicineId: item.medicineId, genericName: med.genericName,
        type: 'sale', quantityDelta: -a.qty, referenceId: saleId,
        actorId: s.userId, actorName: s.user.fullName, createdAt: now,
      });
    }
    sale.items.push(newItem);
    sale.grandTotal = sale.items.filter(i => !i.removed).reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2);
    if (idempotencyKey) db.idempotencyKeys[idempotencyKey] = sale as unknown as string;
    this.saveDb(db);
    return sale;
  }

  removeSaleItem(saleId: string, saleItemId: string): Sale {
    const s = this.requireAuth();
    const db = this.getDb();
    const saleIdx = db.sales.findIndex(s => s.id === saleId);
    if (saleIdx < 0) throw apiErr(404, 'not_found', 'Sale not found.');
    const sale = db.sales[saleIdx];
    if (sale.state !== 'open') throw apiErr(409, 'invalid_state', 'Sale is not open.');
    const itemIdx = sale.items.findIndex(i => i.id === saleItemId && !i.removed);
    if (itemIdx < 0) throw apiErr(404, 'not_found', 'Sale item not found.');
    const item = sale.items[itemIdx];
    const now = new Date().toISOString();
    item.removed = true;
    item.removedAt = now;
    // Restore stock: add back to the latest lot for this medicine
    const lot = db.lots.filter(l => l.medicineId === item.medicineId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (lot) {
      lot.quantity += item.quantity;
      const med = db.medicines.find(m => m.id === item.medicineId);
      db.movements.push({
        id: newId('mv'), lotId: lot.id, medicineId: item.medicineId, genericName: med?.genericName ?? '',
        type: 'sale_removal', quantityDelta: item.quantity, referenceId: saleId,
        actorId: s.userId, actorName: s.user.fullName, createdAt: now,
      });
    }
    sale.grandTotal = sale.items.filter(i => !i.removed).reduce((sum, i) => sum + parseFloat(i.lineTotal), 0).toFixed(2);
    this.saveDb(db);
    return sale;
  }

  markSalePaid(saleId: string): Sale {
    const s = this.requireAuth();
    const db = this.getDb();
    const sale = db.sales.find(s => s.id === saleId);
    if (!sale) throw apiErr(404, 'not_found', 'Sale not found.');
    if (sale.state === 'completed') return sale;
    if (sale.state !== 'open') throw apiErr(409, 'invalid_state', 'Only open sales can be completed.');
    sale.state = 'completed';
    sale.paymentStatus = 'paid';
    sale.completedAt = new Date().toISOString();
    // Update session user name in case it changed
    this.saveDb(db);
    return sale;
  }

  cancelSale(saleId: string, reason: string): Sale {
    const s = this.requireAuth();
    const db = this.getDb();
    const sale = db.sales.find(s => s.id === saleId);
    if (!sale) throw apiErr(404, 'not_found', 'Sale not found.');
    if (sale.state === 'cancelled') return sale;
    if (sale.state !== 'open') throw apiErr(409, 'invalid_state', 'Only open sales can be cancelled.');
    const now = new Date().toISOString();
    sale.state = 'cancelled';
    sale.cancelledAt = now;
    sale.cancellationReason = reason;
    // Restore stock for all non-removed active items
    for (const item of sale.items.filter(i => !i.removed)) {
      const lot = db.lots.filter(l => l.medicineId === item.medicineId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (lot) {
        lot.quantity += item.quantity;
        const med = db.medicines.find(m => m.id === item.medicineId);
        db.movements.push({
          id: newId('mv'), lotId: lot.id, medicineId: item.medicineId, genericName: med?.genericName ?? '',
          type: 'cancellation', quantityDelta: item.quantity, referenceId: saleId,
          actorId: s.userId, actorName: s.user.fullName, createdAt: now,
        });
      }
    }
    this.saveDb(db);
    return sale;
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  getInventoryReport(params: { lowStock?: boolean; expiresBefore?: string } = {}) {
    this.requireAuth();
    const db = this.getDb();
    const threshold = db.config.lowStockThreshold;
    const t = today();
    let meds = db.medicines.filter(m => m.active).map(m => this.enrichMedicine(m, db.lots));
    if (params.lowStock) meds = meds.filter(m => m.stockOnHand < threshold);
    const expiresBefore = params.expiresBefore ?? (() => { const soon = new Date(); soon.setDate(soon.getDate() + 30); return soon.toISOString().split('T')[0]; })();
    const expiring = this.listLots({ expiresBefore, available: true });
    return { medicines: meds, expiringLots: expiring, threshold };
  }

  getSalesReport(params: { from?: string; to?: string } = {}) {
    this.requireAuth();
    const db = this.getDb();
    let sales = db.sales.filter(s => s.state === 'completed');
    if (params.from) sales = sales.filter(s => s.createdAt >= params.from!);
    if (params.to) sales = sales.filter(s => s.createdAt <= params.to! + 'T23:59:59Z');
    const totalGross = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal), 0).toFixed(2);
    // Group by medicine
    const medMap: Record<string, { genericName: string; brandName: string; unitsSold: number; saleCount: number; gross: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items.filter(i => !i.removed)) {
        const key = item.medicineId;
        if (!medMap[key]) medMap[key] = { genericName: item.genericName, brandName: item.brandName, unitsSold: 0, saleCount: 0, gross: 0 };
        medMap[key].unitsSold += item.quantity;
        medMap[key].saleCount += 1;
        medMap[key].gross += parseFloat(item.lineTotal);
      }
    }
    return { sales, totalGross, byMedicine: Object.values(medMap).sort((a, b) => b.gross - a.gross), saleCount: sales.length };
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  listUsers() {
    this.requireAdmin();
    const db = this.getDb();
    return db.users;
  }

  getUser(id: string): User {
    this.requireAdmin();
    const db = this.getDb();
    const u = db.users.find(u => u.id === id);
    if (!u) throw apiErr(404, 'not_found', 'User not found.');
    return u;
  }

  createUser(data: { username: string; fullName: string; password: string; role: Role }): User {
    this.requireAdmin();
    const db = this.getDb();
    if (db.users.find(u => u.username === data.username)) {
      throw apiErr(422, 'validation_failed', 'Username already exists.', { username: 'Already taken.' });
    }
    const user: User = { id: newId('user'), username: data.username, fullName: data.fullName, role: data.role, active: true, createdAt: new Date().toISOString() };
    db.users.push(user);
    db.passwords[user.id] = data.password;
    this.saveDb(db);
    return user;
  }

  updateUser(id: string, data: { fullName?: string; role?: Role; active?: boolean }): User {
    const s = this.requireAdmin();
    const db = this.getDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx < 0) throw apiErr(404, 'not_found', 'User not found.');
    if (data.active === false && id === s.userId) {
      throw apiErr(422, 'validation_failed', 'Cannot deactivate your own account.');
    }
    db.users[idx] = { ...db.users[idx], ...data };
    this.saveDb(db);
    // Update session if same user
    if (id === s.userId) this.session = { ...s, user: db.users[idx] };
    return db.users[idx];
  }

  // ── Backups ───────────────────────────────────────────────────────────────
  requestBackup(): BackupJob {
    const s = this.requireAuth();
    const db = this.getDb();
    const job: BackupJob = {
      id: newId('bk'), state: 'queued', requestedBy: s.userId, requestedByName: s.user.fullName,
      createdAt: new Date().toISOString(), notes: 'Backup queued. Estimated completion: 30 seconds.',
    };
    db.backups.push(job);
    this.saveDb(db);
    // Simulate async completion
    setTimeout(() => {
      const db2 = this.getDb();
      const j = db2.backups.find(b => b.id === job.id);
      if (j && j.state === 'queued') {
        j.state = 'running';
        this.saveDb(db2);
        setTimeout(() => {
          const db3 = this.getDb();
          const j2 = db3.backups.find(b => b.id === job.id);
          if (j2) {
            j2.state = 'completed';
            j2.completedAt = new Date().toISOString();
            j2.notes = 'Backup completed successfully. Artifact: mld_backup_demo.sql.gz (2.4 MB). No real database content.';
          }
          this.saveDb(db3);
        }, 8000);
      }
    }, 3000);
    return job;
  }

  listBackups(): BackupJob[] {
    this.requireAdmin();
    const db = this.getDb();
    return [...db.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getBackup(id: string): BackupJob {
    this.requireAdmin();
    const db = this.getDb();
    const bk = db.backups.find(b => b.id === id);
    if (!bk) throw apiErr(404, 'not_found', 'Backup job not found.');
    return bk;
  }

  getSystemTime() {
    this.requireAuth();
    return { utc: new Date().toISOString(), timezone: 'Asia/Manila' };
  }

  getConfig() {
    this.requireAuth();
    return this.getDb().config;
  }
}

export const mockApi = new MockApiClient();
