<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Operations;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Operations\Application\AuditEvent as AuditEventData;
use App\Modules\Operations\Application\AuditEventRecorder;
use App\Modules\Operations\Infrastructure\Persistence\AuditEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

final class AuditEventPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_actor_subject_and_metadata(): void
    {
        $actor = User::factory()->create();

        app(AuditEventRecorder::class)->record(new AuditEventData(
            $actor->getKey(),
            'backup.requested',
            'backup',
            '42',
            ['queue' => 'sync', 'encrypted' => true],
        ));

        $event = AuditEvent::query()->firstOrFail();
        $this->assertSame($actor->getKey(), $event->actor_user_id);
        $this->assertSame('backup.requested', $event->event);
        $this->assertSame('backup', $event->subject_type);
        $this->assertSame('42', $event->subject_id);
        $this->assertSame(['queue' => 'sync', 'encrypted' => true], $event->metadata);
        $this->assertNotNull($event->occurred_at);
    }

    public function test_existing_audit_events_cannot_be_updated_or_deleted(): void
    {
        $event = AuditEvent::factory()->create();

        $this->expectException(LogicException::class);
        $event->event = 'tampered';
        $event->save();

        $event->delete();
    }
}
