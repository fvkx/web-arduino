<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "arweb");

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["id"])) {
    echo json_encode(["status" => "error", "message" => "Missing session ID"]);
    exit;
}

$id = intval($data["id"]);

// Delete child row first to satisfy the foreign key constraint
$stmt1 = $conn->prepare("DELETE FROM session_summary WHERE session_id = ?");
$stmt1->bind_param("i", $id);
$stmt1->execute();
$stmt1->close();

// Now safe to delete the parent row
$stmt2 = $conn->prepare("DELETE FROM sessions WHERE id = ?");
$stmt2->bind_param("i", $id);

if ($stmt2->execute()) {
    if ($stmt2->affected_rows > 0) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Session not found"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Delete failed"]);
}

$stmt2->close();
$conn->close();