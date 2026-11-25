<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * The database structure comes from ../database/schema.sql (see the ERD).
     * Each module adds its seeder here:  php artisan db:seed
     */
    public function run(): void
    {
        $this->call([
            UsersSeeder::class, // Module 1 - cinemas + demo accounts
        ]);
    }
}
