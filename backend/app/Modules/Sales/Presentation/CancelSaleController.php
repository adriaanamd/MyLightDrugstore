<?php

declare(strict_types=1);

namespace App\Modules\Sales\Presentation;

use App\Modules\Sales\Application\CancelSaleAction;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use LogicException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class CancelSaleController
{
    public function __invoke(
        string $saleId,
        CancelSaleRequest $request,
        CancelSaleAction $cancelSale,
    ): JsonResponse {
        $parsedSaleId = filter_var($saleId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (! is_int($parsedSaleId)) {
            throw new NotFoundHttpException;
        }

        $user = $request->user('web');

        if ($user === null) {
            throw new AuthenticationException;
        }

        $actorUserId = $user->getAuthIdentifier();

        if (is_string($actorUserId) && ctype_digit($actorUserId)) {
            $actorUserId = (int) $actorUserId;
        }

        if (! is_int($actorUserId)) {
            throw new LogicException('The authenticated user identifier is invalid.');
        }

        $sale = $cancelSale->execute($request->toCommand($actorUserId, $parsedSaleId));

        return response()->json([
            'data' => $sale->toArray(),
        ]);
    }
}
