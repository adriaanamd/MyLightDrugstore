<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\PhpRuntimePolicy;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class PhpRuntimePolicyTest extends TestCase
{
    public function test_it_accepts_the_first_patched_php_85_release(): void
    {
        PhpRuntimePolicy::assertSupported('8.5.12');

        $this->assertTrue(true);
    }

    public function test_it_rejects_vulnerable_php_85_releases(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('PHP 8.5.12+ is required');

        PhpRuntimePolicy::assertSupported('8.5.11');
    }
}
