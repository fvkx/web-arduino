<?php
ini_set('display_errors', 0);
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ← THIS is the fix — read JSON body, not $_POST
$body = json_decode(file_get_contents("php://input"), true);

if (!$body) {
    echo json_encode(["error" => "Invalid or empty JSON body"]);
    exit;
}

$data = [
    "room"    => $body["room"]    ?? null,
    "year"    => $body["year"]    ?? null,
    "start"   => $body["start"]   ?? null,
    "end"     => $body["end"]     ?? null,
    "entries" => isset($body["entries"]) ? (int)$body["entries"] : null,
    "exits"   => isset($body["exits"])   ? (int)$body["exits"]   : null,
    "peak"    => isset($body["peak"])    ? (int)$body["peak"]    : null,
    "status"  => $body["status"]  ?? "on-time",
    "reason"  => $body["reason"]  ?? null,
    "source"  => $body["source"]  ?? "auto",
];

$required = ["room", "year", "start", "end", "entries", "exits", "peak"];
foreach ($required as $key) {
    if ($data[$key] === null) {
        echo json_encode(["error" => "Missing field: $key"]);
        exit;
    }
}

$conn = new mysqli("localhost", "root", "", "arweb");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB connection failed", "details" => $conn->connect_error]);
    exit;
}

$stmt1 = $conn->prepare("INSERT INTO sessions (room, year_level, start_time, end_time, status, reason, source) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt1->bind_param("sssssss", $data["room"], $data["year"], $data["start"], $data["end"], $data["status"], $data["reason"], $data["source"]);

if (!$stmt1->execute()) {
    echo json_encode(["error" => "Failed to insert session", "details" => $stmt1->error]);
    exit;
}

$session_id = $stmt1->insert_id;

$stmt2 = $conn->prepare("INSERT INTO session_summary (session_id, total_entries, total_exits, peak_occupancy) VALUES (?, ?, ?, ?)");
$stmt2->bind_param("iiii", $session_id, $data["entries"], $data["exits"], $data["peak"]);

if (!$stmt2->execute()) {
    echo json_encode(["error" => "Failed to insert summary", "details" => $stmt2->error]);
    exit;
}

echo json_encode(["status" => "saved", "session_id" => $session_id]);

$stmt1->close();
$stmt2->close();
$conn->close();
?>