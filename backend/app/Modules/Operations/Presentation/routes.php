<?php

declare(strict_types=1);

use App\Modules\Identity\Presentation\RequireAdmin;
use App\Modules\Operations\Presentation\BackupDownloadController;
use App\Modules\Operations\Presentation\BackupRequestController;
use App\Modules\Operations\Presentation\BackupStatusController;
use App\Modules\Operations\Presentation\ServerTimeController;
use Illuminate\Support\Facades\Route;

Route::post('/backups', BackupRequestController::class)
    ->middleware('auth:web')
    ->name('api.v1.backups.store');
Route::get('/backups/{backupId}', BackupStatusController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->whereNumber('backupId')
    ->name('api.v1.backups.show');
Route::get('/backups/{backupId}/download', BackupDownloadController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->whereNumber('backupId')
    ->name('api.v1.backups.download');
Route::get('/system/time', ServerTimeController::class)
    ->name('api.v1.system.time');
