<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Module 1 seed data: the three cinemas (branches) and the demo accounts.
 * The ids match the front-end demo data, so the pages that are not connected yet keep working.
 * Every demo account has the password  demo1234.  Safe to run more than once.
 */
class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $cinemas = [
            [1, 'CineMax Gulberg', 'Lahore', 'MM Alam Road, Gulberg III', '042-111-246-362'],
            [2, 'CineMax DHA', 'Karachi', 'Zamzama Boulevard, Phase 5, DHA', '021-111-246-362'],
            [3, 'CineMax F-7', 'Islamabad', 'Jinnah Super Market, F-7 Markaz', '051-111-246-362'],
        ];
        foreach ($cinemas as [$id, $name, $city, $address, $phone]) {
            DB::insert(
                "INSERT INTO cinema (cinema_id, cinema_name, city, address, contact_number, cinema_status)
                 VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                 ON DUPLICATE KEY UPDATE cinema_name = VALUES(cinema_name), city = VALUES(city),
                                         address = VALUES(address), contact_number = VALUES(contact_number)",
                [$id, $name, $city, $address, $phone]
            );
        }

        // id, role, cinema_id, name, email, phone, status, joined N days ago
        $users = [
            [1, 'CUSTOMER', null, 'Ali Raza', 'ali.raza@example.com', '0300-1112233', 'ACTIVE', 80],
            [2, 'CUSTOMER', null, 'Sara Khan', 'sara.khan@example.com', '0301-2223344', 'ACTIVE', 60],
            [3, 'CUSTOMER', null, 'Hamza Ahmed', 'hamza.ahmed@example.com', '0321-3334455', 'ACTIVE', 45],
            [4, 'CUSTOMER', null, 'Ayesha Malik', 'ayesha.malik@example.com', '0333-4445566', 'ACTIVE', 30],
            [5, 'CUSTOMER', null, 'Usman Tariq', 'usman.tariq@example.com', '0345-5556677', 'ACTIVE', 12],
            [6, 'ADMIN', null, 'System Admin', 'admin@cinemax.pk', '042-111-246-362', 'ACTIVE', 200],
            [7, 'MANAGER', 1, 'Nadia Hussain', 'manager.lahore@cinemax.pk', '0300-7000001', 'ACTIVE', 150],
            [8, 'BOX_OFFICE', 1, 'Bilal Sheikh', 'boxoffice.lahore@cinemax.pk', '0300-7000002', 'ACTIVE', 120],
            [9, 'MANAGER', 2, 'Omar Farooq', 'manager.karachi@cinemax.pk', '0300-7000003', 'ACTIVE', 140],
            [10, 'CUSTOMER', null, 'Zainab Iqbal', 'zainab.iqbal@example.com', '0302-8889900', 'SUSPENDED', 50],
        ];

        $hash = Hash::make('demo1234');
        foreach ($users as [$id, $role, $cinemaId, $name, $email, $phone, $status, $daysAgo]) {
            DB::insert(
                'INSERT INTO user_account (user_id, role, cinema_id, full_name, email, phone, password_hash, account_status, created_at, last_login_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
                 ON DUPLICATE KEY UPDATE user_id = user_id',
                [$id, $role, $cinemaId, $name, $email, $phone, $hash, $status, $daysAgo]
            );
        }
    }
}
