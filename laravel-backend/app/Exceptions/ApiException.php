<?php

namespace App\Exceptions;

use Exception;

class ApiException extends Exception
{
    protected int $statusCode;
    protected array $errors;

    public function __construct(string $message = '', int $statusCode = 500, array $errors = [])
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    public function getStatusCode(): int { return $this->statusCode; }
    public function getErrors(): array { return $this->errors; }

    public function render()
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'errors' => $this->errors,
        ], $this->statusCode);
    }
}
