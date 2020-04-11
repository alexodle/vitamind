import { WeathType } from "./types"

export const BRAND = 'Get Some Vitamin D'

export const DEFAULT_FORECAST_LIMIT = 10
export const DEFAULT_DRIVE_HOURS = 6
export const VALID_DRIVE_HOURS = [4, 6, 8, 12, 20]

// Large max just to cap things within reason
export const MAX_DRIVE_MINUTES = VALID_DRIVE_HOURS[VALID_DRIVE_HOURS.length - 1] * 60

export const WEATH_TYPES: WeathType[] = ['sunny', 'warm']

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 3 // 3 years
export const DEFAULT_COOKIE_OPTIONS = {
  maxAge: COOKIE_MAX_AGE,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
}

export const CSS_MEDIA_PHONE = 'only screen and (max-width: 812px)'
export const NOT_CSS_MEDIA_PHONE = 'only screen and (min-width: 813px)'
