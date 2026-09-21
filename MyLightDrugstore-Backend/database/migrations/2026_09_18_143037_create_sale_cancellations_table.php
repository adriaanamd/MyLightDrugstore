<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_cancellations', static function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sale_id')->unique()->constrained('sales')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('reason', 64);
            $table->dateTime('cancelled_at');

            $table->index(['actor_user_id', 'cancelled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_cancellations');
    }
};
