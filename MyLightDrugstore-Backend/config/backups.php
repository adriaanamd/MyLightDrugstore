<?php

return [
    'disk' => env('BACKUP_DISK', 'local'),
    'path_prefix' => trim((string) env('BACKUP_PATH_PREFIX', 'backups'), '/'),
    'tables' => [
        'users',
        'medicines',
        'inventory_receipts',
        'inventory_lots',
        'inventory_movements',
        'inventory_adjustments',
        'sales',
        'sale_items',
        'sales_idempotency_keys',
        'sale_cancellations',
        'backup_jobs',
        'audit_events',
    ],
];
