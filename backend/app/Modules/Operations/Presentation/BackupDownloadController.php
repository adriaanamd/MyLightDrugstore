<?php

declare(strict_types=1);

namespace App\Modules\Operations\Presentation;

use App\Modules\Operations\Application\DownloadBackupAction;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use LogicException;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class BackupDownloadController
{
    public function __invoke(Request $request, string $backupId, DownloadBackupAction $downloadBackup): Response
    {
        $parsedId = filter_var($backupId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (! is_int($parsedId)) {
            abort(404);
        }

        $actorId = $request->user('web')?->getAuthIdentifier();

        if (! is_int($actorId) && ! (is_string($actorId) && ctype_digit($actorId))) {
            throw new LogicException('The authenticated backup actor is invalid.');
        }

        $download = $downloadBackup->execute($parsedId, (int) $actorId);

        return response($download->contents, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $download->filename,
            ),
        ]);
    }
}
