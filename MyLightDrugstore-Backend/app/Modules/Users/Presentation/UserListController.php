<?php

declare(strict_types=1);

namespace App\Modules\Users\Presentation;

use App\Modules\Users\Application\ListUsersAction;
use Illuminate\Http\JsonResponse;

final class UserListController
{
    public function __invoke(UserListRequest $request, ListUsersAction $listUsers): JsonResponse
    {
        $page = $listUsers->execute($request->filters());

        return response()->json([
            'data' => array_map(
                static fn ($item): array => (new UserAccountResource($item))->toArray(),
                $page->items,
            ),
            'meta' => [
                'page' => $page->page,
                'perPage' => $page->perPage,
                'total' => $page->total,
            ],
        ]);
    }
}
