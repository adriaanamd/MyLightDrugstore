<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use Tests\TestCase;

final class PendingApiEndpointTest extends TestCase
{
    public function test_unknown_versioned_endpoint_returns_a_correlated_not_found(): void
    {
        $requestId = 'req_unknown-route';
        $path = '/api/v1/this-endpoint-does-not-exist';
        $response = $this->withHeader('X-Request-ID', $requestId)->getJson($path);

        $response->assertNotFound()->assertHeader('X-Request-ID', $requestId);
        $response->assertExactJson([
            'error' => [
                'code' => 'not_found',
                'message' => 'The requested resource was not found.',
                'requestId' => $requestId,
            ],
        ]);
    }
}
