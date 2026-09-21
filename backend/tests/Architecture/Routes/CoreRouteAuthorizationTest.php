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
                'App\\Modules\\Users\\Presentation\\RequireAdmin',
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
                    'App\\Modules\\Users\\Presentation\\RequireAdmin',
                    $route->middleware(),
                );

                continue;
            }

            $this->assertContains(
                'App\\Modules\\Users\\Presentation\\RequireAdmin',
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

    /** @return list<Route> */
    private function routesStartingWith(string $prefix): array
    {
        return array_values(array_filter(
            RouteFacade::getRoutes()->getRoutes(),
            static fn (Route $route): bool => str_starts_with($route->uri(), $prefix),
        ));
    }
}
