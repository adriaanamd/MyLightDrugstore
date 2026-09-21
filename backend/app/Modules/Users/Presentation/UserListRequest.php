<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Users\Application\UserListFilters;
use Illuminate\Foundation\Http\FormRequest;
use LogicException;

final class UserListRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'active' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function filters(): UserListFilters
    {
        $active = $this->validated('active');

        return new UserListFilters(
            $this->booleanFilter($active),
            $this->positiveInteger($this->validated('page'), 1),
            $this->positiveInteger($this->validated('perPage'), 25),
        );
    }

    private function booleanFilter(mixed $value): ?bool
    {
        return match ($value) {
            true, 1, '1', 'true' => true,
            false, 0, '0', 'false' => false,
            null => null,
            default => throw new LogicException('The validated active filter is invalid.'),
        };
    }

    private function positiveInteger(mixed $value, int $default): int
    {
        if ($value === null) {
            return $default;
        }

        if (is_int($value) && $value > 0) {
            return $value;
        }

        if (is_string($value) && ctype_digit($value) && (int) $value > 0) {
            return (int) $value;
        }

        throw new LogicException('The validated pagination value is invalid.');
    }
}
