<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final readonly class AuditEvent
{
    /** @param array<string, bool|int|string|null> $metadata */
    public function __construct(
        public ?int $actorUserId,
        public string $event,
        public string $subjectType,
        public string $subjectId,
        public array $metadata = [],
    ) {}
}
