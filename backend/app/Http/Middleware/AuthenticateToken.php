<?php

namespace App\Http\Middleware;

use App\Support\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protects a route: the request must carry "Authorization: Bearer <token>" for an
 * ACTIVE account. The signed-in user is stored in $request->attributes['auth_user'].
 */
class AuthenticateToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $claims = $token ? ApiToken::verify($token) : null;
        if (! $claims) {
            return $this->deny('Please sign in to continue.');
        }

        // The user is read from the database on every request, so a suspended or
        // deleted account (or a changed password) takes effect immediately.
        $user = DB::selectOne(
            'SELECT user_id, role, cinema_id, full_name, email, phone, password_hash,
                    account_status, created_at, last_login_at
               FROM user_account
              WHERE user_id = ?',
            [$claims['uid']]
        );
        if (! $user || ! hash_equals(ApiToken::fingerprint($user->password_hash), $claims['pv'])) {
            return $this->deny('Your session has expired. Please sign in again.');
        }
        if ($user->account_status !== 'ACTIVE') {
            return $this->deny('This account is suspended. Please contact support.');
        }

        unset($user->password_hash); // never leaves this middleware
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }

    private function deny(string $message): Response
    {
        return response()->json(['message' => $message], 401);
    }
}
