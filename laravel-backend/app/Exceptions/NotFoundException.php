<?php

namespace App\Exceptions;

class NotFoundException extends ApiException
{
    public function __construct(string $message = 'Ressource non trouvée')
    {
        parent::__construct($message, 404);
    }
}
