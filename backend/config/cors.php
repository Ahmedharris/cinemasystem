<?php

/*
| The React front end runs on another origin (Apache on http://localhost, or the
| Vite dev server on http://localhost:5173), so the API must allow cross-origin
| requests. Authentication uses an Authorization header, not cookies.
*/
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [],
    'allowed_origins_patterns' => ['#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => false,
];
