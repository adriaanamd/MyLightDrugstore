import type { AppDb, MedicineBase, Lot, Movement, Sale, SaleItem, User, BackupJob, Receipt } from './types';

let _idCounter = 1000;
function uid(prefix: string) {
  return `${prefix}_${(++_idCounter).toString(36)}`;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function dAgo(days: number) { return isoAgo(days * 86400000); }
function hAgo(hours: number) { return isoAgo(hours * 3600000); }

export function createSeedDb(): AppDb {
  const adminId = 'user_admin';
  const staff1Id = 'user_s1';
  const staff2Id = 'user_s2';
  const staff3Id = 'user_s3';

  const users: User[] = [
    { id: adminId, username: 'admin.reyes', fullName: 'Maria Reyes', role: 'admin', active: true, createdAt: dAgo(180) },
    { id: staff1Id, username: 'staff.bautista', fullName: 'Jose Bautista', role: 'staff', active: true, createdAt: dAgo(120) },
    { id: staff2Id, username: 'staff.santos', fullName: 'Ana Santos', role: 'staff', active: true, createdAt: dAgo(90) },
    { id: staff3Id, username: 'staff.garcia', fullName: 'Carlos Garcia', role: 'staff', active: false, createdAt: dAgo(200) },
  ];

  const passwords: Record<string, string> = {
    [adminId]: 'admin1234',
    [staff1Id]: 'staff1234',
    [staff2Id]: 'staff1234',
    [staff3Id]: 'staff1234',
  };

  const meds: MedicineBase[] = [
    { id: 'med_001', genericName: 'Amoxicillin', brandName: 'Amoxil', description: 'Broad-spectrum penicillin antibiotic', dosageForm: 'Capsule', strength: '500mg', unitPrice: '12.50', storageLocation: 'Shelf A-1', active: true, createdAt: dAgo(150) },
    { id: 'med_002', genericName: 'Metformin HCl', brandName: 'Glucophage', description: 'Oral biguanide antidiabetic', dosageForm: 'Tablet', strength: '500mg', unitPrice: '8.75', storageLocation: 'Shelf B-2', active: true, createdAt: dAgo(140) },
    { id: 'med_003', genericName: 'Amlodipine', brandName: 'Norvasc', description: 'Calcium channel blocker for hypertension', dosageForm: 'Tablet', strength: '5mg', unitPrice: '15.00', storageLocation: 'Shelf B-3', active: true, createdAt: dAgo(130) },
    { id: 'med_004', genericName: 'Losartan Potassium', brandName: 'Cozaar', description: 'Angiotensin receptor blocker', dosageForm: 'Tablet', strength: '50mg', unitPrice: '22.00', storageLocation: 'Shelf B-4', active: true, createdAt: dAgo(120) },
    { id: 'med_005', genericName: 'Cetirizine HCl', brandName: 'Zyrtec', description: 'Second-generation antihistamine', dosageForm: 'Tablet', strength: '10mg', unitPrice: '6.50', storageLocation: 'Shelf C-1', active: true, createdAt: dAgo(110) },
    { id: 'med_006', genericName: 'Omeprazole', brandName: 'Losec', description: 'Proton pump inhibitor for GERD', dosageForm: 'Capsule', strength: '20mg', unitPrice: '18.25', storageLocation: 'Shelf C-2', active: true, createdAt: dAgo(100) },
    { id: 'med_007', genericName: 'Paracetamol', brandName: 'Biogesic', description: 'Analgesic and antipyretic', dosageForm: 'Tablet', strength: '500mg', unitPrice: '4.00', storageLocation: 'Shelf A-2', active: true, createdAt: dAgo(90) },
    { id: 'med_008', genericName: 'Salbutamol', brandName: 'Ventolin', description: 'Short-acting beta-2 agonist for asthma', dosageForm: 'Inhaler', strength: '100mcg/dose', unitPrice: '285.00', storageLocation: 'Shelf D-1', active: true, createdAt: dAgo(85) },
    { id: 'med_009', genericName: 'Atorvastatin', brandName: 'Lipitor', description: 'HMG-CoA reductase inhibitor for dyslipidemia', dosageForm: 'Tablet', strength: '20mg', unitPrice: '35.00', storageLocation: 'Shelf B-5', active: true, createdAt: dAgo(80) },
    { id: 'med_010', genericName: 'Azithromycin', brandName: 'Zithromax', description: 'Macrolide antibiotic for respiratory infections', dosageForm: 'Tablet', strength: '500mg', unitPrice: '55.00', storageLocation: 'Shelf A-3', active: true, createdAt: dAgo(75) },
    { id: 'med_011', genericName: 'Insulin Glargine', brandName: 'Lantus', description: 'Long-acting basal insulin analogue', dosageForm: 'Injection', strength: '100 IU/mL', unitPrice: '980.00', storageLocation: 'Refrigerator R-1', active: true, createdAt: dAgo(70) },
    { id: 'med_012', genericName: 'Ibuprofen', brandName: 'Advil', description: 'NSAID for pain and inflammation', dosageForm: 'Tablet', strength: '400mg', unitPrice: '9.00', storageLocation: 'Shelf A-4', active: true, createdAt: dAgo(60) },
    { id: 'med_013', genericName: 'Mefenamic Acid', brandName: 'Ponstan', description: 'NSAID analgesic for mild to moderate pain', dosageForm: 'Capsule', strength: '500mg', unitPrice: '11.00', storageLocation: 'Shelf A-5', active: false, createdAt: dAgo(200) },
  ];

  const receiptId1 = 'rec_001';
  const receiptId2 = 'rec_002';
  const receiptId3 = 'rec_003';

  const lots: Lot[] = [
    // Amoxicillin - good stock
    { id: 'lot_001', medicineId: 'med_001', quantity: 120, initialQuantity: 200, expiresAt: daysFromNow(365), receiptId: receiptId1, createdAt: dAgo(60) },
    { id: 'lot_002', medicineId: 'med_001', quantity: 80, initialQuantity: 100, expiresAt: daysFromNow(180), receiptId: receiptId2, createdAt: dAgo(30) },
    // Metformin - good stock
    { id: 'lot_003', medicineId: 'med_002', quantity: 150, initialQuantity: 300, expiresAt: daysFromNow(400), receiptId: receiptId1, createdAt: dAgo(60) },
    // Amlodipine - low stock
    { id: 'lot_004', medicineId: 'med_003', quantity: 18, initialQuantity: 50, expiresAt: daysFromNow(300), receiptId: receiptId1, createdAt: dAgo(60) },
    // Losartan - good stock
    { id: 'lot_005', medicineId: 'med_004', quantity: 200, initialQuantity: 200, expiresAt: daysFromNow(450), receiptId: receiptId2, createdAt: dAgo(30) },
    // Cetirizine - low stock
    { id: 'lot_006', medicineId: 'med_005', quantity: 22, initialQuantity: 100, expiresAt: daysFromNow(200), receiptId: receiptId1, createdAt: dAgo(60) },
    // Omeprazole - expiring soon
    { id: 'lot_007', medicineId: 'med_006', quantity: 45, initialQuantity: 100, expiresAt: daysFromNow(15), receiptId: receiptId1, createdAt: dAgo(90) },
    { id: 'lot_008', medicineId: 'med_006', quantity: 30, initialQuantity: 50, expiresAt: daysFromNow(180), receiptId: receiptId3, createdAt: dAgo(10) },
    // Paracetamol - good stock
    { id: 'lot_009', medicineId: 'med_007', quantity: 500, initialQuantity: 1000, expiresAt: daysFromNow(730), receiptId: receiptId1, createdAt: dAgo(60) },
    // Salbutamol - low stock
    { id: 'lot_010', medicineId: 'med_008', quantity: 8, initialQuantity: 20, expiresAt: daysFromNow(365), receiptId: receiptId2, createdAt: dAgo(40) },
    // Atorvastatin - good stock
    { id: 'lot_011', medicineId: 'med_009', quantity: 60, initialQuantity: 100, expiresAt: daysFromNow(500), receiptId: receiptId2, createdAt: dAgo(30) },
    // Azithromycin - very low stock
    { id: 'lot_012', medicineId: 'med_010', quantity: 12, initialQuantity: 50, expiresAt: daysFromNow(250), receiptId: receiptId1, createdAt: dAgo(60) },
    // Insulin - cold chain, good stock
    { id: 'lot_013', medicineId: 'med_011', quantity: 35, initialQuantity: 50, expiresAt: daysFromNow(90), receiptId: receiptId3, createdAt: dAgo(5) },
    // Ibuprofen - good stock
    { id: 'lot_014', medicineId: 'med_012', quantity: 300, initialQuantity: 400, expiresAt: daysFromNow(600), receiptId: receiptId2, createdAt: dAgo(30) },
    // Expired lot for Omeprazole (testing)
    { id: 'lot_015', medicineId: 'med_006', quantity: 10, initialQuantity: 50, expiresAt: daysFromNow(-30), receiptId: receiptId1, createdAt: dAgo(120) },
    // Expiring soon - Insulin
    { id: 'lot_016', medicineId: 'med_011', quantity: 5, initialQuantity: 10, expiresAt: daysFromNow(7), receiptId: receiptId2, createdAt: dAgo(50) },
    // Mefenamic (archived) - some lot
    { id: 'lot_017', medicineId: 'med_013', quantity: 0, initialQuantity: 100, expiresAt: daysFromNow(200), receiptId: receiptId1, createdAt: dAgo(180) },
    // Extra Paracetamol lot
    { id: 'lot_018', medicineId: 'med_007', quantity: 200, initialQuantity: 500, expiresAt: daysFromNow(400), receiptId: receiptId3, createdAt: dAgo(10) },
    // Metformin expiring soon
    { id: 'lot_019', medicineId: 'med_002', quantity: 25, initialQuantity: 50, expiresAt: daysFromNow(20), receiptId: receiptId2, createdAt: dAgo(40) },
    // Losartan extra
    { id: 'lot_020', medicineId: 'med_004', quantity: 100, initialQuantity: 100, expiresAt: daysFromNow(365), receiptId: receiptId3, createdAt: dAgo(5) },
  ];

  const receipts: Receipt[] = [
    {
      id: receiptId1,
      receivedAt: dAgo(60),
      createdBy: staff1Id,
      items: [
        { medicineId: 'med_001', lotId: 'lot_001', quantity: 200, expiresAt: daysFromNow(365) },
        { medicineId: 'med_002', lotId: 'lot_003', quantity: 300, expiresAt: daysFromNow(400) },
        { medicineId: 'med_003', lotId: 'lot_004', quantity: 50, expiresAt: daysFromNow(300) },
        { medicineId: 'med_005', lotId: 'lot_006', quantity: 100, expiresAt: daysFromNow(200) },
        { medicineId: 'med_006', lotId: 'lot_007', quantity: 100, expiresAt: daysFromNow(15) },
        { medicineId: 'med_006', lotId: 'lot_015', quantity: 50, expiresAt: daysFromNow(-30) },
        { medicineId: 'med_007', lotId: 'lot_009', quantity: 1000, expiresAt: daysFromNow(730) },
        { medicineId: 'med_010', lotId: 'lot_012', quantity: 50, expiresAt: daysFromNow(250) },
        { medicineId: 'med_013', lotId: 'lot_017', quantity: 100, expiresAt: daysFromNow(200) },
      ],
    },
    {
      id: receiptId2,
      receivedAt: dAgo(30),
      createdBy: staff2Id,
      items: [
        { medicineId: 'med_001', lotId: 'lot_002', quantity: 100, expiresAt: daysFromNow(180) },
        { medicineId: 'med_004', lotId: 'lot_005', quantity: 200, expiresAt: daysFromNow(450) },
        { medicineId: 'med_008', lotId: 'lot_010', quantity: 20, expiresAt: daysFromNow(365) },
        { medicineId: 'med_009', lotId: 'lot_011', quantity: 100, expiresAt: daysFromNow(500) },
        { medicineId: 'med_011', lotId: 'lot_016', quantity: 10, expiresAt: daysFromNow(7) },
        { medicineId: 'med_012', lotId: 'lot_014', quantity: 400, expiresAt: daysFromNow(600) },
        { medicineId: 'med_002', lotId: 'lot_019', quantity: 50, expiresAt: daysFromNow(20) },
      ],
    },
    {
      id: receiptId3,
      receivedAt: dAgo(5),
      createdBy: adminId,
      items: [
        { medicineId: 'med_006', lotId: 'lot_008', quantity: 50, expiresAt: daysFromNow(180) },
        { medicineId: 'med_007', lotId: 'lot_018', quantity: 500, expiresAt: daysFromNow(400) },
        { medicineId: 'med_011', lotId: 'lot_013', quantity: 50, expiresAt: daysFromNow(90) },
        { medicineId: 'med_004', lotId: 'lot_020', quantity: 100, expiresAt: daysFromNow(365) },
      ],
    },
  ];

  const saleItems = (saleId: string, lines: Array<{ lotId: string; medId: string; gn: string; bn: string; df: string; st: string; qty: number; price: string }>): SaleItem[] =>
    lines.map((l, i) => ({
      id: `si_${saleId}_${i}`,
      saleId,
      medicineId: l.medId,
      genericName: l.gn,
      brandName: l.bn,
      dosageForm: l.df,
      strength: l.st,
      quantity: l.qty,
      unitPrice: l.price,
      lineTotal: (l.qty * parseFloat(l.price)).toFixed(2),
      removed: false,
    }));

  const computeGrand = (items: SaleItem[]) =>
    items.filter(i => !i.removed).reduce((s, i) => s + parseFloat(i.lineTotal), 0).toFixed(2);

  const sale1Items = saleItems('sale_001', [
    { lotId: 'lot_009', medId: 'med_007', gn: 'Paracetamol', bn: 'Biogesic', df: 'Tablet', st: '500mg', qty: 10, price: '4.00' },
    { lotId: 'lot_001', medId: 'med_001', gn: 'Amoxicillin', bn: 'Amoxil', df: 'Capsule', st: '500mg', qty: 6, price: '12.50' },
  ]);
  const sale2Items = saleItems('sale_002', [
    { lotId: 'lot_003', medId: 'med_002', gn: 'Metformin HCl', bn: 'Glucophage', df: 'Tablet', st: '500mg', qty: 30, price: '8.75' },
  ]);
  const sale3Items = saleItems('sale_003', [
    { lotId: 'lot_011', medId: 'med_009', gn: 'Atorvastatin', bn: 'Lipitor', df: 'Tablet', st: '20mg', qty: 7, price: '35.00' },
    { lotId: 'lot_004', medId: 'med_003', gn: 'Amlodipine', bn: 'Norvasc', df: 'Tablet', st: '5mg', qty: 14, price: '15.00' },
  ]);
  const sale4Items = saleItems('sale_004', [
    { lotId: 'lot_009', medId: 'med_007', gn: 'Paracetamol', bn: 'Biogesic', df: 'Tablet', st: '500mg', qty: 20, price: '4.00' },
    { lotId: 'lot_006', medId: 'med_005', gn: 'Cetirizine HCl', bn: 'Zyrtec', df: 'Tablet', st: '10mg', qty: 10, price: '6.50' },
  ]);
  const sale5Items = saleItems('sale_005', [
    { lotId: 'lot_007', medId: 'med_006', gn: 'Omeprazole', bn: 'Losec', df: 'Capsule', st: '20mg', qty: 14, price: '18.25' },
  ]);
  const sale6Items = saleItems('sale_006', [
    { lotId: 'lot_010', medId: 'med_008', gn: 'Salbutamol', bn: 'Ventolin', df: 'Inhaler', st: '100mcg/dose', qty: 2, price: '285.00' },
  ]);
  // Open unpaid sale
  const sale7Items = saleItems('sale_007', [
    { lotId: 'lot_014', medId: 'med_012', gn: 'Ibuprofen', bn: 'Advil', df: 'Tablet', st: '400mg', qty: 12, price: '9.00' },
    { lotId: 'lot_005', medId: 'med_004', gn: 'Losartan Potassium', bn: 'Cozaar', df: 'Tablet', st: '50mg', qty: 30, price: '22.00' },
  ]);
  // Cancelled sale
  const sale8Items = saleItems('sale_008', [
    { lotId: 'lot_012', medId: 'med_010', gn: 'Azithromycin', bn: 'Zithromax', df: 'Tablet', st: '500mg', qty: 3, price: '55.00' },
  ]);

  const sales: Sale[] = [
    { id: 'sale_001', state: 'completed', paymentStatus: 'paid', items: sale1Items, grandTotal: computeGrand(sale1Items), createdBy: staff1Id, createdByName: 'Jose Bautista', createdAt: dAgo(48), completedAt: dAgo(47) },
    { id: 'sale_002', state: 'completed', paymentStatus: 'paid', items: sale2Items, grandTotal: computeGrand(sale2Items), createdBy: staff2Id, createdByName: 'Ana Santos', createdAt: dAgo(36), completedAt: dAgo(35) },
    { id: 'sale_003', state: 'completed', paymentStatus: 'paid', items: sale3Items, grandTotal: computeGrand(sale3Items), createdBy: staff1Id, createdByName: 'Jose Bautista', createdAt: dAgo(24), completedAt: dAgo(24) },
    { id: 'sale_004', state: 'completed', paymentStatus: 'paid', items: sale4Items, grandTotal: computeGrand(sale4Items), createdBy: staff2Id, createdByName: 'Ana Santos', createdAt: dAgo(12), completedAt: dAgo(12) },
    { id: 'sale_005', state: 'completed', paymentStatus: 'paid', items: sale5Items, grandTotal: computeGrand(sale5Items), createdBy: adminId, createdByName: 'Maria Reyes', createdAt: dAgo(6), completedAt: dAgo(6) },
    { id: 'sale_006', state: 'completed', paymentStatus: 'paid', items: sale6Items, grandTotal: computeGrand(sale6Items), createdBy: staff1Id, createdByName: 'Jose Bautista', createdAt: hAgo(4), completedAt: hAgo(3) },
    { id: 'sale_007', state: 'open', paymentStatus: 'unpaid', items: sale7Items, grandTotal: computeGrand(sale7Items), createdBy: staff2Id, createdByName: 'Ana Santos', createdAt: hAgo(1) },
    { id: 'sale_008', state: 'cancelled', paymentStatus: 'unpaid', items: sale8Items, grandTotal: '0.00', createdBy: staff1Id, createdByName: 'Jose Bautista', createdAt: dAgo(3), cancelledAt: dAgo(3), cancellationReason: 'entered_in_error' },
  ];

  const movements: Movement[] = [
    // Receipts
    { id: 'mv_001', lotId: 'lot_001', medicineId: 'med_001', genericName: 'Amoxicillin', type: 'receipt', quantityDelta: 200, referenceId: receiptId1, actorId: staff1Id, actorName: 'Jose Bautista', createdAt: dAgo(60) },
    { id: 'mv_002', lotId: 'lot_009', medicineId: 'med_007', genericName: 'Paracetamol', type: 'receipt', quantityDelta: 1000, referenceId: receiptId1, actorId: staff1Id, actorName: 'Jose Bautista', createdAt: dAgo(60) },
    { id: 'mv_003', lotId: 'lot_002', medicineId: 'med_001', genericName: 'Amoxicillin', type: 'receipt', quantityDelta: 100, referenceId: receiptId2, actorId: staff2Id, actorName: 'Ana Santos', createdAt: dAgo(30) },
    { id: 'mv_004', lotId: 'lot_013', medicineId: 'med_011', genericName: 'Insulin Glargine', type: 'receipt', quantityDelta: 50, referenceId: receiptId3, actorId: adminId, actorName: 'Maria Reyes', createdAt: dAgo(5) },
    // Sales
    { id: 'mv_005', lotId: 'lot_009', medicineId: 'med_007', genericName: 'Paracetamol', type: 'sale', quantityDelta: -10, referenceId: 'sale_001', actorId: staff1Id, actorName: 'Jose Bautista', createdAt: dAgo(47) },
    { id: 'mv_006', lotId: 'lot_001', medicineId: 'med_001', genericName: 'Amoxicillin', type: 'sale', quantityDelta: -6, referenceId: 'sale_001', actorId: staff1Id, actorName: 'Jose Bautista', createdAt: dAgo(47) },
    { id: 'mv_007', lotId: 'lot_007', medicineId: 'med_006', genericName: 'Omeprazole', type: 'sale', quantityDelta: -14, referenceId: 'sale_005', actorId: adminId, actorName: 'Maria Reyes', createdAt: dAgo(6) },
    // Adjustment
    { id: 'mv_008', lotId: 'lot_015', medicineId: 'med_006', genericName: 'Omeprazole', type: 'adjustment', quantityDelta: -5, reason: 'expiry', actorId: adminId, actorName: 'Maria Reyes', createdAt: dAgo(2) },
  ];

  const backups: BackupJob[] = [
    { id: 'bk_001', state: 'completed', requestedBy: adminId, requestedByName: 'Maria Reyes', createdAt: dAgo(7), completedAt: dAgo(7), notes: 'Weekly scheduled backup. Artifact size: 2.1 MB.' },
    { id: 'bk_002', state: 'completed', requestedBy: adminId, requestedByName: 'Maria Reyes', createdAt: dAgo(1), completedAt: dAgo(1), notes: 'Manual backup before system update. Artifact size: 2.3 MB.' },
  ];

  return {
    medicines: meds,
    lots,
    movements,
    sales,
    users,
    passwords,
    backups,
    receipts,
    idempotencyKeys: {},
    config: { lowStockThreshold: 30, timezone: 'Asia/Manila' },
    version: 1,
  };
}
