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

export const VISIT_STATUS_LABEL = {
  Pre_Registered: 'Pre-Registered',
  Checked_In: 'Checked In',
  Checked_Out: 'Checked Out',
  Cancelled: 'Cancelled',
  Denied: 'Denied',
}

export const STATUS_BADGE_MAP = {
  Pre_Registered: 'badge-pill-amber',
  Checked_In: 'badge-pill-green',
  Checked_Out: 'badge-pill-neutral',
  Cancelled: 'badge-pill-red',
  Denied: 'badge-pill-red',
}

export const ID_PROOF_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVER_LICENSE', label: "Driver's License" },
  { value: 'EMPLOYEE_ID', label: 'Employee ID' },
  { value: 'OTHER', label: 'Other' },
]

export const PAGE_SIZE = 10
