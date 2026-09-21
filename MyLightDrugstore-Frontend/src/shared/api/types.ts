export type Role = 'admin' | 'staff';
export type SaleState = 'open' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';
export type MovementType = 'receipt' | 'sale' | 'adjustment' | 'sale_removal' | 'cancellation';
export type AdjustmentReason = 'stock_count' | 'damage' | 'expiry' | 'correction';
export type BackupState = 'queued' | 'running' | 'completed' | 'failed';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface MedicineBase {
  id: string;
  genericName: string;
  brandName: string;
  description: string;
  dosageForm: string;
  strength: string;
  unitPrice: string;
  storageLocation: string;
  active: boolean;
  createdAt: string;
}

export interface Medicine extends MedicineBase {
  stockOnHand: number;
}

export interface Lot {
  id: string;
  medicineId: string;
  quantity: number;
  initialQuantity: number;
  expiresAt: string;
  receiptId: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  lotId: string;
  medicineId: string;
  genericName: string;
  type: MovementType;
  quantityDelta: number;
  reason?: string;
  referenceId?: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  removed: boolean;
  removedAt?: string;
}

export interface Sale {
  id: string;
  state: SaleState;
  paymentStatus: PaymentStatus;
  items: SaleItem[];
  grandTotal: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface Receipt {
  id: string;
  receivedAt: string;
  createdBy: string;
  items: Array<{ medicineId: string; lotId: string; quantity: number; expiresAt: string }>;
}

export interface BackupJob {
  id: string;
  state: BackupState;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
  completedAt?: string;
  notes: string;
}

export interface AppDb {
  medicines: MedicineBase[];
  lots: Lot[];
  movements: Movement[];
  sales: Sale[];
  users: User[];
  passwords: Record<string, string>;
  backups: BackupJob[];
  idempotencyKeys: Record<string, unknown>;
  receipts: Receipt[];
  config: { lowStockThreshold: number; timezone: string };
  version: number;
}

export interface Session {
  userId: string;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
  requestId: string;
}

export class MockApiError extends Error {
  constructor(public status: number, public apiError: ApiError) {
    super(apiError.message);
  }
}
