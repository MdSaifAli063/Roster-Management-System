export const HELP_FAQS = [
  {
    id: 'password',
    q: 'How do I reset my password?',
    a: 'Go to Profile from the sidebar or user menu. If your account uses email sign-in, use the forgot-password flow on the login page. Google sign-in users should reset their password through Google Account settings.',
  },
  {
    id: 'employee',
    q: 'How do I add a new employee to RosterPro?',
    a: 'Open Staff in the sidebar, then add an employee record with their code, name, and site. You can provision login credentials from the staff detail page so they can view their roster and mark attendance.',
  },
  {
    id: 'roster',
    q: 'How do I create and publish a weekly roster?',
    a: 'Use Create Roster to generate shifts for your team, then View Schedule to review. Employees see updates on My Roster after you save. Check Actual Roster comparison under Attendance for mismatches.',
  },
  {
    id: 'attendance',
    q: 'How does attendance tracking work?',
    a: 'Employees mark in and out from the Attendance page. Employers see the Attendance overview with rates, log hours, and a detailed list. Compare planned roster vs punches under Roster comparison.',
  },
  {
    id: 'leave',
    q: 'How do I approve or decline leave requests?',
    a: 'Open Leave from the sidebar or use the notification bell — pending requests can be approved or declined directly from alerts. Enable auto-approve under Settings → General if you want instant approval.',
  },
  {
    id: 'organization',
    q: 'How do I update company and site information?',
    a: 'Click your organization name in the sidebar to open Organization settings, or use Settings → Company Information. Set timezone, operating days, and employment types there.',
  },
  {
    id: 'billing',
    q: 'How do I manage my subscription?',
    a: 'Employers can open Settings → Integrations or Billing in the sidebar to view your plan, upgrade, or manage payment through Stripe.',
  },
  {
    id: 'notifications',
    q: 'How do I control which alerts I receive?',
    a: 'Use Settings → Notifications to toggle in-app categories. Email alerts require SMTP configuration on your server (see Integrations tab for status).',
  },
  {
    id: 'pdf',
    q: 'Can I import roster data from a PDF?',
    a: 'Yes. Use PDF Extractor under Others to upload shift PDFs and map extracted data into your roster workflow.',
  },
  {
    id: 'support',
    q: 'Who can I contact for help?',
    a: 'For account or billing issues, contact your organization owner. For technical setup (database, email, Google login), refer to your deployment documentation or server administrator.',
  },
];

export const HELP_ARTICLES = [
  { title: 'Getting started with RosterPro', tag: 'Guide', summary: 'Set up your organization, staff, and first weekly roster.' },
  { title: 'Understanding roster status codes', tag: 'Reference', summary: 'Working, off, leave, and holiday cells explained.' },
  { title: 'Attendance mismatch alerts', tag: 'HR', summary: 'When planned shifts do not match punch times.' },
];

export const HELP_GUIDES = [
  { title: 'Create your first roster', steps: 4 },
  { title: 'Configure holidays and weekly offs', steps: 3 },
  { title: 'Employee self-service (mark in/out)', steps: 2 },
];
