<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Users\Application\CreateUserCommand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use LogicException;

final class CreateUserRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:3', 'max:64', 'regex:/\A[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}\z/D'],
            'fullName' => ['required', 'string', 'min:1', 'max:160'],
            'password' => ['required', 'string', 'min:12', 'max:255'],
            'role' => ['required', new Enum(StaffRole::class)],
        ];
    }

    public function toCommand(): CreateUserCommand
    {
        $username = $this->validated('username');
        $fullName = $this->validated('fullName');
        $password = $this->validated('password');
        $role = $this->validated('role');

        if (! is_string($username) || ! is_string($fullName) || ! is_string($password) || ! is_string($role)) {
            throw new LogicException('The validated user creation payload is invalid.');
        }

        return new CreateUserCommand(
            $username,
            $fullName,
            $password,
            StaffRole::from($role),
        );
    }
}
