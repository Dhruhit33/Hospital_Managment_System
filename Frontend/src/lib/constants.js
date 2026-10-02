export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
}

export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
}

export const BILL_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
}

export const NAV_LINKS = {
  PATIENT: [
    { name: 'Dashboard', path: '/patient/dashboard', icon: 'LayoutDashboard' },
    { name: 'Book Appointment', path: '/patient/book', icon: 'CalendarPlus' },
    { name: 'My Appointments', path: '/patient/appointments', icon: 'Calendar' },
    { name: 'Medical Records', path: '/patient/records', icon: 'FileText' },
    { name: 'My Bills', path: '/patient/bills', icon: 'CreditCard' },
    { name: 'Insurance Policy', path: '/patient/insurance', icon: 'ShieldCheck' },
    { name: 'My Profile', path: '/patient/profile', icon: 'User' },
  ],
  DOCTOR: [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: 'LayoutDashboard' },
    { name: 'My Appointments', path: '/doctor/appointments', icon: 'Calendar' },
    { name: 'Availability & Leaves', path: '/doctor/availability', icon: 'Clock' },
    { name: 'My Patients', path: '/doctor/patients', icon: 'Users' },
  ],
  ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
    { name: 'Doctor Management', path: '/admin/doctors', icon: 'Stethoscope' },
    { name: 'Patient Directory', path: '/admin/patients', icon: 'Users' },
    { name: 'Departments', path: '/admin/departments', icon: 'Building2' },
    { name: 'All Appointments', path: '/admin/appointments', icon: 'CalendarCheck' },
    { name: 'Billing & Invoices', path: '/admin/bills', icon: 'Receipt' },
    { name: 'User Access Control', path: '/admin/users', icon: 'ShieldAlert' },
  ],
}
