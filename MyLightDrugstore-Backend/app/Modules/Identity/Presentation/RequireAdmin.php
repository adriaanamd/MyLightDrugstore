<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation;

use App\Modules\Identity\Application\GetAuthenticatedUserAction;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireAdmin
{
    public function __construct(private readonly GetAuthenticatedUserAction $getAuthenticatedUser) {}

    public function handle(Request $request, Closure $next): Response
    {
        $profile = $this->getAuthenticatedUser->execute();

        if ($profile === null || $profile->role !== 'admin') {
            throw new AuthorizationException('Admin access only.');
        }

        return $next($request);
    }
}
