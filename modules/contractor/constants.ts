export const CONTRACTOR_POSITIONS = [
  "Steel Fixer",
  "Welder",
  "Crane Operator", 
  "Supervisor",
  "Labourer",
  "Rigger",
  "Concrete Worker",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Other"
] as const

export const CONTRACTOR_SORT_OPTIONS = [
  { value: "nickname", label: "Nickname" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "fullName", label: "Full Name" },
  { value: "position", label: "Position" },
  { value: "hourlyRate", label: "Hourly Rate" },
  { value: "active", label: "Status" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" }
] as const

export const CONTRACTOR_STATUS_OPTIONS = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" }
] as const