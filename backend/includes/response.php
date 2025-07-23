<?php
class Response {
    public static function success($data = [], $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => time()
        ]);
    }
    
    public static function error($message, $code = 400, $details = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'error' => $message,
            'timestamp' => time()
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
    }
    
    public static function json($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
    }
}
?>