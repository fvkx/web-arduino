<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = [
    "room"    => $_POST["room"]    ?? null,
    "year"    => $_POST["year"]    ?? null,
    "start"   => $_POST["start"]   ?? null,
    "end"     => $_POST["end"]     ?? null,
    "entries" => isset($_POST["entries"]) ? (int)$_POST["entries"] : null,
    "exits"   => isset($_POST["exits"])   ? (int)$_POST["exits"]   : null,
    "peak"    => isset($_POST["peak"])    ? (int)$_POST["peak"]    : null,
];

foreach ($data as $key => $val) {
    if ($val === null) {
        echo json_encode(["error" => "Missing field: $key"]);
        exit;
    }
}

$conn = new mysqli("localhost", "root", "", "arweb");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB connection failed", "details" => $conn->connect_error]);
    exit;
}

$stmt1 = $conn->prepare("INSERT INTO sessions (room, year_level, start_time, end_time) VALUES (?, ?, ?, ?)");
$stmt1->bind_param("ssss", $data["room"], $data["year"], $data["start"], $data["end"]);

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