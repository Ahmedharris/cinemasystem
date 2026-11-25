<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Module 1 (users & security). Needs the seeded demo accounts (php artisan db:seed).
 * DatabaseTransactions rolls back everything a test writes.
 */
class UserModuleTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    private function login(string $email = 'admin@qissa.pk', string $password = 'demo1234'): array
    {
        $res = $this->postJson('/api/auth/login', compact('email', 'password'));
        $res->assertOk();

        return [$res->json('token'), $res->json('user')];
    }

    private function as(string $token): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_login_returns_token_and_profile_without_secrets(): void
    {
        [$token, $user] = $this->login('manager.lahore@qissa.pk');
        $this->assertNotEmpty($token);
        $this->assertSame('MANAGER', $user['role']);
        $this->assertSame(1, $user['cinema_id']);
        $this->assertArrayNotHasKey('password_hash', $user);
        $this->assertArrayNotHasKey('reset_token_hash', $user);
        // staff sign-ins are audited
        $this->assertSame(1, DB::selectOne("SELECT COUNT(*) n FROM audit_log WHERE action = 'LOGIN' AND user_id = 7")->n);
    }

    public function test_wrong_password_unknown_email_and_suspended_account_are_rejected(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'admin@qissa.pk', 'password' => 'nope'])->assertStatus(401);
        $this->postJson('/api/auth/login', ['email' => 'ghost@example.com', 'password' => 'demo1234'])->assertStatus(401);
        $this->postJson('/api/auth/login', ['email' => 'zainab.iqbal@example.com', 'password' => 'demo1234'])
            ->assertStatus(403)->assertJsonPath('message', 'This account is suspended. Please contact support.');
    }

    public function test_register_creates_a_customer_and_blocks_duplicate_emails(): void
    {
        $body = ['full_name' => 'Test Person', 'email' => 'test.person@example.com', 'phone' => '0300-1234567', 'password' => 'secret1'];
        $res = $this->postJson('/api/auth/register', $body)->assertCreated();
        $this->assertSame('CUSTOMER', $res->json('user.role'));
        $row = DB::selectOne('SELECT password_hash FROM user_account WHERE email = ?', ['test.person@example.com']);
        $this->assertStringStartsWith('$2y$', $row->password_hash); // bcrypt, never plain text

        $this->postJson('/api/auth/register', $body)->assertStatus(422)->assertJsonPath('errors.email.0', 'An account with this email already exists.');
        $this->postJson('/api/auth/register', ['full_name' => 'X', 'email' => 'bad', 'password' => '123'])->assertStatus(422);
    }

    public function test_protected_routes_need_a_valid_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
        $this->as('garbage.token')->getJson('/api/auth/me')->assertStatus(401);
        [$token] = $this->login('ali.raza@example.com');
        $this->as($token)->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.email', 'ali.raza@example.com');
        // a tampered token fails the signature check
        $this->as(substr($token, 0, -3).'abc')->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_profile_update_and_password_change_invalidates_the_old_token(): void
    {
        [$token] = $this->login('ali.raza@example.com');
        $this->as($token)->putJson('/api/auth/profile', ['full_name' => 'Ali R. Raza', 'phone' => ''])
            ->assertOk()->assertJsonPath('user.full_name', 'Ali R. Raza')->assertJsonPath('user.phone', null);

        $this->as($token)->putJson('/api/auth/password', ['current_password' => 'wrong', 'new_password' => 'newpass1'])
            ->assertStatus(422)->assertJsonPath('errors.current_password.0', 'Your current password is incorrect.');

        $res = $this->as($token)->putJson('/api/auth/password', ['current_password' => 'demo1234', 'new_password' => 'newpass1'])->assertOk();
        $this->as($token)->getJson('/api/auth/me')->assertStatus(401);            // old token is dead
        $this->as($res->json('token'))->getJson('/api/auth/me')->assertOk();      // the fresh one works
        $this->postJson('/api/auth/login', ['email' => 'ali.raza@example.com', 'password' => 'newpass1'])->assertOk();
    }

    public function test_forgot_and_reset_password_flow_uses_a_single_use_token(): void
    {
        $res = $this->postJson('/api/auth/forgot-password', ['email' => 'sara.khan@example.com'])->assertOk();
        $link = $res->json('reset_link'); // only returned while APP_DEBUG=true
        $this->assertNotEmpty($link);
        parse_str(parse_url(str_replace('#/', '', $link), PHP_URL_QUERY), $q);

        $stored = DB::selectOne('SELECT reset_token_hash FROM user_account WHERE user_id = 2')->reset_token_hash;
        $this->assertSame(hash('sha256', $q['token']), $stored);
        $this->assertNotSame($q['token'], $stored);

        $this->postJson('/api/auth/reset-password', ['email' => $q['email'], 'token' => 'wrong', 'password' => 'brandnew1'])->assertStatus(422);
        $this->postJson('/api/auth/reset-password', ['email' => $q['email'], 'token' => $q['token'], 'password' => 'brandnew1'])->assertOk();
        $this->postJson('/api/auth/login', ['email' => 'sara.khan@example.com', 'password' => 'brandnew1'])->assertOk();
        // second use of the same link fails
        $this->postJson('/api/auth/reset-password', ['email' => $q['email'], 'token' => $q['token'], 'password' => 'another11'])->assertStatus(422);

        // unknown e-mail gets the same generic answer and no link
        $this->postJson('/api/auth/forgot-password', ['email' => 'ghost@example.com'])->assertOk()->assertJsonMissing(['reset_link' => true]);
    }

    public function test_only_administrators_can_manage_users(): void
    {
        [$customer] = $this->login('ali.raza@example.com');
        [$manager] = $this->login('manager.lahore@qissa.pk');
        $this->as($customer)->getJson('/api/users')->assertStatus(403);
        $this->as($manager)->getJson('/api/users')->assertStatus(403);
        $this->as($manager)->getJson('/api/audit-logs')->assertStatus(403);
        $this->flushHeaders(); // headers set with as() stay on the test client
        $this->getJson('/api/users')->assertStatus(401);
    }

    public function test_admin_user_crud_with_branch_rules_and_audit_trail(): void
    {
        [$admin, $me] = $this->login();

        $list = $this->as($admin)->getJson('/api/users')->assertOk();
        $this->assertGreaterThanOrEqual(10, count($list->json('users')));
        $this->assertSame('QISSA Gulberg', collect($list->json('users'))->firstWhere('user_id', 7)['cinema_name']);

        // branch staff must have a cinema
        $new = ['full_name' => 'Fatima Noor', 'email' => 'fatima.noor@qissa.pk', 'role' => 'BOX_OFFICE', 'password' => 'staff123', 'account_status' => 'ACTIVE'];
        $this->as($admin)->postJson('/api/users', $new)->assertStatus(422)->assertJsonValidationErrors(['cinema_id']);
        $created = $this->as($admin)->postJson('/api/users', $new + ['cinema_id' => 3])->assertCreated();
        $id = $created->json('user.user_id');
        $this->assertSame(3, $created->json('user.cinema_id'));
        $this->postJson('/api/auth/login', ['email' => 'fatima.noor@qissa.pk', 'password' => 'staff123'])->assertOk();

        // duplicate e-mail
        $this->as($admin)->postJson('/api/users', $new + ['cinema_id' => 3])->assertStatus(422);

        // changing the role to ADMIN drops the branch; suspension blocks sign-in and live sessions
        [$staffToken] = $this->login('fatima.noor@qissa.pk', 'staff123');
        $upd = $this->as($admin)->putJson("/api/users/$id", ['full_name' => 'Fatima Noor', 'email' => 'fatima.noor@qissa.pk', 'phone' => '', 'role' => 'ADMIN', 'cinema_id' => 3, 'account_status' => 'SUSPENDED'])->assertOk();
        $this->assertNull($upd->json('user.cinema_id'));
        $this->as($staffToken)->getJson('/api/auth/me')->assertStatus(401);
        $this->postJson('/api/auth/login', ['email' => 'fatima.noor@qissa.pk', 'password' => 'staff123'])->assertStatus(403);

        // an admin cannot demote or suspend themselves, or delete their own account
        $this->as($admin)->putJson('/api/users/'.$me['user_id'], ['full_name' => 'System Admin', 'email' => 'admin@qissa.pk', 'role' => 'MANAGER', 'cinema_id' => 1, 'account_status' => 'ACTIVE'])->assertStatus(422);
        $this->as($admin)->deleteJson('/api/users/'.$me['user_id'])->assertStatus(422);

        // temporary password
        $tmp = $this->as($admin)->postJson("/api/users/$id/reset-password")->assertOk()->json('temporary_password');
        $this->assertSame(10, strlen($tmp));

        $this->as($admin)->deleteJson("/api/users/$id")->assertOk();
        $this->as($admin)->deleteJson("/api/users/$id")->assertStatus(404);

        // the trail contains CREATE, UPDATE, PASSWORD_RESET and DELETE for this user
        $actions = collect($this->as($admin)->getJson('/api/audit-logs')->assertOk()->json('logs'))
            ->where('entity_id', (string) $id)->pluck('action')->all();
        foreach (['CREATE', 'UPDATE', 'PASSWORD_RESET', 'DELETE'] as $a) {
            $this->assertContains($a, $actions);
        }
    }
}
