<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Application\BackupJobDetails;
use App\Modules\Operations\Domain\BackupStatus;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use LogicException;

final class EloquentBackupJobMapper
{
    public function map(BackupJob $job): BackupJobDetails
    {
        $id = $job->getKey();
        $requestedAt = $job->getAttribute('requested_at');
        $completedAt = $job->getAttribute('completed_at');
        $size = $job->getAttribute('artifact_size');
        $status = $job->getAttribute('status');

        if (
            ! is_int($id)
            || ! $requestedAt instanceof DateTimeInterface
            || ! ($completedAt === null || $completedAt instanceof DateTimeInterface)
            || ! ($size === null || is_int($size))
            || ! $status instanceof BackupStatus
        ) {
            throw new LogicException('The backup job record is invalid.');
        }

        return new BackupJobDetails(
            $id,
            $status,
            $this->timestamp($requestedAt),
            $completedAt === null ? null : $this->timestamp($completedAt),
            $size,
        );
    }

    private function timestamp(DateTimeInterface $value): string
    {
        return DateTimeImmutable::createFromInterface($value)
            ->setTimezone(new DateTimeZone('UTC'))
            ->format('Y-m-d\TH:i:s\Z');
    }
}
