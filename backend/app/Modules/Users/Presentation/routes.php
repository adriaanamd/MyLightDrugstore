<?php

declare(strict_types=1);

use App\Modules\Users\Presentation\RequireAdmin;
use App\Modules\Users\Presentation\UserCreateController;
use App\Modules\Users\Presentation\UserDetailController;
use App\Modules\Users\Presentation\UserListController;
use App\Modules\Users\Presentation\UserUpdateController;
use Illuminate\Support\Facades\Route;

Route::get('/users', UserListController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->name('api.v1.users.index');
Route::post('/users', UserCreateController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->name('api.v1.users.store');
Route::get('/users/{userId}', UserDetailController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->whereNumber('userId')
    ->name('api.v1.users.show');
Route::patch('/users/{userId}', UserUpdateController::class)
    ->middleware(['auth:web', RequireAdmin::class])
    ->whereNumber('userId')
    ->name('api.v1.users.update');
