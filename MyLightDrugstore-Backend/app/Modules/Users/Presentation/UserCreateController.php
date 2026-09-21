<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Users\Application\CreateUserAction;
use Illuminate\Http\JsonResponse;

final class UserCreateController
{
    public function __invoke(CreateUserRequest $request, CreateUserAction $createUser): JsonResponse
    {
        $user = $createUser->execute($request->toCommand());

        return response()->json(['data' => (new UserAccountResource($user))->toArray()], 201);
    }
}
