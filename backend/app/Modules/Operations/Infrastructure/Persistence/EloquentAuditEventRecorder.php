<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Application\AuditEvent as AuditEventData;
use App\Modules\Operations\Application\AuditEventRecorder;

final class EloquentAuditEventRecorder implements AuditEventRecorder
{
    public function record(AuditEventData $event): void
    {
        AuditEvent::query()->create([
            'actor_user_id' => $event->actorUserId,
            'event' => $event->event,
            'subject_type' => $event->subjectType,
            'subject_id' => $event->subjectId,
            'metadata' => $event->metadata,
            'occurred_at' => now('UTC'),
        ]);
    }
}
