<?php
/**
 * RESTful Screen Management API
 * Manage screen table/entity (Create, Read, Update, Delete) with seat layout generation
 */

require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetScreens($pdo);
        break;

    case 'POST':
        handleCreateScreen($pdo);
        break;

    case 'PUT':
        handleUpdateScreen($pdo);
        break;

    case 'DELETE':
        handleDeleteScreen($pdo);
        break;

    default:
        sendError('Method not allowed', 405);
        break;
}

/**
 * GET /api/screens.php
 * GET /api/screens.php?id={id}
 * Optional filters: ?cinema_id=X&type=IMAX&status=ACTIVE
 */
function handleGetScreens($pdo) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($id) {
        // Fetch specific screen with cinema info and seat layout
        $stmt = $pdo->prepare("
            SELECT s.*, 
                   c.cinema_name, c.city, c.address AS cinema_address, c.contact_number AS cinema_contact,
                   (SELECT COUNT(*) FROM seat WHERE screen_id = s.screen_id AND seat_status = 'ACTIVE') AS active_seats_count
            FROM screen s
            JOIN cinema c ON c.cinema_id = s.cinema_id
            WHERE s.screen_id = :id
        ");
        $stmt->execute(['id' => $id]);
        $screen = $stmt->fetch();

        if (!$screen) {
            sendError('Screen not found', 404);
        }

        // Fetch seat layout
        $seatStmt = $pdo->prepare("
            SELECT st.seat_id, st.screen_id, st.row_label, st.seat_number, st.seat_status,
                   sc.seat_category_id, sc.category_name, sc.price_multiplier
            FROM seat st
            JOIN seat_category sc ON sc.seat_category_id = st.seat_category_id
            WHERE st.screen_id = :screen_id
            ORDER BY st.row_label ASC, st.seat_number ASC
        ");
        $seatStmt->execute(['screen_id' => $id]);
        $seats = $seatStmt->fetchAll();

        $screen['seats'] = $seats;
        sendResponse($screen);
    } else {
        // Build query with optional filters
        $where = [];
        $params = [];

        if (!empty($_GET['cinema_id'])) {
            $where[] = "s.cinema_id = :cinema_id";
            $params['cinema_id'] = intval($_GET['cinema_id']);
        }
        if (!empty($_GET['type'])) {
            $where[] = "s.screen_type = :screen_type";
            $params['screen_type'] = strtoupper(trim($_GET['type']));
        }
        if (!empty($_GET['status'])) {
            $where[] = "s.screen_status = :screen_status";
            $params['screen_status'] = strtoupper(trim($_GET['status']));
        }

        $whereClause = count($where) ? "WHERE " . implode(" AND ", $where) : "";

        $sql = "
            SELECT s.*, 
                   c.cinema_name, c.city, c.address AS cinema_address,
                   (SELECT COUNT(*) FROM seat WHERE screen_id = s.screen_id) AS total_configured_seats,
                   (SELECT COUNT(*) FROM seat WHERE screen_id = s.screen_id AND seat_status = 'ACTIVE') AS active_seats_count
            FROM screen s
            JOIN cinema c ON c.cinema_id = s.cinema_id
            {$whereClause}
            ORDER BY s.cinema_id ASC, s.screen_id ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $screens = $stmt->fetchAll();

        sendResponse($screens);
    }
}

/**
 * POST /api/screens.php
 * Create a new screen and automatically populate its seat rows and columns in the seat table.
 */
function handleCreateScreen($pdo) {
    $data = getJsonInput();

    // Required inputs validation
    if (empty($data['cinema_id']) || empty($data['screen_name'])) {
        sendError('cinema_id and screen_name are required fields.');
    }

    $cinema_id     = intval($data['cinema_id']);
    $screen_name   = trim($data['screen_name']);
    $screen_type   = !empty($data['screen_type']) ? strtoupper(trim($data['screen_type'])) : 'STANDARD';
    $screen_status = !empty($data['screen_status']) ? strtoupper(trim($data['screen_status'])) : 'ACTIVE';
    $rows_count    = !empty($data['rows_count']) ? max(1, min(20, intval($data['rows_count']))) : 8;
    $columns_count = !empty($data['columns_count']) ? max(2, min(30, intval($data['columns_count']))) : 12;
    $total_seats   = $rows_count * $columns_count;

    // Validate enum values
    $validTypes = ['STANDARD', '3D', 'IMAX', 'VIP'];
    if (!in_array($screen_type, $validTypes)) {
        sendError("Invalid screen_type. Must be one of: " . implode(', ', $validTypes));
    }

    $validStatuses = ['ACTIVE', 'MAINTENANCE', 'CLOSED'];
    if (!in_array($screen_status, $validStatuses)) {
        sendError("Invalid screen_status. Must be one of: " . implode(', ', $validStatuses));
    }

    // Verify cinema exists
    $cinCheck = $pdo->prepare("SELECT cinema_id, cinema_name FROM cinema WHERE cinema_id = :id");
    $cinCheck->execute(['id' => $cinema_id]);
    $cinema = $cinCheck->fetch();
    if (!$cinema) {
        sendError("Cinema branch with ID {$cinema_id} does not exist.", 404);
    }

    // Check unique constraint uq_screen_name (cinema_id, screen_name)
    $nameCheck = $pdo->prepare("SELECT screen_id FROM screen WHERE cinema_id = :cid AND screen_name = :sname");
    $nameCheck->execute(['cid' => $cinema_id, 'sname' => $screen_name]);
    if ($nameCheck->fetch()) {
        sendError("A screen named '{$screen_name}' already exists in {$cinema['cinema_name']}.", 409);
    }

    // Check seat categories
    $catStmt = $pdo->query("SELECT seat_category_id, category_name FROM seat_category ORDER BY seat_category_id ASC");
    $categories = $catStmt->fetchAll();
    $catMap = [];
    foreach ($categories as $c) {
        $catMap[strtolower($c['category_name'])] = $c['seat_category_id'];
    }
    $stdCat = $catMap['standard'] ?? 1;
    $premCat = $catMap['premium'] ?? 2;
    $vipCat = $catMap['vip'] ?? 3;

    try {
        $pdo->beginTransaction();

        // 1. Insert screen record
        $insScreen = $pdo->prepare("
            INSERT INTO screen (cinema_id, screen_name, screen_type, screen_status, rows_count, columns_count, total_seats)
            VALUES (:cinema_id, :screen_name, :screen_type, :screen_status, :rows_count, :columns_count, :total_seats)
        ");
        $insScreen->execute([
            'cinema_id'     => $cinema_id,
            'screen_name'   => $screen_name,
            'screen_type'   => $screen_type,
            'screen_status' => $screen_status,
            'rows_count'    => $rows_count,
            'columns_count' => $columns_count,
            'total_seats'   => $total_seats
        ]);

        $screen_id = $pdo->lastInsertId();

        // 2. Generate and bulk-insert seat records
        $seatValues = [];
        $seatParams = [];
        $paramIdx = 0;

        for ($r = 0; $r < $rows_count; $r++) {
            $rowLabel = chr(65 + $r);

            // Tier distribution: front rows standard, middle premium, back VIP
            if ($r < max(1, $rows_count - 5)) {
                $catId = $stdCat;
            } elseif ($r < max(2, $rows_count - 2)) {
                $catId = $premCat;
            } else {
                $catId = $vipCat;
            }

            for ($num = 1; $num <= $columns_count; $num++) {
                $seatValues[] = "(:scr_{$paramIdx}, :cat_{$paramIdx}, :row_{$paramIdx}, :num_{$paramIdx}, 'ACTIVE')";
                $seatParams["scr_{$paramIdx}"] = $screen_id;
                $seatParams["cat_{$paramIdx}"] = $catId;
                $seatParams["row_{$paramIdx}"] = $rowLabel;
                $seatParams["num_{$paramIdx}"] = $num;
                $paramIdx++;
            }
        }

        if (!empty($seatValues)) {
            $seatSql = "INSERT INTO seat (screen_id, seat_category_id, row_label, seat_number, seat_status) VALUES "
                     . implode(", ", $seatValues);
            $insSeats = $pdo->prepare($seatSql);
            $insSeats->execute($seatParams);
        }

        $pdo->commit();

        // Retrieve created screen with relations
        $resStmt = $pdo->prepare("
            SELECT s.*, c.cinema_name, c.city,
                   (SELECT COUNT(*) FROM seat WHERE screen_id = s.screen_id) AS total_configured_seats
            FROM screen s
            JOIN cinema c ON c.cinema_id = s.cinema_id
            WHERE s.screen_id = :id
        ");
        $resStmt->execute(['id' => $screen_id]);
        $created = $resStmt->fetch();

        sendResponse($created, 201, "Screen '{$screen_name}' successfully created with {$total_seats} seats generated.");

    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('Failed to create screen: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT /api/screens.php?id={id}
 * Update screen metadata or status.
 */
function handleUpdateScreen($pdo) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $data = getJsonInput();

    if (!$id && !empty($data['screen_id'])) {
        $id = intval($data['screen_id']);
    }

    if (!$id) {
        sendError('Screen ID is required in URL or body.');
    }

    // Check if updating individual seat layout (e.g. from SeatEditor)
    if ((isset($_GET['action']) && $_GET['action'] === 'seats') || isset($data['changes'])) {
        $changes = isset($data['changes']) ? $data['changes'] : $data;
        if (!is_array($changes) || empty($changes)) {
            sendError('No seat changes provided.', 400);
        }

        try {
            $pdo->beginTransaction();
            $updSeat = $pdo->prepare("
                UPDATE seat 
                SET seat_category_id = :cat_id, seat_status = :status 
                WHERE seat_id = :seat_id AND screen_id = :screen_id
            ");

            $updatedCount = 0;
            foreach ($changes as $seatId => $patch) {
                if (is_array($patch) && isset($patch['seat_category_id'], $patch['seat_status'])) {
                    $updSeat->execute([
                        'cat_id'    => intval($patch['seat_category_id']),
                        'status'    => strtoupper(trim($patch['seat_status'])),
                        'seat_id'   => intval($seatId),
                        'screen_id' => $id
                    ]);
                    $updatedCount++;
                }
            }
            $pdo->commit();
            sendResponse(['screen_id' => $id, 'updated_seats' => $updatedCount], 200, "Seat layout saved ({$updatedCount} seats updated in database).");
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError('Failed to save seat layout: ' . $e->getMessage(), 500);
        }
    }

    // Verify existing screen
    $check = $pdo->prepare("SELECT * FROM screen WHERE screen_id = :id");
    $check->execute(['id' => $id]);
    $existing = $check->fetch();
    if (!$existing) {
        sendError("Screen with ID {$id} not found.", 404);
    }

    $cinema_id     = isset($data['cinema_id']) ? intval($data['cinema_id']) : $existing['cinema_id'];
    $screen_name   = isset($data['screen_name']) ? trim($data['screen_name']) : $existing['screen_name'];
    $screen_type   = isset($data['screen_type']) ? strtoupper(trim($data['screen_type'])) : $existing['screen_type'];
    $screen_status = isset($data['screen_status']) ? strtoupper(trim($data['screen_status'])) : $existing['screen_status'];
    $rows_count    = isset($data['rows_count']) ? intval($data['rows_count']) : $existing['rows_count'];
    $columns_count = isset($data['columns_count']) ? intval($data['columns_count']) : $existing['columns_count'];
    $total_seats   = $rows_count * $columns_count;

    // Check unique name if changed
    if ($screen_name !== $existing['screen_name'] || $cinema_id !== $existing['cinema_id']) {
        $uqCheck = $pdo->prepare("SELECT screen_id FROM screen WHERE cinema_id = :cid AND screen_name = :sname AND screen_id <> :id");
        $uqCheck->execute(['cid' => $cinema_id, 'sname' => $screen_name, 'id' => $id]);
        if ($uqCheck->fetch()) {
            sendError("A screen with name '{$screen_name}' already exists in this cinema.", 409);
        }
    }

    // Check if rows/columns layout changed
    $layoutChanged = ($rows_count != $existing['rows_count'] || $columns_count != $existing['columns_count']);

    if ($layoutChanged) {
        // Prevent layout resize if showtimes or bookings exist
        $showCheck = $pdo->prepare("SELECT COUNT(*) FROM showtime WHERE screen_id = :id");
        $showCheck->execute(['id' => $id]);
        if ($showCheck->fetchColumn() > 0) {
            sendError("Cannot modify seat layout: Screen has scheduled showtimes. To reconfigure seats, cancel existing shows or create a new screen.", 409);
        }
    }

    try {
        $pdo->beginTransaction();

        $upd = $pdo->prepare("
            UPDATE screen 
            SET cinema_id = :cinema_id,
                screen_name = :screen_name,
                screen_type = :screen_type,
                screen_status = :screen_status,
                rows_count = :rows_count,
                columns_count = :columns_count,
                total_seats = :total_seats
            WHERE screen_id = :id
        ");
        $upd->execute([
            'cinema_id'     => $cinema_id,
            'screen_name'   => $screen_name,
            'screen_type'   => $screen_type,
            'screen_status' => $screen_status,
            'rows_count'    => $rows_count,
            'columns_count' => $columns_count,
            'total_seats'   => $total_seats,
            'id'            => $id
        ]);

        // If layout changed and no showtimes, regenerate seats
        if ($layoutChanged) {
            $pdo->prepare("DELETE FROM seat WHERE screen_id = :id")->execute(['id' => $id]);

            $catStmt = $pdo->query("SELECT seat_category_id, category_name FROM seat_category");
            $catMap = [];
            foreach ($catStmt->fetchAll() as $c) {
                $catMap[strtolower($c['category_name'])] = $c['seat_category_id'];
            }
            $stdCat = $catMap['standard'] ?? 1;
            $premCat = $catMap['premium'] ?? 2;
            $vipCat = $catMap['vip'] ?? 3;

            $seatValues = [];
            $seatParams = [];
            $paramIdx = 0;

            for ($r = 0; $r < $rows_count; $r++) {
                $rowLabel = chr(65 + $r);
                $catId = ($r < max(1, $rows_count - 5)) ? $stdCat : (($r < max(2, $rows_count - 2)) ? $premCat : $vipCat);

                for ($num = 1; $num <= $columns_count; $num++) {
                    $seatValues[] = "(:scr_{$paramIdx}, :cat_{$paramIdx}, :row_{$paramIdx}, :num_{$paramIdx}, 'ACTIVE')";
                    $seatParams["scr_{$paramIdx}"] = $id;
                    $seatParams["cat_{$paramIdx}"] = $catId;
                    $seatParams["row_{$paramIdx}"] = $rowLabel;
                    $seatParams["num_{$paramIdx}"] = $num;
                    $paramIdx++;
                }
            }

            if (!empty($seatValues)) {
                $seatSql = "INSERT INTO seat (screen_id, seat_category_id, row_label, seat_number, seat_status) VALUES "
                         . implode(", ", $seatValues);
                $insSeats = $pdo->prepare($seatSql);
                $insSeats->execute($seatParams);
            }
        }

        $pdo->commit();

        // Return updated screen
        $resStmt = $pdo->prepare("
            SELECT s.*, c.cinema_name, c.city,
                   (SELECT COUNT(*) FROM seat WHERE screen_id = s.screen_id) AS total_configured_seats
            FROM screen s
            JOIN cinema c ON c.cinema_id = s.cinema_id
            WHERE s.screen_id = :id
        ");
        $resStmt->execute(['id' => $id]);
        $updated = $resStmt->fetch();

        sendResponse($updated, 200, "Screen '{$screen_name}' successfully updated.");

    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('Failed to update screen: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE /api/screens.php?id={id}
 * Delete a screen if no foreign key dependencies exist.
 */
function handleDeleteScreen($pdo) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendError('Screen ID is required in URL parameter ?id=');
    }

    // Verify screen exists
    $check = $pdo->prepare("SELECT screen_name FROM screen WHERE screen_id = :id");
    $check->execute(['id' => $id]);
    $screen = $check->fetch();
    if (!$screen) {
        sendError("Screen with ID {$id} not found.", 404);
    }

    // Check FK constraint with showtime
    $showCheck = $pdo->prepare("SELECT COUNT(*) FROM showtime WHERE screen_id = :id");
    $showCheck->execute(['id' => $id]);
    $showCount = $showCheck->fetchColumn();

    if ($showCount > 0) {
        sendError("Cannot delete screen '{$screen['screen_name']}': It is referenced by {$showCount} scheduled showtime(s). Set screen status to 'CLOSED' or delete the associated shows first.", 409);
    }

    try {
        $pdo->beginTransaction();

        // Delete seats for this screen
        $delSeats = $pdo->prepare("DELETE FROM seat WHERE screen_id = :id");
        $delSeats->execute(['id' => $id]);

        // Delete screen
        $delScreen = $pdo->prepare("DELETE FROM screen WHERE screen_id = :id");
        $delScreen->execute(['id' => $id]);

        $pdo->commit();

        sendResponse(['deleted_id' => $id], 200, "Screen '{$screen['screen_name']}' and its seating layout successfully deleted.");

    } catch (Exception $e) {
        $pdo->rollBack();
        sendError('Failed to delete screen: ' . $e->getMessage(), 500);
    }
}
