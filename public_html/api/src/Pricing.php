<?php

/** Regla única de vigencia, redondeo y serialización de descuentos. */
class Pricing
{
    public static function calculate(array $product, ?DateTimeImmutable $now = null): array
    {
        $utc = new DateTimeZone('UTC');
        $now = $now ?: new DateTimeImmutable('now', $utc);
        $list = round((float) ($product['price'] ?? 0), 2);
        $percent = round((float) ($product['discount_percent'] ?? 0), 2);
        $starts = self::fromDatabase($product['discount_starts_at'] ?? null);
        $ends = self::fromDatabase($product['discount_ends_at'] ?? null);
        $productActive = ($product['status'] ?? 'active') === 'active';

        if ($percent <= 0 || !$productActive) {
            $status = 'none';
        } elseif ($ends && $now >= $ends) {
            $status = 'expired';
        } elseif ($starts && $now < $starts) {
            $status = 'scheduled';
        } else {
            $status = 'active';
        }

        $activePercent = $status === 'active' ? $percent : 0.0;
        $effective = round($list * (1 - $activePercent / 100), 2);
        $savings = round($list - $effective, 2);

        return [
            'price' => $list,
            'discount_percent' => $percent,
            'discount_starts_at' => self::iso($starts),
            'discount_ends_at' => self::iso($ends),
            'discount_status' => $status,
            'effective_price' => max(0.0, $effective),
            'unit_savings' => max(0.0, $savings),
        ];
    }

    /** Valida campos enviados y devuelve valores listos para MySQL. */
    public static function validateInput(array $data, array $current = []): array
    {
        $hasPercent = array_key_exists('discount_percent', $data);
        $hasStarts = array_key_exists('discount_starts_at', $data);
        $hasEnds = array_key_exists('discount_ends_at', $data);

        $rawPercent = $hasPercent ? $data['discount_percent'] : ($current['discount_percent'] ?? 0);
        if ($rawPercent === '' || $rawPercent === null || !is_numeric($rawPercent)) {
            Response::validation(['discount_percent' => ['El porcentaje debe ser numérico entre 0 y 90.']]);
        }
        $percent = round((float) $rawPercent, 2);
        if ($percent < 0 || $percent > 90) {
            Response::validation(['discount_percent' => ['El porcentaje debe estar entre 0 y 90.']]);
        }

        $starts = self::parseInput(
            $hasStarts ? $data['discount_starts_at'] : ($current['discount_starts_at'] ?? null),
            'discount_starts_at',
            $hasStarts
        );
        $ends = self::parseInput(
            $hasEnds ? $data['discount_ends_at'] : ($current['discount_ends_at'] ?? null),
            'discount_ends_at',
            $hasEnds
        );
        if ($starts && $ends && $ends <= $starts) {
            Response::validation(['discount_ends_at' => ['La fecha final debe ser posterior a la inicial.']]);
        }
        if ($percent == 0.0) {
            $starts = null;
            $ends = null;
        }

        return [
            'percent' => $percent,
            'starts_at' => $starts ? $starts->format('Y-m-d H:i:s') : null,
            'ends_at' => $ends ? $ends->format('Y-m-d H:i:s') : null,
            'supplied' => $hasPercent || $hasStarts || $hasEnds,
        ];
    }

    private static function parseInput($value, string $field, bool $strictIso): ?DateTimeImmutable
    {
        if ($value === null || $value === '') return null;
        $iso = is_string($value)
            && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/', $value);
        $databaseDate = !$strictIso && is_string($value)
            && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $value);
        if (!$iso && !$databaseDate) {
            Response::validation([$field => ['Usa una fecha ISO 8601 con zona horaria.']]);
        }
        try {
            $zone = $databaseDate ? new DateTimeZone('UTC') : null;
            return (new DateTimeImmutable($value, $zone))->setTimezone(new DateTimeZone('UTC'));
        } catch (Throwable $e) {
            Response::validation([$field => ['La fecha no es válida.']]);
        }
    }

    private static function fromDatabase($value): ?DateTimeImmutable
    {
        if (!$value) return null;
        return new DateTimeImmutable((string) $value, new DateTimeZone('UTC'));
    }

    private static function iso(?DateTimeImmutable $value): ?string
    {
        return $value ? $value->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z') : null;
    }
}
