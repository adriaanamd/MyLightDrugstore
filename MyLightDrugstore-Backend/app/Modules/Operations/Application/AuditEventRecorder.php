<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface AuditEventRecorder
{
    public function record(AuditEvent $event): void;
}
