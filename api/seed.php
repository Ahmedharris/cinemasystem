<?php
/**
 * Database Seeder for Screen and Seat Entities
 * Seeds initial cinemas, screens, and seat layouts if missing
 */

require_once __DIR__ . '/config/db.php';

try {
    // 1. Seed seat categories if not present
    $pdo->exec("
        INSERT IGNORE INTO seat_category (seat_category_id, category_name, price_multiplier) VALUES
        (1, 'Standard', 1.00),
        (2, 'Premium', 1.25),
        (3, 'VIP', 1.60)
    ");

    // 2. Seed Cinemas
    $pdo->exec("
        INSERT IGNORE INTO cinema (cinema_id, cinema_name, city, address, contact_number, cinema_status) VALUES
        (1, 'CineMax Gulberg', 'Lahore', 'MM Alam Road, Gulberg III', '042-111-222-333', 'ACTIVE'),
        (2, 'CineMax DHA', 'Karachi', 'Phase 8, Zamzama Boulevard', '021-111-222-444', 'ACTIVE'),
        (3, 'CineMax F-7', 'Islamabad', 'Jinnah Super Market, F-7 Markaz', '051-111-222-555', 'ACTIVE')
    ");

    // 3. Seed Screens
    $pdo->exec("
        INSERT INTO screen (screen_id, cinema_id, screen_name, screen_type, screen_status, rows_count, columns_count, total_seats) VALUES
        (1, 1, 'Screen 1', 'STANDARD', 'ACTIVE', 8, 12, 96),
        (2, 1, 'Screen 2 IMAX', 'IMAX', 'ACTIVE', 10, 14, 140),
        (3, 2, 'Screen 1 3D', '3D', 'ACTIVE', 8, 12, 96),
        (4, 2, 'Screen 2 VIP', 'VIP', 'ACTIVE', 6, 8, 48),
        (5, 3, 'Screen 1', 'STANDARD', 'ACTIVE', 8, 12, 96),
        (6, 3, 'Screen 2 3D', '3D', 'ACTIVE', 8, 12, 96)
        ON DUPLICATE KEY UPDATE 
          screen_name = VALUES(screen_name),
          screen_type = VALUES(screen_type),
          rows_count = VALUES(rows_count),
          columns_count = VALUES(columns_count),
          total_seats = VALUES(total_seats)
    ");

    // 4. Seed Seats for each screen
    $screens = $pdo->query("SELECT screen_id, rows_count, columns_count, screen_type FROM screen")->fetchAll();

    foreach ($screens as $scr) {
        $screen_id = $scr['screen_id'];
        $rows_count = $scr['rows_count'];
        $columns_count = $scr['columns_count'];
        $expectedSeats = $rows_count * $columns_count;

        // Check if seats already exist and match count
        $count = $pdo->prepare("SELECT COUNT(*) FROM seat WHERE screen_id = :id");
        $count->execute(['id' => $screen_id]);
        $existingCount = $count->fetchColumn();

        if ($existingCount != $expectedSeats) {
            $pdo->prepare("DELETE FROM seat WHERE screen_id = :id")->execute(['id' => $screen_id]);
            $seatValues = [];
            $params = [];
            $i = 0;

            for ($r = 0; $r < $rows_count; $r++) {
                $rowLabel = chr(65 + $r);
                if ($scr['screen_type'] === 'VIP') {
                    $catId = ($r < 2) ? 2 : 3;
                } else {
                    $catId = ($r < max(1, $rows_count - 5)) ? 1 : (($r < max(2, $rows_count - 2)) ? 2 : 3);
                }

                for ($num = 1; $num <= $columns_count; $num++) {
                    $seatValues[] = "(:s_{$i}, :c_{$i}, :r_{$i}, :n_{$i}, 'ACTIVE')";
                    $params["s_{$i}"] = $screen_id;
                    $params["c_{$i}"] = $catId;
                    $params["r_{$i}"] = $rowLabel;
                    $params["n_{$i}"] = $num;
                    $i++;
                }
            }

            if (!empty($seatValues)) {
                $sql = "INSERT INTO seat (screen_id, seat_category_id, row_label, seat_number, seat_status) VALUES "
                     . implode(", ", $seatValues);
                $ins = $pdo->prepare($sql);
                $ins->execute($params);
            }
        }
    }

    sendResponse([
        'message' => 'Cinemas, screens, and seat layouts successfully seeded.',
        'screens' => $pdo->query("SELECT s.screen_id, s.screen_name, s.screen_type, s.screen_status, COUNT(st.seat_id) as seat_count FROM screen s LEFT JOIN seat st ON st.screen_id = s.screen_id GROUP BY s.screen_id")->fetchAll()
    ]);

} catch (Exception $e) {
    sendError('Seeder failed: ' . $e->getMessage(), 500);
}
