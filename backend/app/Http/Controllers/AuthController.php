<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\LogsAudit;
use App\Support\ApiToken;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Module 1 - Users & Security: sign in / sign up / profile / password.
 * Tables used: user_account, audit_log.
 * Every query is written out in full below (no ORM).
 */
class AuthController extends Controller
{
    use LogsAudit;

    private const PHONE_RULE = ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s]{7,15}$/'];

    /* ------------------------------------------------------------------ POST /api/auth/login */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Look the account up by e-mail (the column is UNIQUE; the collation is case-insensitive).
        $user = DB::selectOne(
            'SELECT user_id, password_hash, account_status
               FROM user_account
              WHERE email = ?',
            [trim($data['email'])]
        );

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Incorrect email or password.'], 401);
        }
        if ($user->account_status !== 'ACTIVE') {
            return response()->json(['message' => 'This account is suspended. Please contact support.'], 403);
        }

        // Remember when the user last signed in.
        DB::update('UPDATE user_account SET last_login_at = NOW() WHERE user_id = ?', [$user->user_id]);

        $profile = $this->findProfile($user->user_id);
        if ($profile->role !== 'CUSTOMER') {
            $this->audit($request, $profile->user_id, 'LOGIN', 'user_account', $profile->user_id);
        }

        return response()->json([
            'token' => ApiToken::issue($user->user_id, $user->password_hash),
            'user' => $profile,
        ]);
    }

    /* --------------------------------------------------------------- POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => self::PHONE_RULE,
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ]);
        $email = trim($data['email']);

        $taken = DB::selectOne('SELECT user_id FROM user_account WHERE email = ?', [$email]);
        if ($taken) {
            return $this->emailTaken();
        }

        $hash = Hash::make($data['password']);
        try {
            // Public sign-up always creates a CUSTOMER with no branch.
            DB::insert(
                "INSERT INTO user_account (role, cinema_id, full_name, email, phone, password_hash, account_status, last_login_at)
                 VALUES ('CUSTOMER', NULL, ?, ?, ?, ?, 'ACTIVE', NOW())",
                [trim($data['full_name']), $email, $data['phone'] ?? null, $hash]
            );
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') { // two people registering the same e-mail at once
                return $this->emailTaken();
            }
            throw $e;
        }
        $userId = (int) DB::getPdo()->lastInsertId();

        return response()->json([
            'token' => ApiToken::issue($userId, $hash),
            'user' => $this->findProfile($userId),
        ], 201);
    }

    /* ------------------------------------------------------------------- GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->findProfile($request->attributes->get('auth_user')->user_id)]);
    }

    /* --------------------------------------------------------------- POST /api/auth/logout */
    public function logout(): JsonResponse
    {
        // Tokens are stateless: the browser simply forgets the token.
        return response()->json(['message' => 'Signed out.']);
    }

    /* ---------------------------------------------------------------- PUT /api/auth/profile */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:3', 'max:120'],
            'phone' => self::PHONE_RULE,
        ]);
        $me = $request->attributes->get('auth_user');

        DB::update(
            'UPDATE user_account SET full_name = ?, phone = ? WHERE user_id = ?',
            [trim($data['full_name']), ($data['phone'] ?? null) ?: null, $me->user_id]
        );

        return response()->json(['user' => $this->findProfile($me->user_id)]);
    }

    /* ---------------------------------------------------------------- PUT /api/auth/password */
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'max:72'],
        ]);
        $me = $request->attributes->get('auth_user');

        $row = DB::selectOne('SELECT password_hash FROM user_account WHERE user_id = ?', [$me->user_id]);
        if (! Hash::check($data['current_password'], $row->password_hash)) {
            return $this->fieldError('current_password', 'Your current password is incorrect.');
        }

        $hash = Hash::make($data['new_password']);
        DB::update('UPDATE user_account SET password_hash = ? WHERE user_id = ?', [$hash, $me->user_id]);
        $this->audit($request, $me->user_id, 'PASSWORD_CHANGE', 'user_account', $me->user_id);

        // The old token is now invalid (it carries the old password fingerprint) -> hand out a fresh one.
        return response()->json([
            'token' => ApiToken::issue($me->user_id, $hash),
            'user' => $this->findProfile($me->user_id),
        ]);
    }

    /* ------------------------------------------------------- POST /api/auth/forgot-password */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        $user = DB::selectOne(
            "SELECT user_id, full_name, email FROM user_account WHERE email = ? AND account_status = 'ACTIVE'",
            [trim($data['email'])]
        );

        $response = ['message' => 'If an account exists for this e-mail, a reset link is on its way.'];
        if (! $user) {
            return response()->json($response); // same answer either way, so nobody can probe for accounts
        }

        // Only the SHA-256 of the token is stored; the token itself exists only in the e-mail.
        $token = bin2hex(random_bytes(32));
        DB::update(
            'UPDATE user_account
                SET reset_token_hash = ?, reset_token_expires_at = DATE_ADD(NOW(), INTERVAL 60 MINUTE)
              WHERE user_id = ?',
            [hash('sha256', $token), $user->user_id]
        );

        $link = rtrim(config('app.frontend_url'), '/').'/#/reset-password?'.http_build_query(['email' => $user->email, 'token' => $token]);
        try {
            Mail::raw(
                "Hello {$user->full_name},\n\nUse this link to choose a new QISSA password (valid for 60 minutes):\n{$link}\n\nIf you did not ask for this, ignore this e-mail.",
                fn ($mail) => $mail->to($user->email)->subject('Reset your QISSA password')
            );
        } catch (\Throwable $e) {
            Log::warning('Could not send password reset e-mail: '.$e->getMessage());
        }

        // Development convenience: without a mail server, show the link to the tester.
        if (config('app.debug')) {
            $response['reset_link'] = $link;
        }

        return response()->json($response);
    }

    /* -------------------------------------------------------- POST /api/auth/reset-password */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ]);

        $user = DB::selectOne(
            'SELECT user_id, reset_token_hash
               FROM user_account
              WHERE email = ?
                AND reset_token_hash IS NOT NULL
                AND reset_token_expires_at > NOW()',
            [trim($data['email'])]
        );
        if (! $user || ! hash_equals($user->reset_token_hash, hash('sha256', $data['token']))) {
            return response()->json(['message' => 'This reset link is invalid or has expired. Please request a new one.'], 422);
        }

        // New password in, token out (a link works only once).
        DB::update(
            'UPDATE user_account
                SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL
              WHERE user_id = ?',
            [Hash::make($data['password']), $user->user_id]
        );
        $this->audit($request, $user->user_id, 'PASSWORD_RESET', 'user_account', $user->user_id);

        return response()->json(['message' => 'Your password has been changed. You can sign in now.']);
    }

    /* ------------------------------------------------------------------------- helpers */

    /** The columns the front end may see (never password_hash or the reset token). */
    private function findProfile(int $userId): ?object
    {
        return DB::selectOne(
            'SELECT user_id, role, cinema_id, full_name, email, phone, account_status, created_at, last_login_at
               FROM user_account
              WHERE user_id = ?',
            [$userId]
        );
    }

    private function emailTaken(): JsonResponse
    {
        return $this->fieldError('email', 'An account with this email already exists.');
    }

    private function fieldError(string $field, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'errors' => [$field => [$message]]], 422);
    }
}
