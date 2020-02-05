const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}
