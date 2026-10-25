<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class CacheService
{
    public static function get(string $key): mixed
    {
        return Cache::get($key);
    }

    public static function set(string $key, mixed $value, int $ttl = 3600): bool
    {
        return Cache::put($key, $value, $ttl);
    }

    public static function del(string $key): bool
    {
        return Cache::forget($key);
    }

    public static function delPattern(string $pattern): void
    {
        try {
            $redis = Redis::connection();
            $keys = $redis->keys($pattern);
            foreach ($keys as $key) {
                $cacheKey = str_replace(config('database.redis.options.prefix', ''), '', $key);
                Cache::forget($cacheKey);
            }
        } catch (\Exception $e) {
            Cache::flush();
        }
    }

    public static function clear(): bool
    {
        return Cache::flush();
    }
}
