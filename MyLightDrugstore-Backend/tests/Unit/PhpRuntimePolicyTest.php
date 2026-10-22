<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\PhpRuntimePolicy;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class PhpRuntimePolicyTest extends TestCase
{
    public function test_it_accepts_the_first_patched_release_of_every_supported_branch(): void
    {
        foreach (['8.3.36', '8.4.27', '8.5.12'] as $version) {
            PhpRuntimePolicy::assertSupported($version);
        }

        $this->assertTrue(true);
    }

    public function test_it_rejects_vulnerable_and_unknown_php_releases(): void
    {
        foreach (['8.3.35', '8.4.26', '8.5.11', '8.6.0'] as $version) {
            try {
                PhpRuntimePolicy::assertSupported($version);
                self::fail('A vulnerable or unknown PHP runtime was accepted: ' . $version);
            } catch (InvalidArgumentException $exception) {
                self::assertStringContainsString('patched PHP release is required', $exception->getMessage());
            }
        }

        PhpRuntimePolicy::assertSupported('8.3.36');
    }
}
