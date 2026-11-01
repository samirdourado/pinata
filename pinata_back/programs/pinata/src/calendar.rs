//! Calendar math for the monthly platform draw, using the on-chain clock.

use crate::constants::SECONDS_PER_DAY;

/// Day of the month (1-31) of a Unix timestamp shifted by `offset_seconds`.
/// Civil-from-days algorithm by Howard Hinnant (proleptic Gregorian calendar).
pub fn day_of_month(unix_timestamp: i64, offset_seconds: i32) -> u32 {
    let days = (unix_timestamp + offset_seconds as i64).div_euclid(SECONDS_PER_DAY);
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    (doy - (153 * mp + 2) / 5 + 1) as u32
}

pub fn is_first_day_of_month(unix_timestamp: i64, offset_seconds: i32) -> bool {
    day_of_month(unix_timestamp, offset_seconds) == 1
}

#[cfg(test)]
mod tests {
    use super::*;

    const BRASILIA: i32 = -3 * 3600;

    #[test]
    fn known_dates() {
        assert_eq!(day_of_month(0, 0), 1); // 1970-01-01
        assert_eq!(day_of_month(951_782_400, 0), 29); // 2000-02-29 (leap year)
        assert_eq!(day_of_month(1_798_761_600, 0), 1); // 2027-01-01 00:00 UTC
    }

    #[test]
    fn uses_the_timezone() {
        // 2026-11-01 02:00 UTC is still 2026-10-31 23:00 in Brasília
        let ts = 1_793_498_400;
        assert!(is_first_day_of_month(ts, 0));
        assert!(!is_first_day_of_month(ts, BRASILIA));
        // 2026-11-01 03:00 UTC is midnight in Brasília
        assert!(is_first_day_of_month(ts + 3600, BRASILIA));
    }
}
