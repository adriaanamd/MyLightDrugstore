<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Users\Application\UpdateUserCommand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;
use LogicException;

final class UpdateUserRequest extends FormRequest
{
    private const array EDITABLE_FIELDS = ['fullName', 'role', 'active'];

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'fullName' => ['sometimes', 'required', 'string', 'min:1', 'max:160'],
            'role' => ['sometimes', 'required', new Enum(StaffRole::class)],
            'active' => ['sometimes', 'required', 'boolean'],
        ];
    }

    /** @return array<int, \Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (array_intersect(self::EDITABLE_FIELDS, array_keys($this->all())) === []) {
                $validator->errors()->add('user', 'At least one account field must be provided.');
            }
        }];
    }

    public function toCommand(int $userId): UpdateUserCommand
    {
        $validated = $this->validated();
        $changes = [];

        if (array_key_exists('fullName', $validated)) {
            if (! is_string($validated['fullName'])) {
                throw new LogicException('The validated full name is invalid.');
            }

            $changes['fullName'] = trim($validated['fullName']);
        }

        if (array_key_exists('role', $validated)) {
            if (! is_string($validated['role'])) {
                throw new LogicException('The validated role is invalid.');
            }

            $changes['role'] = StaffRole::from($validated['role']);
        }

        if (array_key_exists('active', $validated)) {
            $changes['active'] = (bool) $validated['active'];
        }

        return new UpdateUserCommand($userId, $changes);
    }
}
