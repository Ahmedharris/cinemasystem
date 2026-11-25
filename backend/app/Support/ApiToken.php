<?php

namespace App\Support;

/**
 * Stateless, signed API token:  base64url(payload) . base64url(HMAC-SHA256(payload, APP_KEY))
 *
 * payload = { uid: user_id, exp: unix expiry, pv: fingerprint of the user's password hash }
 *
 * - No session table is needed (the ERD stays at 20 entities).
 * - Changing the password changes the fingerprint, so every older token stops working.
 * - Suspending an account is enforced on every request by the AuthenticateToken middleware.
 */
class ApiToken
{
    public const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

    public static function fingerprint(string $passwordHash): string
    {
        return substr(hash('sha256', $passwordHash), 0, 16);
    }

    public static function issue(int $userId, string $passwordHash): string
    {
        $payload = self::encode(json_encode([
            'uid' => $userId,
            'exp' => time() + self::TTL_SECONDS,
            'pv' => self::fingerprint($passwordHash),
        ]));

        return $payload.'.'.self::sign($payload);
    }

    /** @return array{uid:int,exp:int,pv:string}|null  null when the token is malformed, forged or expired */
    public static function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }
        [$payload, $signature] = $parts;
        if (! hash_equals(self::sign($payload), $signature)) {
            return null;
        }
        $claims = json_decode((string) base64_decode(strtr($payload, '-_', '+/')), true);
        if (! is_array($claims) || ! isset($claims['uid'], $claims['exp'], $claims['pv']) || $claims['exp'] < time()) {
            return null;
        }

        return $claims;
    }

    private static function sign(string $payload): string
    {
        return self::encode(hash_hmac('sha256', $payload, self::key(), true));
    }

    private static function encode(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function key(): string
    {
        $key = (string) config('app.key');

        return str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7)) : $key;
    }
}
