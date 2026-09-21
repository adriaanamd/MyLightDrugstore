<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Presentation;

use App\Modules\Reporting\Application\SalesReportFilters;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use LogicException;

final class SalesReportRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    /** @return array<int, \Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $supported = ['from', 'to'];

            foreach (array_diff(array_keys($this->query->all()), $supported) as $field) {
                $validator->errors()->add((string) $field, 'This filter is not supported.');
            }
        }];
    }

    public function filters(): SalesReportFilters
    {
        return new SalesReportFilters(
            $this->parseDate($this->validated('from')),
            $this->parseDate($this->validated('to')),
        );
    }

    private function parseDate(mixed $value): ?DateTimeImmutable
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            throw new LogicException('A validated sales report date is invalid.');
        }

        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('UTC'));

        if ($date === false) {
            throw new LogicException('A validated sales report date is invalid.');
        }

        return $date;
    }
}
