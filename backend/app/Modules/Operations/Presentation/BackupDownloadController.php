<?php

declare(strict_types=1);

namespace App\Modules\Operations\Presentation;

use App\Modules\Operations\Application\DownloadBackupAction;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class BackupDownloadController
{
    public function __invoke(string $backupId, DownloadBackupAction $downloadBackup): Response
    {
        $parsedId = filter_var($backupId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (! is_int($parsedId)) {
            abort(404);
        }

        $download = $downloadBackup->execute($parsedId);

        return response($download->contents, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $download->filename,
            ),
        ]);
    }
}
