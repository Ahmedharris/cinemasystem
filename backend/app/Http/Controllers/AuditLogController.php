<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Module 1 - Users & Security: read-only audit trail for administrators. Table: audit_log (+ user_account for names). */
class AuditLogController extends Controller
{
    /* ---------------------------------------------------------------- GET /api/audit-logs */
    public function index(): JsonResponse
    {
        $logs = DB::select(
            'SELECT a.audit_id, a.user_id, u.full_name AS user_name, a.action, a.entity_name, a.entity_id,
                    a.old_value, a.new_value, a.ip_address, a.created_at
               FROM audit_log a
               LEFT JOIN user_account u ON u.user_id = a.user_id
              ORDER BY a.created_at DESC, a.audit_id DESC
              LIMIT 1000'
        );

        return response()->json(['logs' => $logs]);
    }
}
