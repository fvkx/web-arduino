<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$conn = new mysqli("localhost", "root", "", "arweb");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB connection failed", "details" => $conn->connect_error]);
    exit;
}

$result = $conn->query("
    SELECT
        s.id,
        s.room,
        s.year_level,
        s.start_time,
        s.end_time,
        s.created_at,
        COALESCE(ss.total_entries,  0) AS total_entries,
        COALESCE(ss.total_exits,    0) AS total_exits,
        COALESCE(ss.peak_occupancy, 0) AS peak_occupancy
    FROM sessions s
    LEFT JOIN session_summary ss ON ss.session_id = s.id
    ORDER BY s.created_at DESC
");

if (!$result) {
    echo json_encode(["error" => "Query failed", "details" => $conn->error]);
    exit;
}

$sessions = [];
while ($row = $result->fetch_assoc()) {
    $sessions[] = [
        "id"      => (int)$row["id"],
        "room"    => $row["room"],
        "year"    => $row["year_level"],
        "start"   => $row["start_time"],
        "end"     => $row["end_time"],
        "entries" => (int)$row["total_entries"],
        "exits"   => (int)$row["total_exits"],
        "peak"    => (int)$row["peak_occupancy"],
        "savedAt" => $row["created_at"],
    ];
}

echo json_encode(["status" => "ok", "sessions" => $sessions]);

$conn->close();
?>