<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\LogsAudit;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Module 1 - Users & Security: user management for administrators (route group: role:ADMIN).
 * Tables used: user_account (+ cinema for the branch, audit_log for the trail).
 */
class UserController extends Controller
{
    use LogsAudit;

    private const ROLES = ['CUSTOMER', 'ADMIN', 'MANAGER', 'BOX_OFFICE'];
    private const BRANCH_ROLES = ['MANAGER', 'BOX_OFFICE']; // staff that belong to one cinema

    /* ------------------------------------------------------------------ GET /api/users */
    public function index(): JsonResponse
    {
        $users = DB::select(
            'SELECT u.user_id, u.role, u.cinema_id, c.cinema_name, u.full_name, u.email, u.phone,
                    u.account_status, u.created_at, u.last_login_at
               FROM user_account u
               LEFT JOIN cinema c ON c.cinema_id = u.cinema_id
              ORDER BY u.created_at DESC, u.user_id DESC'
        );

        return response()->json(['users' => $users]);
    }

    /* ----------------------------------------------------------------- POST /api/users */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(self::ROLES)],
            'cinema_id' => ['nullable', 'integer'],
            'account_status' => ['nullable', Rule::in(['ACTIVE', 'SUSPENDED'])],
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ]);
        $email = trim($data['email']);

        if ($error = $this->checkEmailAndBranch($email, $data['role'], $data['cinema_id'] ?? null, null)) {
            return $error;
        }
        $cinemaId = in_array($data['role'], self::BRANCH_ROLES, true) ? (int) $data['cinema_id'] : null;

        DB::insert(
            'INSERT INTO user_account (role, cinema_id, full_name, email, phone, password_hash, account_status)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $data['role'], $cinemaId, trim($data['full_name']), $email, $data['phone'] ?? null,
                Hash::make($data['password']), $data['account_status'] ?? 'ACTIVE',
            ]
        );
        $id = (int) DB::getPdo()->lastInsertId();
        $created = $this->findUser($id);

        $this->audit($request, $request->attributes->get('auth_user')->user_id, 'CREATE', 'user_account', $id, null, $this->auditView($created));

        return response()->json(['user' => $created], 201);
    }

    /* ------------------------------------------------------------------ PUT /api/users/{id} */
    public function update(Request $request, int $id): JsonResponse
    {
        $me = $request->attributes->get('auth_user');
        $before = $this->findUser($id);
        if (! $before) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(self::ROLES)],
            'cinema_id' => ['nullable', 'integer'],
            'account_status' => ['required', Rule::in(['ACTIVE', 'SUSPENDED'])],
        ]);
        $email = trim($data['email']);

        // An administrator must not lock themselves out.
        if ($id === $me->user_id && ($data['role'] !== $before->role || $data['account_status'] !== 'ACTIVE')) {
            return response()->json(['message' => 'You cannot change your own role or suspend yourself.'], 422);
        }
        if ($error = $this->checkEmailAndBranch($email, $data['role'], $data['cinema_id'] ?? null, $id)) {
            return $error;
        }
        $cinemaId = in_array($data['role'], self::BRANCH_ROLES, true) ? (int) $data['cinema_id'] : null;

        DB::update(
            'UPDATE user_account
                SET full_name = ?, email = ?, phone = ?, role = ?, cinema_id = ?, account_status = ?
              WHERE user_id = ?',
            [trim($data['full_name']), $email, ($data['phone'] ?? null) ?: null, $data['role'], $cinemaId, $data['account_status'], $id]
        );
        $after = $this->findUser($id);

        $this->audit($request, $me->user_id, 'UPDATE', 'user_account', $id, $this->auditView($before), $this->auditView($after));

        return response()->json(['user' => $after]);
    }

    /* --------------------------------------------------------------- DELETE /api/users/{id} */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $me = $request->attributes->get('auth_user');
        $user = $this->findUser($id);
        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }
        if ($id === $me->user_id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        try {
            DB::delete('DELETE FROM user_account WHERE user_id = ?', [$id]);
        } catch (QueryException $e) {
            // Foreign keys (bookings, showtimes, reviews, ...) protect history.
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'This user has bookings or other records and cannot be deleted. Suspend the account instead.'], 409);
            }
            throw $e;
        }
        $this->audit($request, $me->user_id, 'DELETE', 'user_account', $id, $this->auditView($user), null);

        return response()->json(['message' => 'User deleted.']);
    }

    /* ------------------------------------------------- POST /api/users/{id}/reset-password */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = $this->findUser($id);
        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // A random temporary password (shown once to the administrator) and any pending reset link is cancelled.
        $temporary = substr(str_replace(['+', '/', '=', 'l', 'I', 'O', '0'], '', base64_encode(random_bytes(18))), 0, 10);
        DB::update(
            'UPDATE user_account
                SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL
              WHERE user_id = ?',
            [Hash::make($temporary), $id]
        );
        $this->audit($request, $request->attributes->get('auth_user')->user_id, 'PASSWORD_RESET', 'user_account', $id);

        return response()->json(['temporary_password' => $temporary]);
    }

    /* ------------------------------------------------------------------------- helpers */

    private function findUser(int $id): ?object
    {
        return DB::selectOne(
            'SELECT u.user_id, u.role, u.cinema_id, c.cinema_name, u.full_name, u.email, u.phone,
                    u.account_status, u.created_at, u.last_login_at
               FROM user_account u
               LEFT JOIN cinema c ON c.cinema_id = u.cinema_id
              WHERE u.user_id = ?',
            [$id]
        );
    }

    /** E-mail must be unique and branch staff need a real cinema. Returns an error response or null. */
    private function checkEmailAndBranch(string $email, string $role, ?int $cinemaId, ?int $ignoreUserId): ?JsonResponse
    {
        $duplicate = DB::selectOne(
            'SELECT user_id FROM user_account WHERE email = ? AND user_id <> ?',
            [$email, $ignoreUserId ?? 0]
        );
        if ($duplicate) {
            return $this->fieldError('email', 'This email is already registered.');
        }
        if (in_array($role, self::BRANCH_ROLES, true)) {
            $cinema = $cinemaId ? DB::selectOne('SELECT cinema_id FROM cinema WHERE cinema_id = ?', [$cinemaId]) : null;
            if (! $cinema) {
                return $this->fieldError('cinema_id', 'Choose the cinema this staff member works at.');
            }
        }

        return null;
    }

    /** What is written to audit_log (no secrets). */
    private function auditView(object $u): array
    {
        return [
            'full_name' => $u->full_name, 'email' => $u->email, 'phone' => $u->phone, 'role' => $u->role,
            'cinema_id' => $u->cinema_id, 'account_status' => $u->account_status,
        ];
    }

    private function fieldError(string $field, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'errors' => [$field => [$message]]], 422);
    }
}
