<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Presentation;

use App\Modules\Inventory\Application\InventorySummaryFilters;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use LogicException;

final class InventoryReportRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'lowStock' => ['sometimes', Rule::in([true, false, 1, 0, '1', '0', 'true', 'false'])],
            'expiresBefore' => ['sometimes', 'date_format:Y-m-d'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    /** @return array<int, \Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (array_diff(array_keys($this->query->all()), ['lowStock', 'expiresBefore', 'page', 'perPage']) as $field) {
                $validator->errors()->add((string) $field, 'This filter is not supported.');
            }
        }];
    }

    public function filters(): InventorySummaryFilters
    {
        $expiresBefore = $this->validated('expiresBefore');
        $expiryDate = null;

        if ($expiresBefore !== null) {
            if (! is_string($expiresBefore)) {
                throw new LogicException('The validated inventory report expiry filter is invalid.');
            }

            $expiryDate = DateTimeImmutable::createFromFormat('!Y-m-d', $expiresBefore, new DateTimeZone('UTC'));

            if ($expiryDate === false) {
                throw new LogicException('The validated inventory report expiry filter is invalid.');
            }
        }

        return new InventorySummaryFilters(
            $this->booleanFilter($this->validated('lowStock')),
            $expiryDate,
            $this->positiveInteger($this->validated('page'), 1),
            $this->positiveInteger($this->validated('perPage'), 25),
        );
    }

    private function booleanFilter(mixed $value): ?bool
    {
        return match ($value) {
            true, 1, '1', 'true' => true,
            false, 0, '0', 'false' => false,
            null => null,
            default => throw new LogicException('The validated inventory report stock filter is invalid.'),
        };
    }

    private function positiveInteger(mixed $value, int $default): int
    {
        if ($value === null) {
            return $default;
        }

        if (is_int($value) && $value > 0) {
            return $value;
        }

        if (is_string($value) && ctype_digit($value) && (int) $value > 0) {
            return (int) $value;
        }

        throw new LogicException('The validated inventory report pagination value is invalid.');
    }
}
