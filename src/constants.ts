import { WeathType } from "./types"

export const DEFAULT_DRIVE_HOURS = 6
export const VALID_DRIVE_HOURS = [4, 6, 8, 12, 20]

// Large max just to cap things within reason
export const MAX_DRIVE_MINUTES = VALID_DRIVE_HOURS[VALID_DRIVE_HOURS.length - 1] * 60

export const WEATH_TYPES: WeathType[] = ['sunny', 'warm']
