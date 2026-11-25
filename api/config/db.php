<?php
/**
 * Database Connection & Global API Helper
 * Connects to MySQL 'cinema_db' via PDO
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = '127.0.0.1';
$db_port = '3306';
$db_name = 'cinema_db';
$db_user = 'root';
$db_pass = '';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

/**
 * Standard Success Response Helper
 */
function sendResponse($data, $statusCode = 200, $message = null) {
    http_response_code($statusCode);
    $response = ['success' => true];
    if ($message !== null) {
        $response['message'] = $message;
    }
    if (is_array($data) && isset($data['data'])) {
        $response = array_merge($response, $data);
    } else {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Standard Error Response Helper
 */
function sendError($message, $statusCode = 400, $details = null) {
    http_response_code($statusCode);
    $response = [
        'success' => false,
        'error'   => $message
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Read and decode incoming JSON request payload
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
