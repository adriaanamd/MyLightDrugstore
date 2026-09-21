<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Users\Application\UserAccountItem;

final readonly class UserAccountResource
{
    public function __construct(private UserAccountItem $item) {}

    /** @return array<string, bool|int|string> */
    public function toArray(): array
    {
        return [
            'id' => $this->item->id,
            'username' => $this->item->username,
            'fullName' => $this->item->fullName,
            'role' => $this->item->role,
            'active' => $this->item->active,
            'createdAt' => $this->item->createdAt,
            'updatedAt' => $this->item->updatedAt,
        ];
    }
}
