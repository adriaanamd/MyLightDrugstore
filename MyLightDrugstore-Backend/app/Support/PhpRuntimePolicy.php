<?php

declare(strict_types=1);

namespace App\Support;

use InvalidArgumentException;

final class PhpRuntimePolicy
{
    /**
     * @var array<string, string>
     */
    private const MINIMUM_PATCHED_VERSIONS = [
        '8.3' => '8.3.36',
        '8.4' => '8.4.27',
        '8.5' => '8.5.12',
    ];

    public static function assertSupported(string $version): void
    {
        $parts = explode('.', $version);
        $branch = count($parts) >= 2 && ctype_digit($parts[0]) && ctype_digit($parts[1])
            ? $parts[0] . '.' . $parts[1]
            : null;
        $minimumVersion = $branch === null ? null : self::MINIMUM_PATCHED_VERSIONS[$branch] ?? null;

        if ($minimumVersion === null || version_compare($version, $minimumVersion, '<')) {
            throw new InvalidArgumentException(
                'A patched PHP release is required; detected ' . $version . '.',
            );
        }
    }
}
