<?php
// دریافت داده از POST
$data = json_decode(file_get_contents('php://input'), true);

if ($data && is_array($data)) {
    $file = 'data/report.csv';
    
    // اگر فایل وجود ندارد، هدر را اضافه کن
    if (!file_exists($file)) {
        $header = ['timestamp', 'table', 'duration_seconds', 'device_type', 'browser', 'os', 'screen_resolution', 'user_language', 'referrer', 'items', 'total', 'recipient'];
        $fp = fopen($file, 'w');
        fputcsv($fp, $header);
        fclose($fp);
    }
    
    // اپند داده
    $fp = fopen($file, 'a');
    fputcsv($fp, $data);
    fclose($fp);
    
    echo 'success';
} else {
    echo 'error';
}
?>