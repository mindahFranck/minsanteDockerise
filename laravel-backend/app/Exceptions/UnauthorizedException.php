<?php

namespace App\Exceptions;

class UnauthorizedException extends ApiException
{
    public function __construct(string $message = 'Non authentifié')
    {
        parent::__construct($message, 401);
    }
}
