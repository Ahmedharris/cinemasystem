<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
| CineMax REST API  (all routes are prefixed with /api)
|
| Module 1 - Users & Security
*/

// Public: sign in, sign up and password reset (rate limited against guessing)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

    // Signed-in users
    Route::middleware('auth.token')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::put('password', [AuthController::class, 'changePassword']);
    });
});

// Administrators only
Route::middleware(['auth.token', 'role:ADMIN'])->group(function () {
    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{id}', [UserController::class, 'update'])->whereNumber('id');
    Route::delete('users/{id}', [UserController::class, 'destroy'])->whereNumber('id');
    Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword'])->whereNumber('id');

    Route::get('audit-logs', [AuditLogController::class, 'index']);
});
