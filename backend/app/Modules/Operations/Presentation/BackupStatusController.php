<?php

declare(strict_types=1);

namespace App\Modules\Operations\Presentation;

use App\Modules\Operations\Application\GetBackupAction;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class BackupStatusController
{
    public function __invoke(string $backupId, GetBackupAction $getBackup): JsonResponse
    {
        $parsedId = filter_var($backupId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (! is_int($parsedId)) {
            throw new NotFoundHttpException;
        }

        $job = $getBackup->execute($parsedId);

        if ($job === null) {
            throw new NotFoundHttpException;
        }

        return response()->json(['data' => (new BackupResource($job))->toArray()]);
    }
}
