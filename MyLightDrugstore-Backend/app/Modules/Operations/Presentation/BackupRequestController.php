<?php

declare(strict_types=1);

namespace App\Modules\Operations\Presentation;

use App\Modules\Operations\Application\RequestBackupAction;
use App\Modules\Operations\Application\RequestBackupCommand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LogicException;

final class BackupRequestController
{
    public function __invoke(Request $request, RequestBackupAction $requestBackup): JsonResponse
    {
        $actorId = $request->user('web')?->getAuthIdentifier();

        if (! is_int($actorId) && ! (is_string($actorId) && ctype_digit($actorId))) {
            throw new LogicException('The authenticated backup actor is invalid.');
        }

        $job = $requestBackup->execute(new RequestBackupCommand((int) $actorId));

        return response()->json(['data' => (new BackupResource($job))->toArray()], 202);
    }
}
