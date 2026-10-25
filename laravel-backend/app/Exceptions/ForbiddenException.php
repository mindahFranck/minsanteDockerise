<?php

namespace App\Exceptions;

class ForbiddenException extends ApiException
{
    public function __construct(string $message = 'Accès interdit')
    {
        parent::__construct($message, 403);
    }
}
