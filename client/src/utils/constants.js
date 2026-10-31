// Must match the VisitStatus enum in prisma/schema.prisma exactly, which is
// also what src/validators/visit.validator.js's VISIT_STATUSES accepts.
// (The @map(...) on each enum member only changes the stored DB value, not
// the string Prisma/the API actually send over JSON.)
export const VISIT_STATUS = {
  PRE_REGISTERED: 'Pre_Registered',
  CHECKED_IN: 'Checked_In',
  CHECKED_OUT: 'Checked_Out',
  CANCELLED: 'Cancelled',
  DENIED: 'Denied',
}

export const STATUS_BADGE_MAP = {
  Pre_Registered: 'badge-pill-amber',
  Checked_In: 'badge-pill-green',
  Checked_Out: 'badge-pill-neutral',
  Cancelled: 'badge-pill-red',
  Denied: 'badge-pill-red',
}

export const PAGE_SIZE = 10
