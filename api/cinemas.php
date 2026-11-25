<?php
/**
 * RESTful Cinema Branches API
 * Get cinema branches list with screen counts
 */

require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($id) {
        $stmt = $pdo->prepare("
            SELECT c.*, 
                   COUNT(s.screen_id) AS screen_count
            FROM cinema c
            LEFT JOIN screen s ON s.cinema_id = c.cinema_id
            WHERE c.cinema_id = :id
            GROUP BY c.cinema_id
        ");
        $stmt->execute(['id' => $id]);
        $cinema = $stmt->fetch();

        if (!$cinema) {
            sendError('Cinema branch not found', 404);
        }

        sendResponse($cinema);
    } else {
        $stmt = $pdo->query("
            SELECT c.*, 
                   COUNT(s.screen_id) AS screen_count
            FROM cinema c
            LEFT JOIN screen s ON s.cinema_id = c.cinema_id
            GROUP BY c.cinema_id
            ORDER BY c.cinema_id ASC
        ");
        $cinemas = $stmt->fetchAll();
        sendResponse($cinemas);
    }
} else {
    sendError('Method not allowed', 405);
}
