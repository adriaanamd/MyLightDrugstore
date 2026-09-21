<?php

declare(strict_types=1);

namespace App\Modules\Users\Infrastructure\Persistence;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Users\Application\UserAccountItem;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use LogicException;

final class EloquentUserAccountMapper
{
    public function map(User $user): UserAccountItem
    {
        $id = $user->getKey();
        $createdAt = $user->getAttribute('created_at');
        $updatedAt = $user->getAttribute('updated_at');

        if (
            ! is_int($id)
            || ! $createdAt instanceof DateTimeInterface
            || ! $updatedAt instanceof DateTimeInterface
        ) {
            throw new LogicException('The user account query returned invalid resource data.');
        }

        return new UserAccountItem(
            $id,
            $user->username()->value,
            $user->fullName()->value,
            $user->staffRole()->value,
            $user->isActive(),
            $this->timestamp($createdAt),
            $this->timestamp($updatedAt),
        );
    }

    private function timestamp(DateTimeInterface $value): string
    {
        return DateTimeImmutable::createFromInterface($value)
            ->setTimezone(new DateTimeZone('UTC'))
            ->format('Y-m-d\TH:i:s\Z');
    }
}
