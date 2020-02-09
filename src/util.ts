import { WeathType } from "./types"
import { WEATH_TYPES } from "./constants"

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email)

export const isValidWeathType = (weathType: WeathType) => WEATH_TYPES.indexOf(weathType) !== -1
