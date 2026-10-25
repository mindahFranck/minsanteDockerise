<?php

namespace App\Exceptions;

class ConflictException extends ApiException
{
    public function __construct(string $message = 'Conflit de données')
    {
        parent::__construct($message, 409);
    }
}
