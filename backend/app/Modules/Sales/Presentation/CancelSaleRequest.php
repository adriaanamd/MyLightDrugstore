<?php

declare(strict_types=1);

namespace App\Modules\Sales\Presentation;

use App\Modules\Sales\Application\CancelSaleCommand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use LogicException;

final class CancelSaleRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'regex:/\A[a-z][a-z0-9_]{0,63}\z/'],
        ];
    }

    /** @return array<int, \Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (array_diff(array_keys($this->all()), ['reason']) as $field) {
                $validator->errors()->add((string) $field, 'This field is not supported.');
            }
        }];
    }

    public function toCommand(int $actorUserId, int $saleId): CancelSaleCommand
    {
        $reason = $this->validated('reason');

        if (! is_string($reason)) {
            throw new LogicException('The validated sale cancellation request is invalid.');
        }

        return new CancelSaleCommand($actorUserId, $saleId, $reason);
    }
}
