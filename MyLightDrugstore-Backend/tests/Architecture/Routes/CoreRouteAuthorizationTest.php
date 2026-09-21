<?php

declare(strict_types=1);

namespace Tests\Architecture\Routes;

use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

final class CoreRouteAuthorizationTest extends TestCase
{
    public function test_staff_account_routes_are_authenticated_and_admin_only(): void
    {
        $routes = $this->routesStartingWith('api/v1/users');

        $this->assertCount(4, $routes);

        foreach ($routes as $route) {
            $this->assertContains('auth:web', $route->middleware(), $route->uri());
            $this->assertContains(
                'App\\Modules\\Identity\\Presentation\\RequireAdmin',
                $route->middleware(),
                $route->uri(),
            );
            $this->assertStringNotContainsString('PendingApiEndpointController', $route->getActionName());
        }
    }

    public function test_backup_permissions_match_the_contract(): void
    {
        $routes = $this->routesStartingWith('api/v1/backups');

        $this->assertCount(3, $routes);

        foreach ($routes as $route) {
            $this->assertContains('auth:web', $route->middleware(), $route->uri());
            $this->assertStringNotContainsString('PendingApiEndpointController', $route->getActionName());

            if ($route->methods() === ['POST']) {
                $this->assertNotContains(
                    'App\\Modules\\Identity\\Presentation\\RequireAdmin',
                    $route->middleware(),
                );

                continue;
            }

            $this->assertContains(
                'App\\Modules\\Identity\\Presentation\\RequireAdmin',
                $route->middleware(),
            );
        }
    }

    public function test_report_routes_are_authenticated_and_implemented(): void
    {
        $routes = $this->routesStartingWith('api/v1/reports');

        $this->assertCount(2, $routes);

        foreach ($routes as $route) {
            $this->assertContains('auth:web', $route->middleware(), $route->uri());
            $this->assertStringNotContainsString('PendingApiEndpointController', $route->getActionName());
        }
    }

    public function test_system_time_route_requires_an_authenticated_session(): void
    {
        $route = RouteFacade::getRoutes()->getByName('api.v1.system.time');

        $this->assertNotNull($route);
        $this->assertContains('auth:web', $route->middleware());
    }

    public function test_every_non_public_v1_route_requires_an_authenticated_session(): void
    {
        $publicRoutes = [
            'api/v1/transport/public-key',
            'api/v1/auth/csrf',
            'api/v1/auth/login',
        ];

        foreach (RouteFacade::getRoutes()->getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/') || in_array($route->uri(), $publicRoutes, true)) {
                continue;
            }

            $this->assertContains('auth:web', $route->middleware(), $route->uri());
        }
    }

    /** @return list<Route> */
    private function routesStartingWith(string $prefix): array
    {
        return array_values(array_filter(
            RouteFacade::getRoutes()->getRoutes(),
            static fn (Route $route): bool => str_starts_with($route->uri(), $prefix),
        ));
    }
}
