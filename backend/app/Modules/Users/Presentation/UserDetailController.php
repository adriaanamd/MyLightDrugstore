<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Users\Application\GetUserAction;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserDetailController
{
    public function __invoke(string $userId, GetUserAction $getUser): JsonResponse
    {
        $parsedUserId = filter_var($userId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (! is_int($parsedUserId)) {
            throw new NotFoundHttpException;
        }

        $user = $getUser->execute($parsedUserId);

        if ($user === null) {
            throw new NotFoundHttpException;
        }

        return response()->json(['data' => (new UserAccountResource($user))->toArray()]);
    }
}
