<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Writes one row to the audit_log table (who did what, with old/new values). */
trait LogsAudit
{
    protected function audit(Request $request, ?int $userId, string $action, string $entity, int|string|null $entityId, ?array $old = null, ?array $new = null): void
    {
        DB::insert(
            'INSERT INTO audit_log (user_id, action, entity_name, entity_id, old_value, new_value, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $userId,
                $action,
                $entity,
                $entityId !== null ? (string) $entityId : null,
                $old !== null ? json_encode($old) : null,
                $new !== null ? json_encode($new) : null,
                $request->ip(),
            ]
        );
    }
}
