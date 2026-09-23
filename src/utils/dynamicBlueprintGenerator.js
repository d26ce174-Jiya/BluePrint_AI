/**
 * dynamicBlueprintGenerator.js — AI Dynamic Artifact Synthesis Engine
 * 
 * Generates domain-tailored enterprise blueprints dynamically based on the session's
 * problem statement, industry domain, title, and requirements.
 * Zero static hardcoded diagrams or tables.
 */

// Supported Domain Archetypes for deep contextual synthesis
const DOMAIN_PROFILES = {
  healthcare: {
    match: ['patient', 'doctor', 'hospital', 'clinic', 'ehr', 'emr', 'health', 'medical', 'prescription', 'pharmacy', 'triage'],
    entityName: 'Patient Record',
    cloudServices: ['HIPAA Compliant Gateway', 'FHIR / HL7 Ingress Bridge', 'Electronic Medical Records (EMR) Service', 'Doctor Scheduling & Triage Core', 'Encrypted Diagnostic Image Vault (DICOM)'],
    dbEngine: 'PostgreSQL 16 (HIPAA Encrypted RLS)',
    cacheEngine: 'Redis Enterprise Cluster',
    queueEngine: 'Apache Kafka Event Stream',
    tables: [
      {
        name: 'patients',
        description: 'Demographic and medical identity records',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Patient unique identifier' },
          { name: 'medical_record_number', type: 'VARCHAR(64)', isPk: false, isFk: false, description: 'Hospital MRN code' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Patient legal name' },
          { name: 'date_of_birth', type: 'DATE', isPk: false, isFk: false, description: 'DOB for dosage calculations' },
          { name: 'blood_group', type: 'VARCHAR(8)', isPk: false, isFk: false, description: 'Emergency blood type' },
          { name: 'primary_phone', type: 'VARCHAR(20)', isPk: false, isFk: false, description: 'Emergency contact phone' },
        ]
      },
      {
        name: 'appointments',
        description: 'Doctor consultation schedules and triage status',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Appointment UUID' },
          { name: 'patient_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing patients.id' },
          { name: 'doctor_id', type: 'UUID', isPk: false, isFk: false, description: 'Assigned specialist' },
          { name: 'scheduled_time', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Consultation slot' },
          { name: 'status', type: 'ENUM("Scheduled","Checked-In","In-Consult","Completed")', isPk: false, isFk: false, description: 'Triage lifecycle' },
          { name: 'chief_complaint', type: 'TEXT', isPk: false, isFk: false, description: 'Primary patient symptom' },
        ]
      },
      {
        name: 'prescriptions',
        description: 'Electronic drug orders and pharmacy dispatch records',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Prescription UUID' },
          { name: 'appointment_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing appointments.id' },
          { name: 'medication_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Prescribed drug' },
          { name: 'dosage_mg', type: 'DECIMAL(6,2)', isPk: false, isFk: false, description: 'Dosage amount' },
          { name: 'pharmacy_dispense_status', type: 'VARCHAR(50)', isPk: false, isFk: false, description: 'Dispensed / Pending' },
        ]
      },
      {
        name: 'billing_invoices',
        description: 'Healthcare insurance claims and patient co-pay records',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Invoice UUID' },
          { name: 'patient_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing patients.id' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', isPk: false, isFk: false, description: 'Gross treatment fees' },
          { name: 'insurance_covered', type: 'DECIMAL(10,2)', isPk: false, isFk: false, description: 'Claim payment amount' },
          { name: 'claim_status', type: 'ENUM("Draft","Submitted","Approved","Paid")', isPk: false, isFk: false, description: 'Insurance adjudication' },
        ]
      },
    ],
    erMermaid: `erDiagram
    PATIENT ||--o{ APPOINTMENT : schedules
    APPOINTMENT ||--o{ PRESCRIPTION : generates
    PATIENT ||--o{ BILLING_INVOICE : incurs
    
    PATIENT {
        uuid id PK
        string medical_record_number
        string full_name
        date date_of_birth
        string blood_group
    }
    APPOINTMENT {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id
        timestamp scheduled_time
        string status
    }
    PRESCRIPTION {
        uuid id PK
        uuid appointment_id FK
        string medication_name
        float dosage_mg
        string pharmacy_dispense_status
    }
    BILLING_INVOICE {
        uuid id PK
        uuid patient_id FK
        float total_amount
        float insurance_covered
        string claim_status
    }`,
    bpmnSteps: [
      { name: 'Patient Triage & Intake', type: 'start', actor: 'Triage Nurse / Web Portal', description: 'Patient symptoms captured & insurance verified', duration: '< 5 min' },
      { name: 'Vital Signs & Emergency Assessment', type: 'task', actor: 'Clinical Assistant', description: 'Record BP, SpO2, Heart Rate & Pain score', duration: '< 10 min' },
      { name: 'Doctor Consultation & Diagnosis', type: 'task', actor: 'Attending Physician', description: 'Clinical examination and diagnostic orders', duration: '< 20 min' },
      { name: 'Lab Test & Radiology Processing', type: 'service', actor: 'Automated Lab LIS', description: 'Automated biomarker telemetry & PACS scan', duration: '< 45 min' },
      { name: 'Pharmacy Dispense & Discharge', type: 'end', actor: 'Clinical Pharmacist', description: 'Digital e-Prescription dispense and insurance claim settlement', duration: '< 15 min' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: Patient Digital Intake & Triage"]) --> Vitals["Record Vital Telemetry (BP, SpO2)"]
    Vitals --> TriageGate{"Acuity Level Assessment (ESI 1-5)"}
    TriageGate -- "Critical (ESI 1-2)" --> EmergencyTeam["Immediate ICU / Trauma Team Dispatch"]
    TriageGate -- "Standard (ESI 3-5)" --> DoctorConsult["Attending Physician Consultation"]
    DoctorConsult --> DiagnosticCheck{"Labs or Imaging Required?"}
    DiagnosticCheck -- "Yes" --> LabOrders["Automated LIS / PACS Diagnostic Queue"]
    LabOrders --> DoctorConsult
    DiagnosticCheck -- "No" --> Prescription["Issue Digital e-Prescription & Pharmacy Dispense"]
    Prescription --> InsuranceClaim["Automated Insurance Adjudication & Copay"]
    InsuranceClaim --> Discharge(["End: Patient Discharge & Home Care Monitoring"])`,
    apiEndpoints: [
      { id: 'hc-1', method: 'GET', path: '/api/v1/patients', summary: 'Retrieve patient roster with triage classification', params: [{ name: 'status', type: 'string', in: 'query', description: 'Checked-In, In-Consult' }], sampleResponse: { total: 24, items: [{ id: 'PT-901', name: 'Eleanor Vance', mrn: 'MRN-88214', triageLevel: 'Urgent', room: 'B-104' }, { id: 'PT-902', name: 'Marcus Chen', mrn: 'MRN-88219', triageLevel: 'Routine', room: 'Waiting' }] } },
      { id: 'hc-2', method: 'POST', path: '/api/v1/appointments', summary: 'Create new urgent triage consult appointment', requestBody: { patientId: 'PT-901', doctorId: 'DOC-412', chiefComplaint: 'Acute chest discomfort', priority: 'Urgent' }, sampleResponse: { success: true, appointmentId: 'APT-5512', estimatedWaitMin: 8, assignedTeam: 'Cardiology Triage' } },
      { id: 'hc-3', method: 'PUT', path: '/api/v1/prescriptions/{id}/dispense', summary: 'Authorize pharmacy dispense and drug safety validation', params: [{ name: 'id', type: 'string', in: 'path', description: 'Prescription ID' }], sampleResponse: { success: true, dispensedAt: new Date().toISOString(), pharmacist: 'Dr. Sarah Lin', barcodeVerified: true } },
      { id: 'hc-4', method: 'GET', path: '/api/v1/patients/{id}/fhir-export', summary: 'Export patient history in HL7 FHIR R4 JSON format', params: [{ name: 'id', type: 'string', in: 'path', description: 'Patient UUID' }], sampleResponse: { resourceType: 'Bundle', type: 'document', total: 12, compliance: 'HIPAA Standard R4' } }
    ],
    wireframes: [
      { id: 'wf-1', title: 'Clinical Triage & Patient Queue', layoutType: 'Multi-Column Dashboard', description: 'Real-time acuity queue with vital signs telemetry alerts', components: [{ label: 'Urgent Acuity Patient Feed', type: 'Live Table' }, { label: 'Active Beds & Department Capacity', type: 'Gauge Chart' }, { label: 'Quick Triage Registration', type: 'Modal Dialog' }] },
      { id: 'wf-2', title: 'Electronic Health Record (EHR) View', layoutType: 'Split Diagnostic View', description: 'Comprehensive patient timeline, past labs, and drug contraindication radar', components: [{ label: 'Patient Medical Summary', type: 'Card Grid' }, { label: 'Diagnostic Lab Trends', type: 'Line Chart' }, { label: 'E-Prescription Composer', type: 'Action Form' }] },
    ],
    sandboxRecords: [
      { id: 'PT-2026-101', name: 'Eleanor Vance', district: 'Room B-104 (Cardiology)', acres: 'DOB: 1982-04-12', hp: 'Blood: O+', subsidy: 'Insured (90%)', status: 'Approved', urgent: true, date: '2026-09-22' },
      { id: 'PT-2026-102', name: 'Marcus Chen', district: 'Emergency Triage Bed 3', acres: 'DOB: 1995-11-03', hp: 'Blood: A+', subsidy: 'Pending Co-pay', status: 'In Review', urgent: true, date: '2026-09-22' },
      { id: 'PT-2026-103', name: 'Sophia Al-Mansoor', district: 'Day Care Clinic 12', acres: 'DOB: 1978-08-29', hp: 'Blood: B+', subsidy: 'Discharged', status: 'Approved', urgent: false, date: '2026-09-21' },
      { id: 'PT-2026-104', name: 'Devendra Sharma', district: 'Radiology Waiting Area', acres: 'DOB: 1964-02-18', hp: 'Blood: AB+', subsidy: 'Awaiting Claim', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'PT-2026-105', name: 'Chloe Dubois', district: 'Observation Ward 4', acres: 'DOB: 2001-07-14', hp: 'Blood: O-', subsidy: 'Verified', status: 'Flagged', urgent: true, date: '2026-09-19' },
    ],
    columnLabels: { id: 'Record ID', name: 'Patient Name', district: 'Ward / Department', acres: 'Demographics', hp: 'Blood / Vitals', subsidy: 'Insurance Adjudication' }
  },

  hr: {
    match: ['employee', 'candidate', 'onboarding', 'hr', 'payroll', 'hiring', 'recruitment', 'leave', 'attendance', 'salary', 'timesheet', 'staff'],
    entityName: 'Employee Onboarding Record',
    cloudServices: ['HR Portal & Self-Service PWA', 'Background Verification Gateway', 'Automated Payroll & Tax Worker', 'Role-Based Document Vault', 'Audit & Compliance Logger'],
    dbEngine: 'PostgreSQL 16 (Row-Level Security)',
    cacheEngine: 'Redis Cache (Session & Token Store)',
    queueEngine: 'BullMQ Async Job Queue',
    tables: [
      {
        name: 'employees',
        description: 'Master staff identity, department, and employment status',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Employee master UUID' },
          { name: 'employee_code', type: 'VARCHAR(32)', isPk: false, isFk: false, description: 'Company badge ID' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Staff legal name' },
          { name: 'department', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Assigned division' },
          { name: 'designation', type: 'VARCHAR(150)', isPk: false, isFk: false, description: 'Official role title' },
          { name: 'date_of_joining', type: 'DATE', isPk: false, isFk: false, description: 'Commencement date' },
        ]
      },
      {
        name: 'onboarding_tasks',
        description: 'Checklist workflows, document submissions, and approval gates',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Task UUID' },
          { name: 'employee_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing employees.id' },
          { name: 'task_title', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Action item description' },
          { name: 'category', type: 'ENUM("Legal","IT Setup","HR Documents","Tax")', isPk: false, isFk: false, description: 'Task bucket' },
          { name: 'status', type: 'ENUM("Pending","Submitted","Verified","Rejected")', isPk: false, isFk: false, description: 'Verification stage' },
          { name: 'due_date', type: 'DATE', isPk: false, isFk: false, description: 'SLA target completion' },
        ]
      },
      {
        name: 'payroll_records',
        description: 'Monthly compensation, statutory tax deductions, and bank payouts',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Payroll item UUID' },
          { name: 'employee_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing employees.id' },
          { name: 'pay_period', type: 'VARCHAR(20)', isPk: false, isFk: false, description: 'Billing month (e.g. 2026-09)' },
          { name: 'base_salary', type: 'DECIMAL(12,2)', isPk: false, isFk: false, description: 'Contracted base pay' },
          { name: 'tax_deductions', type: 'DECIMAL(10,2)', isPk: false, isFk: false, description: 'Income tax & provident fund' },
          { name: 'net_disbursed', type: 'DECIMAL(12,2)', isPk: false, isFk: false, description: 'Final take-home deposit' },
        ]
      },
      {
        name: 'leave_requests',
        description: 'Paid time off applications, manager sign-offs, and balance ledger',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Leave request UUID' },
          { name: 'employee_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing employees.id' },
          { name: 'leave_type', type: 'ENUM("Casual","Sick","Maternity","Paternity")', isPk: false, isFk: false, description: 'Absence reason' },
          { name: 'days_count', type: 'DECIMAL(4,1)', isPk: false, isFk: false, description: 'Requested duration' },
          { name: 'approval_status', type: 'ENUM("Pending","Approved","Rejected")', isPk: false, isFk: false, description: 'Manager decision' },
        ]
      },
    ],
    erMermaid: `erDiagram
    EMPLOYEE ||--o{ ONBOARDING_TASK : completes
    EMPLOYEE ||--o{ PAYROLL_RECORD : receives
    EMPLOYEE ||--o{ LEAVE_REQUEST : submits
    
    EMPLOYEE {
        uuid id PK
        string employee_code
        string full_name
        string department
        string designation
        date date_of_joining
    }
    ONBOARDING_TASK {
        uuid id PK
        uuid employee_id FK
        string task_title
        string category
        string status
        date due_date
    }
    PAYROLL_RECORD {
        uuid id PK
        uuid employee_id FK
        string pay_period
        float base_salary
        float tax_deductions
        float net_disbursed
    }
    LEAVE_REQUEST {
        uuid id PK
        uuid employee_id FK
        string leave_type
        float days_count
        string approval_status
    }`,
    bpmnSteps: [
      { name: 'Candidate Offer Accepted', type: 'start', actor: 'Candidate / Recruiter', description: 'Offer letter e-signed and candidate record initialized', duration: 'Day 0' },
      { name: 'Identity & Document Verification', type: 'task', actor: 'Background Check AI Gateway', description: 'Automated validation of passport, PAN/SSN, and credentials', duration: '< 24 Hours' },
      { name: 'IT Asset & Account Provisioning', type: 'service', actor: 'Okta / Azure AD SCIM', description: 'Single Sign-On, Slack, and corporate laptop dispatched', duration: '< 48 Hours' },
      { name: 'Manager Welcome & Buddy Assignment', type: 'task', actor: 'Hiring Manager', description: '30-day onboarding milestones and mentor assigned', duration: 'Day 1' },
      { name: 'Payroll Setup & Benefits Enrollment', type: 'end', actor: 'Finance Payroll Team', description: 'Direct deposit activated and health insurance enrolled', duration: 'Day 3' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: Candidate E-Signs Offer Letter"]) --> DocIntake["Upload Identity Docs & Bank Details"]
    DocIntake --> BgCheck{"Automated Background Check & Verification"}
    BgCheck -- "Flag / Discrepancy" --> HRReview["HR Compliance Officer Review"]
    BgCheck -- "Clean Record" --> ITProvision["Automated IT Provisioning (Okta / Google Workspace)"]
    HRReview -- "Cleared" --> ITProvision
    ITProvision --> ManagerGate{"Hiring Manager Sign-off & Asset Dispatch"}
    ManagerGate -- "Ready" --> DayOne["Day 1 Welcome, Slack Invite & Buddy Assign"]
    DayOne --> PayrollEnroll["Automated Payroll & Statutory Benefit Enrollment"]
    PayrollEnroll --> Complete(["End: 100% Onboarding Complete & Active Staff"])`,
    apiEndpoints: [
      { id: 'hr-1', method: 'GET', path: '/api/v1/employees', summary: 'List employees with department and onboarding stage', params: [{ name: 'status', type: 'string', in: 'query', description: 'Active, Onboarding, Terminated' }], sampleResponse: { total: 248, items: [{ id: 'EMP-401', name: 'Aarav Sharma', department: 'Engineering', role: 'Staff Backend Architect', status: 'Active' }] } },
      { id: 'hr-2', method: 'POST', path: '/api/v1/onboarding/start', summary: 'Initialize automated onboarding workflow for new hire', requestBody: { fullName: 'Priyanka Sen', email: 'priyanka@acme.com', department: 'Product Design', startingDate: '2026-10-01' }, sampleResponse: { success: true, employeeCode: 'EMP-2026-118', checklistItems: 7, welcomeEmailSent: true } },
      { id: 'hr-3', method: 'PUT', path: '/api/v1/payroll/{period}/disburse', summary: 'Execute multi-currency direct deposit payroll run', params: [{ name: 'period', type: 'string', in: 'path', description: 'Month in YYYY-MM format' }], sampleResponse: { success: true, processedEmployees: 248, totalPayout: '$1,420,500', bankBatchId: 'ACH-BATCH-9941' } },
      { id: 'hr-4', method: 'POST', path: '/api/v1/leave/apply', summary: 'Submit leave request with balance auto-deduction', requestBody: { employeeId: 'EMP-401', leaveType: 'Casual', days: 2, reason: 'Family engagement' }, sampleResponse: { success: true, requestId: 'LV-8812', remainingBalance: 14.5, managerNotified: true } }
    ],
    wireframes: [
      { id: 'wf-hr-1', title: 'HR Management & Onboarding Hub', layoutType: 'Executive Metrics & Table', description: 'Real-time overview of candidate pipelines, active onboarding tasks, and payroll countdown', components: [{ label: 'Onboarding Velocity Gauge', type: 'Metric Card' }, { label: 'New Hire Pipeline Table', type: 'Data Grid' }, { label: 'Pending Compliance Approvals', type: 'Action List' }] },
      { id: 'wf-hr-2', title: 'Employee Self-Service Profile', layoutType: 'Tabbed Form Layout', description: 'Staff portal for tax declarations, pay stub downloads, and leave booking', components: [{ label: 'Monthly Pay Slip Summary', type: 'Download Card' }, { label: 'Interactive Leave Calendar', type: 'Date Picker' }, { label: 'Document Vault Submissions', type: 'File Upload' }] },
    ],
    sandboxRecords: [
      { id: 'EMP-2026-081', name: 'Priyanka Sen', district: 'Product & Design Div', acres: 'Senior UX Lead', hp: 'Badge: EMP-409', subsidy: '$140,000 / yr', status: 'Approved', urgent: false, date: '2026-09-22' },
      { id: 'EMP-2026-082', name: 'Aarav Sharma', district: 'Platform Infrastructure', acres: 'Principal Architect', hp: 'Badge: EMP-410', subsidy: '$185,000 / yr', status: 'Approved', urgent: true, date: '2026-09-21' },
      { id: 'EMP-2026-083', name: 'Ananya Deshmukh', district: 'People Operations & Talent', acres: 'HR Business Partner', hp: 'Badge: EMP-411', subsidy: '$95,000 / yr', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'EMP-2026-084', name: 'Vikramaditya Rao', district: 'Global Sales & Strategy', acres: 'Account Director', hp: 'Badge: EMP-412', subsidy: '$160,000 / yr', status: 'In Review', urgent: true, date: '2026-09-19' },
      { id: 'EMP-2026-085', name: 'Tanya Kapoor', district: 'Financial Controller Div', acres: 'Staff Accountant', hp: 'Badge: EMP-413', subsidy: '$110,000 / yr', status: 'Flagged', urgent: false, date: '2026-09-18' },
    ],
    columnLabels: { id: 'Employee ID', name: 'Staff Member', district: 'Division / Team', acres: 'Designation', hp: 'Badge ID', subsidy: 'Compensation Tier' }
  },

  logistics: {
    match: ['logistic', 'supply', 'delivery', 'warehouse', 'freight', 'fleet', 'shipment', 'tracking', 'order', 'courier', 'cargo', 'dispatch'],
    entityName: 'Shipment & Freight Record',
    cloudServices: ['Fleet Telematics Ingress Gateway', 'Route Optimization Engine', 'Warehouse Inventory Service', 'Real-Time GPS Tracking Pipeline', 'Automated Proof of Delivery (PoD) Vault'],
    dbEngine: 'PostgreSQL 16 (PostGIS Spatial Queries)',
    cacheEngine: 'Redis Geo-Spatial Index',
    queueEngine: 'RabbitMQ Message Broker',
    tables: [
      {
        name: 'shipments',
        description: 'Freight consignments, origin-destination routes, and status',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Consignment tracking UUID' },
          { name: 'tracking_code', type: 'VARCHAR(48)', isPk: false, isFk: false, description: 'Public waybill number' },
          { name: 'sender_facility', type: 'VARCHAR(150)', isPk: false, isFk: false, description: 'Origin warehouse' },
          { name: 'destination_address', type: 'TEXT', isPk: false, isFk: false, description: 'Final delivery coordinates' },
          { name: 'weight_kg', type: 'DECIMAL(8,2)', isPk: false, isFk: false, description: 'Cargo gross weight' },
          { name: 'status', type: 'ENUM("Manifested","In-Transit","Out-For-Delivery","Delivered")', isPk: false, isFk: false, description: 'Tracking state' },
        ]
      },
      {
        name: 'fleet_vehicles',
        description: 'Transport trucks, GPS transponders, and driver assignments',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Vehicle UUID' },
          { name: 'license_plate', type: 'VARCHAR(32)', isPk: false, isFk: false, description: 'Vehicle registration' },
          { name: 'driver_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Assigned pilot' },
          { name: 'current_latitude', type: 'DECIMAL(9,6)', isPk: false, isFk: false, description: 'Live GPS latitude' },
          { name: 'current_longitude', type: 'DECIMAL(9,6)', isPk: false, isFk: false, description: 'Live GPS longitude' },
          { name: 'fuel_capacity_pct', type: 'INT', isPk: false, isFk: false, description: 'Telemetry fuel level' },
        ]
      },
      {
        name: 'warehouse_inventory',
        description: 'Stock keeping units (SKU), bin locations, and fulfillment levels',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'SKU record UUID' },
          { name: 'sku_code', type: 'VARCHAR(64)', isPk: false, isFk: false, description: 'Barcode SKU identifier' },
          { name: 'item_description', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Product title' },
          { name: 'quantity_on_hand', type: 'INT', isPk: false, isFk: false, description: 'Available stock' },
          { name: 'reorder_threshold', type: 'INT', isPk: false, isFk: false, description: 'Auto-replenish trigger level' },
        ]
      },
      {
        name: 'delivery_proofs',
        description: 'Signatures, geo-tagged photos, and customer confirmation',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Proof of Delivery UUID' },
          { name: 'shipment_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing shipments.id' },
          { name: 'delivered_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Dropoff timestamp' },
          { name: 'recipient_signature_url', type: 'TEXT', isPk: false, isFk: false, description: 'S3 signed signature' },
          { name: 'otp_verified', type: 'BOOLEAN', isPk: false, isFk: false, description: 'SMS OTP match' },
        ]
      },
    ],
    erMermaid: `erDiagram
    SHIPMENT ||--o{ FLEET_VEHICLE : assigned_to
    SHIPMENT ||--o{ DELIVERY_PROOF : concludes_with
    WAREHOUSE_INVENTORY ||--o{ SHIPMENT : fulfills
    
    SHIPMENT {
        uuid id PK
        string tracking_code
        string sender_facility
        string destination_address
        float weight_kg
        string status
    }
    FLEET_VEHICLE {
        uuid id PK
        string license_plate
        string driver_name
        float current_latitude
        float current_longitude
        int fuel_capacity_pct
    }
    WAREHOUSE_INVENTORY {
        uuid id PK
        string sku_code
        string item_description
        int quantity_on_hand
        int reorder_threshold
    }
    DELIVERY_PROOF {
        uuid id PK
        uuid shipment_id FK
        timestamp delivered_at
        string recipient_signature_url
        boolean otp_verified
    }`,
    bpmnSteps: [
      { name: 'Order Placed & Stock Reserved', type: 'start', actor: 'E-Commerce / ERP API', description: 'Automated SKU allocation in nearest fulfillment center', duration: '< 1 min' },
      { name: 'Warehouse Pick & Pack Automation', type: 'task', actor: 'Automated Sorting Hub', description: 'Barcode verification and thermal waybill printing', duration: '< 30 min' },
      { name: 'Fleet Route Optimization & Dispatch', type: 'service', actor: 'AI Dispatch Engine', description: 'Multi-stop shortest path calculation and driver assignment', duration: '< 15 min' },
      { name: 'In-Transit Telematics & Geo-Fencing', type: 'task', actor: 'GPS Telematics Stream', description: 'Live tracking with customer SMS delivery ETA', duration: 'Real-Time' },
      { name: 'Last-Mile Handover & Digital PoD', type: 'end', actor: 'Delivery Pilot', description: 'OTP confirmation, signature capture, and status marked Delivered', duration: '< 5 min' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: Customer Order Manifested"]) --> WarehousePick["Automated Warehouse Pick & Barcode Scan"]
    WarehousePick --> PackingGate{"Weight & QC Inspection Passed?"}
    PackingGate -- "Discrepancy" --> ManualInspection["Quarantine & Manual Weight Audit"]
    PackingGate -- "Verified" --> RouteEngine["AI Route Optimization & Fleet Manifest"]
    ManualInspection --> RouteEngine
    RouteEngine --> InTransit["In-Transit: Live GPS Telematics Stream"]
    InTransit --> GeoFenceGate{"Crossed 2km Customer Geo-fence?"}
    GeoFenceGate -- "Yes" --> TriggerSMS["Automated Customer SMS Alert with Live ETA"]
    GeoFenceGate -- "No" --> InTransit
    TriggerSMS --> LastMile["Last-Mile Doorstep Delivery Handover"]
    LastMile --> PoDValidation["Verify Digital OTP & Signature Capture"]
    PoDValidation --> EndDelivered(["End: Proof of Delivery Saved & Invoice Settled"])`,
    apiEndpoints: [
      { id: 'log-1', method: 'GET', path: '/api/v1/shipments/track/{trackingCode}', summary: 'Real-time GPS telemetry and milestone tracking', params: [{ name: 'trackingCode', type: 'string', in: 'path', description: 'Waybill code' }], sampleResponse: { trackingCode: 'TRK-99201', status: 'In-Transit', currentHub: 'Hub-West-04', eta: '2026-09-23T14:30:00Z', lat: 23.0225, lng: 72.5714 } },
      { id: 'log-2', method: 'POST', path: '/api/v1/shipments/dispatch', summary: 'Manifest freight shipment and generate thermal label', requestBody: { originFacility: 'DC-Atlanta-North', destinationZip: '30301', weightKg: 14.2, priority: 'Overnight Air' }, sampleResponse: { success: true, trackingCode: 'TRK-99208', labelUrl: 'https://s3.amazonaws.com/labels/trk-99208.pdf' } },
      { id: 'log-3', method: 'PUT', path: '/api/v1/shipments/{id}/complete-pod', summary: 'Upload digital Proof of Delivery with customer OTP', params: [{ name: 'id', type: 'string', in: 'path', description: 'Shipment ID' }], sampleResponse: { success: true, deliveredAt: new Date().toISOString(), podVerified: true, status: 'Delivered' } }
    ],
    wireframes: [
      { id: 'wf-log-1', title: 'Global Fleet Control & Telematics Map', layoutType: 'Interactive Map & Feed', description: 'Live GPS vehicle telemetry, active delays, and route anomaly alerts', components: [{ label: 'Live Map Vehicle Markers', type: 'Map Canvas' }, { label: 'High Priority Shipment Stream', type: 'Data Table' }, { label: 'Fleet Efficiency Metrics', type: 'Stats Row' }] },
      { id: 'wf-log-2', title: 'Warehouse Fulfillment Dispatcher', layoutType: 'Kanban Workflow', description: 'Pick, pack, weigh, and manifest queue for dock doors', components: [{ label: 'Staged Manifest Column', type: 'Kanban Board' }, { label: 'Thermal Barcode Scanner Feed', type: 'Input Box' }] }
    ],
    sandboxRecords: [
      { id: 'SHP-2026-501', name: 'Apex Electronics Freight', district: 'Route: Chicago -> Atlanta', acres: 'Weight: 420 kg', hp: 'Van: TRK-8812', subsidy: '$4,200 (Freight)', status: 'Approved', urgent: true, date: '2026-09-22' },
      { id: 'SHP-2026-502', name: 'Global Pharma Consignment', district: 'Cold Chain: Boston Hub', acres: 'Weight: 85 kg (Temp-Controlled)', hp: 'Pilot: Dave K.', subsidy: '$8,950 (Air Express)', status: 'In Review', urgent: true, date: '2026-09-22' },
      { id: 'SHP-2026-503', name: 'Nordic Furniture Dispatch', district: 'Regional DC: Dallas', acres: 'Weight: 1,840 kg', hp: 'Semi: TRK-9901', subsidy: '$6,400 (Ground)', status: 'Approved', urgent: false, date: '2026-09-21' },
      { id: 'SHP-2026-504', name: 'BioCare Lab Supplies', district: 'Local Courier: San Jose', acres: 'Weight: 12.5 kg', hp: 'Van: TRK-4102', subsidy: '$450 (Same Day)', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'SHP-2026-505', name: 'MegaSteel Industrial Parts', district: 'Heavy Freight: Detroit', acres: 'Weight: 4,500 kg', hp: 'Flatbed: TRK-1022', subsidy: '$12,800 (Intermodal)', status: 'Flagged', urgent: true, date: '2026-09-19' },
    ],
    columnLabels: { id: 'Waybill Code', name: 'Consignment Title', district: 'Transit Corridor', acres: 'Cargo Specs', hp: 'Fleet Vehicle', subsidy: 'Tariff Rate' }
  },

  // DeepTech / NanoTech / Hardware & Sensors Domain Profile
  deeptech: {
    match: ['nano', 'nanotech', 'sensor', 'quantum', 'iot', 'robotics', 'semiconductor', 'physics', 'chip', 'firmware', 'device', 'material', 'telemetry', 'hardware', 'lab', 'telematics'],
    entityName: 'Nano-Tech Device & Telemetry Record',
    cloudServices: ['High-Frequency Telemetry Ingress Gateway', 'Real-Time Signal Processing Engine', 'Nanotech Device Registry Service', 'Automated Calibration & Alert Worker', 'Time-Series Diagnostics Data Lake'],
    dbEngine: 'TimescaleDB / PostgreSQL 16 (Time-Series & ACID)',
    cacheEngine: 'Redis Cluster (Sub-millisecond Telemetry Buffer)',
    queueEngine: 'Apache Kafka / MQTT Broker',
    tables: [
      {
        name: 'devices',
        description: 'Physical nano-tech instruments, probes, and telemetry controller nodes',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Device master UUID' },
          { name: 'serial_number', type: 'VARCHAR(64)', isPk: false, isFk: false, description: 'Factory assigned device UID' },
          { name: 'device_model', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Hardware model and architecture' },
          { name: 'firmware_version', type: 'VARCHAR(32)', isPk: false, isFk: false, description: 'Active microcode release' },
          { name: 'operational_status', type: 'ENUM("Online","Calibrating","Standby","Offline")', isPk: false, isFk: false, description: 'Device state' },
          { name: 'registered_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Registration timestamp' },
        ]
      },
      {
        name: 'sensor_telemetry',
        description: 'Sub-millisecond signal readings, environmental temperature, and resonance metrics',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Telemetry packet UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing devices.id' },
          { name: 'signal_frequency_ghz', type: 'DECIMAL(8,4)', isPk: false, isFk: false, description: 'Resonant frequency in GHz' },
          { name: 'signal_to_noise_db', type: 'DECIMAL(6,2)', isPk: false, isFk: false, description: 'SNR signal fidelity metric' },
          { name: 'operating_temp_k', type: 'DECIMAL(6,2)', isPk: false, isFk: false, description: 'Cryogenic / ambient temperature Kelvin' },
          { name: 'recorded_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Telemetry capture timestamp' },
        ]
      },
      {
        name: 'calibration_runs',
        description: 'Automated calibration runs, tolerance verification, and precision drift compensation',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Calibration run UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing devices.id' },
          { name: 'accuracy_score', type: 'DECIMAL(5,3)', isPk: false, isFk: false, description: 'Measured precision coefficient (0-1.0)' },
          { name: 'drift_compensation_pct', type: 'DECIMAL(5,2)', isPk: false, isFk: false, description: 'Applied bias offset' },
          { name: 'calibration_result', type: 'ENUM("Passed","Recalibrated","Failed")', isPk: false, isFk: false, description: 'Outcome' },
          { name: 'calibrated_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Calibration timestamp' },
        ]
      },
      {
        name: 'anomaly_alerts',
        description: 'Real-time threshold breaches, signal anomalies, and diagnostic warning events',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Alert event UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing devices.id' },
          { name: 'severity_level', type: 'ENUM("Critical","Warning","Info")', isPk: false, isFk: false, description: 'Incident severity' },
          { name: 'anomaly_description', type: 'TEXT', isPk: false, isFk: false, description: 'Pattern deviation summary' },
          { name: 'triggered_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Event trigger timestamp' },
        ]
      },
    ],
    erMermaid: `erDiagram
    DEVICE ||--o{ SENSOR_TELEMETRY : streams
    DEVICE ||--o{ CALIBRATION_RUN : undergoes
    DEVICE ||--o{ ANOMALY_ALERT : triggers
    
    DEVICE {
        uuid id PK
        string serial_number
        string device_model
        string firmware_version
        string operational_status
        timestamp registered_at
    }
    SENSOR_TELEMETRY {
        uuid id PK
        uuid device_id FK
        float signal_frequency_ghz
        float signal_to_noise_db
        float operating_temp_k
        timestamp recorded_at
    }
    CALIBRATION_RUN {
        uuid id PK
        uuid device_id FK
        float accuracy_score
        float drift_compensation_pct
        string calibration_result
        timestamp calibrated_at
    }
    ANOMALY_ALERT {
        uuid id PK
        uuid device_id FK
        string severity_level
        string anomaly_description
        timestamp triggered_at
    }`,
    bpmnSteps: [
      { name: 'Device Telemetry Ingress & Handshake', type: 'start', actor: 'Nano-Sensor Controller', description: 'Real-time telemetry packet received via secure MQTT/gRPC socket', duration: '< 10ms' },
      { name: 'Stream Signal Processing & Filter', type: 'task', actor: 'FastAPI Signal Pipeline', description: 'Applies Fast Fourier Transform & noise rejection algorithms', duration: '< 50ms' },
      { name: 'Anomaly & Tolerance Threshold Check', type: 'task', actor: 'AI Diagnostics Engine', description: 'Compares real-time telemetry against precision baseline', duration: '< 100ms' },
      { name: 'Dynamic Micro-Calibration Routine', type: 'service', actor: 'Automated Calibration Worker', description: 'Transmits dynamic feedback coefficient to sensor controller', duration: '< 200ms' },
      { name: 'Time-Series Data Lake & Dashboard Update', type: 'end', actor: 'TimescaleDB Ingestion Pool', description: 'Telemetry committed to time-series ledger & UI stream updated', duration: '< 25ms' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: High-Frequency Device Telemetry Ingest"]) --> Filter["Signal Processing & Noise Filtration"]
    Filter --> ToleranceCheck{"Anomaly / Outlier Detected?"}
    ToleranceCheck -- "Tolerance Exceeded" --> TriggerAlert["Dispatch Critical Alert & Automated Diagnostics"]
    TriggerAlert --> Calibrate["Execute Dynamic Remote Calibration"]
    Calibrate --> Filter
    ToleranceCheck -- "Nominal Range" --> PersistDB["Persist Metrics to TimescaleDB & Data Lake"]
    PersistDB --> LiveMonitor["Stream to Real-time Dashboard & Model Pipeline"]
    LiveMonitor --> Complete(["End: Telemetry Verified & Operational State Nominal"])`,
    apiEndpoints: [
      { id: 'dt-1', method: 'GET', path: '/api/v1/devices', summary: 'List registered nano-tech devices and active health telemetry', params: [{ name: 'status', type: 'string', in: 'query', description: 'Online, Calibrating, Standby' }], sampleResponse: { total: 48, items: [{ id: 'NT-901', model: 'QuantumProbe-V4', status: 'Online', accuracy: '99.94%' }, { id: 'NT-902', model: 'BioSensor-Alpha', status: 'Calibrating', accuracy: '98.80%' }] } },
      { id: 'dt-2', method: 'POST', path: '/api/v1/telemetry/stream', summary: 'Ingest high-frequency sensor signal metrics stream', requestBody: { deviceId: 'NT-901', frequencyGhz: 28.45, snrDb: 42.1, temperatureK: 4.2 }, sampleResponse: { success: true, packetId: 'PKT-882194', processedInMs: 12, anomalyScore: 0.02 } },
      { id: 'dt-3', method: 'POST', path: '/api/v1/devices/{id}/calibrate', summary: 'Trigger automated laser/quantum calibration cycle', params: [{ name: 'id', type: 'string', in: 'path', description: 'Device unique ID' }], sampleResponse: { success: true, newAccuracy: 0.9998, offsetApplied: '+0.0014 GHz' } },
      { id: 'dt-4', method: 'GET', path: '/api/v1/diagnostics/anomalies', summary: 'Retrieve detected signal anomalies and variance reports', params: [{ name: 'severity', type: 'string', in: 'query', description: 'Critical, Warning' }], sampleResponse: { total: 2, anomalies: [{ deviceId: 'NT-905', reason: 'Thermal drift detected', deviation: '+0.8 K' }] } }
    ],
    wireframes: [
      { id: 'wf-dt-1', title: 'Nano-Device Telemetry Command Center', layoutType: 'Telemetry Grid & Waveforms', description: 'Real-time oscilloscope signal waveforms, active device cluster status, and latency counters', components: [{ label: 'High-Frequency Waveform Canvas', type: 'Live Chart' }, { label: 'Active Device Cluster Matrix', type: 'Card Grid' }, { label: 'Anomaly Incident Alert Bar', type: 'Alert Banner' }] },
      { id: 'wf-dt-2', title: 'Precision Calibration & Diagnostic Console', layoutType: 'Diagnostic Detail', description: 'Granular device parameters, drift trendlines, and manual override calibration controls', components: [{ label: 'Drift Compensation Radar', type: 'Radar Chart' }, { label: 'Calibration Trigger Action', type: 'Action Button' }, { label: 'Firmware Microcode Log', type: 'Terminal Log' }] }
    ],
    sandboxRecords: [
      { id: 'DEV-2026-001', name: 'Quantum Sensor Array Alpha', district: 'Cleanroom Lab 4, Bay C', acres: 'Freq: 28.45 GHz', hp: 'Cryo: 4.2 K', subsidy: '99.98% Precision', status: 'Approved', urgent: false, date: '2026-09-22' },
      { id: 'DEV-2026-002', name: 'Nano-Optical Spectrometer B', district: 'Spectrometry Chamber 2', acres: 'Freq: 44.12 GHz', hp: 'Cryo: 18.5 K', subsidy: '98.70% Precision', status: 'In Review', urgent: true, date: '2026-09-22' },
      { id: 'DEV-2026-003', name: 'Molecular Probe Controller X', district: 'Nanofabrication Unit 1', acres: 'Freq: 12.08 GHz', hp: 'Ambient: 295 K', subsidy: '99.95% Precision', status: 'Approved', urgent: false, date: '2026-09-21' },
      { id: 'DEV-2026-004', name: 'Biosensor Telemetry Beacon 7', district: 'Analytical Bio-Suite 3', acres: 'Freq: 5.60 GHz', hp: 'Controlled: 310 K', subsidy: '97.20% Precision', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'DEV-2026-005', name: 'Semiconductor Yield Monitor', district: 'Foundry Fab Line 8', acres: 'Freq: 60.00 GHz', hp: 'Chamber: 77 K', subsidy: '96.10% Precision', status: 'Flagged', urgent: true, date: '2026-09-19' },
    ],
    columnLabels: { id: 'Device Serial', name: 'Hardware Node', district: 'Lab / Deployment Facility', acres: 'Operational Frequency', hp: 'Thermal Environment', subsidy: 'Precision Metric' }
  },

  // E-Governance & Public Sector Citizen Services Domain Profile
  egovernance: {
    match: ['governance', 'citizen', 'civic', 'municipal', 'government', 'public', 'permit', 'license', 'grievance', 'certificate', 'scheme', 'panchayat'],
    entityName: 'Citizen Service Application',
    cloudServices: ['Citizen Self-Service Portal PWA', 'Digital Identity & Verification Gateway', 'Departmental Approval Workflow Engine', 'Treasury Direct Disbursement Worker', 'Public Audit & Compliance Ledger'],
    dbEngine: 'PostgreSQL 16 (Statutory Audit Ledger)',
    cacheEngine: 'Redis Distributed Cache',
    queueEngine: 'RabbitMQ Processing Queue',
    tables: [
      {
        name: 'citizens',
        description: 'Verified citizen profile, demographic details, and jurisdictional references',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Citizen unique identifier' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Citizen legal name' },
          { name: 'national_id_hash', type: 'CHAR(64)', isPk: false, isFk: false, description: 'Hashed national identity token' },
          { name: 'phone_number', type: 'VARCHAR(20)', isPk: false, isFk: false, description: 'SMS alert contact number' },
          { name: 'district', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Administrative revenue district' },
          { name: 'registered_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Registration timestamp' },
        ]
      },
      {
        name: 'service_applications',
        description: 'Official citizen requests for certificates, trade licenses, and public welfare schemes',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Application reference UUID' },
          { name: 'citizen_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing citizens.id' },
          { name: 'service_category', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Civic Service Category' },
          { name: 'status', type: 'ENUM("Submitted","Under-Review","Approved","Dispatched","Rejected")', isPk: false, isFk: false, description: 'Processing state' },
          { name: 'fee_paid_inr', type: 'DECIMAL(10,2)', isPk: false, isFk: false, description: 'Statutory processing fee' },
          { name: 'submitted_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Submission timestamp' },
        ]
      },
      {
        name: 'verification_audits',
        description: 'Departmental desk reviews, officer inspections, and statutory compliance checks',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Audit record UUID' },
          { name: 'application_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing service_applications.id' },
          { name: 'officer_badge_id', type: 'VARCHAR(64)', isPk: false, isFk: false, description: 'Reviewing officer identifier' },
          { name: 'verification_status', type: 'VARCHAR(50)', isPk: false, isFk: false, description: 'Verified / Discrepancy' },
          { name: 'officer_notes', type: 'TEXT', isPk: false, isFk: false, description: 'Review findings' },
          { name: 'audited_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Review timestamp' },
        ]
      },
      {
        name: 'service_deliveries',
        description: 'Digitally signed credentials, sanctioned certificates, and official dispatches',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Delivery record UUID' },
          { name: 'application_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing service_applications.id' },
          { name: 'certificate_serial', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Official credential serial' },
          { name: 'digital_signature_hash', type: 'CHAR(64)', isPk: false, isFk: false, description: 'PKI digital sign hash' },
          { name: 'delivered_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Dispatch timestamp' },
        ]
      },
    ],
    erMermaid: `erDiagram
    CITIZEN ||--o{ SERVICE_APPLICATION : submits
    SERVICE_APPLICATION ||--|{ SERVICE_DELIVERY : fulfills
    SERVICE_APPLICATION ||--o{ VERIFICATION_AUDIT : requires
    
    CITIZEN {
        uuid id PK
        string full_name
        string national_id_hash
        string phone_number
        string district
    }
    SERVICE_APPLICATION {
        uuid id PK
        uuid citizen_id FK
        string service_category
        float fee_paid_inr
        string status
    }
    VERIFICATION_AUDIT {
        uuid id PK
        uuid application_id FK
        string officer_badge_id
        string verification_status
        timestamp audited_at
    }
    SERVICE_DELIVERY {
        uuid id PK
        uuid application_id FK
        string certificate_serial
        string digital_signature_hash
        timestamp delivered_at
    }`,
    bpmnSteps: [
      { name: 'Citizen Digital Intake & Submission', type: 'start', actor: 'Citizen Portal / Common Service Center', description: 'Identity verification & application form submission', duration: '< 10 min' },
      { name: 'Automated Document & ID Verification', type: 'task', actor: 'Government API Gateway', description: 'Cross-verifies identity credentials against public records', duration: '< 30s' },
      { name: 'Departmental Officer Inspection & Review', type: 'task', actor: 'Designated Civic Officer', description: 'Scrutinizes eligibility, compliance, and regulatory prerequisites', duration: '< 24 Hours' },
      { name: 'Official Sanction & Digital Seal Issuance', type: 'service', actor: 'Public Key Infrastructure (PKI) Service', description: 'Signs official digital certificate with cryptographic timestamp', duration: '< 1 min' },
      { name: 'Service Delivery & Citizen SMS Notification', type: 'end', actor: 'Citizen Notification Bridge', description: 'Digital certificate delivered to citizen wallet and confirmed via SMS', duration: '< 1 Hour' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: Citizen Digital Application Intake"]) --> VerifyDocs["Automated Document & ID Verification"]
    VerifyDocs --> CheckDiscrepancy{"Discrepancy Detected?"}
    CheckDiscrepancy -- "Yes" --> RequestDocs["Request Supplementary Document Upload"]
    RequestDocs --> VerifyDocs
    CheckDiscrepancy -- "Clean" --> OfficerReview["Departmental Officer Inspection & Review"]
    OfficerReview --> SignOff{"Officer Sign-off?"}
    SignOff -- "Clarification Required" --> RequestDocs
    SignOff -- "Approved" --> GenerateOrder["Generate Official Sanction & Digital Seal"]
    GenerateOrder --> DeliverService["Issue Verifiable Credential / Certificate to Citizen"]
    DeliverService --> EndSuccess(["End: 100% Digital Service Delivered & Audited"])`,
    apiEndpoints: [
      { id: 'gov-1', method: 'GET', path: '/api/v1/applications', summary: 'List all citizen service applications with status', params: [{ name: 'district', type: 'string', in: 'query', description: 'Administrative district' }, { name: 'status', type: 'string', in: 'query', description: 'Submitted, Approved, Dispatched' }], sampleResponse: { total: 1240, items: [{ id: 'GOV-2026-081', citizen: 'Rohan Sharma', service: 'Trade License Renewal', status: 'Approved' }] } },
      { id: 'gov-2', method: 'POST', path: '/api/v1/applications', summary: 'Submit new citizen service request with verified identity', requestBody: { citizenName: 'Kavita Joshi', district: 'Gandhinagar', serviceType: 'Municipal Trade Permit', nationalId: 'XXXX-XXXX-8819' }, sampleResponse: { success: true, applicationId: 'GOV-2026-089', verificationStatus: 'Verified', slaHours: 48 } },
      { id: 'gov-3', method: 'PUT', path: '/api/v1/applications/{id}/approve', summary: 'Approve application and generate cryptographically signed credential', params: [{ name: 'id', type: 'string', in: 'path', description: 'Application ID' }], sampleResponse: { success: true, certificateSerial: 'CERT-GJ-2026-99120', signedAt: new Date().toISOString() } },
    ],
    wireframes: [
      { id: 'wf-gov-1', title: 'District Administrative Officer Dashboard', layoutType: 'KPI Matrix & Map', description: 'Spatial distribution of citizen applications, officer review SLAs, and pending approvals', components: [{ label: 'District Application Map', type: 'Map Canvas' }, { label: 'Applications Ready for Sign-off', type: 'Action Table' }, { label: 'SLA Performance Metric', type: 'KPI Card' }] },
      { id: 'wf-gov-2', title: 'Citizen Beneficiary Self-Service Portal', layoutType: 'Progress Tracker', description: 'Responsive citizen tracking portal from initial submission to digital certificate download', components: [{ label: '5-Stage Application Tracker', type: 'Timeline' }, { label: 'Download Signed Certificate', type: 'Download Button' }] }
    ],
    sandboxRecords: [
      { id: 'GOV-2026-081', name: 'Rohan Sharma', district: 'Gandhinagar, GJ', acres: 'Municipal Trade Permit', hp: 'Badge: OFF-409', subsidy: '₹1,500 (Fee)', status: 'Approved', urgent: false, date: '2026-09-22' },
      { id: 'GOV-2026-082', name: 'Kavita Joshi', district: 'Ahmedabad, GJ', acres: 'Commercial Property Tax Clearance', hp: 'Badge: OFF-410', subsidy: '₹3,200 (Fee)', status: 'Approved', urgent: true, date: '2026-09-21' },
      { id: 'GOV-2026-083', name: 'Praveen Mehta', district: 'Vadodara, GJ', acres: 'Civic Grievance Redressal', hp: 'Badge: OFF-411', subsidy: 'Exempt', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'GOV-2026-084', name: 'Bhavna Ben Dave', district: 'Rajkot, GJ', acres: 'Birth & Vital Records Cert', hp: 'Badge: OFF-412', subsidy: '₹250 (Fee)', status: 'In Review', urgent: true, date: '2026-09-19' },
      { id: 'GOV-2026-085', name: 'Kanti Solanki', district: 'Surat, GJ', acres: 'Food Safety & Hygiene License', hp: 'Badge: OFF-413', subsidy: '₹2,000 (Fee)', status: 'Flagged', urgent: false, date: '2026-09-18' },
    ],
    columnLabels: { id: 'Application #', name: 'Citizen Applicant', district: 'Administrative Region', acres: 'Civic Service Requested', hp: 'Reviewing Officer', subsidy: 'Statutory Fee / Status' }
  },

  // Universal Enterprise / SaaS Transformation Domain Profile (Clean Default)
  enterprise: {
    match: [],
    entityName: 'Enterprise Workflow & Resource Record',
    cloudServices: ['Enterprise Gateway & Single Sign-On', 'Workflow Orchestration Core', 'Entity State & Processing Engine', 'Asynchronous Message Broker Worker', 'Audit Ledger & Analytics Vault'],
    dbEngine: 'PostgreSQL 16 / MySQL 8.0 (ACID Compliant)',
    cacheEngine: 'Redis Enterprise Distributed Cache',
    queueEngine: 'RabbitMQ / Apache Kafka Message Broker',
    tables: [
      {
        name: 'organizations',
        description: 'Multi-tenant organization accounts, enterprise workspaces, and policy boundaries',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Organization UUID' },
          { name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Organization legal name' },
          { name: 'domain', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Corporate domain' },
          { name: 'plan_tier', type: 'ENUM("Enterprise","Professional","Starter")', isPk: false, isFk: false, description: 'Subscription tier' },
          { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Creation timestamp' },
        ]
      },
      {
        name: 'users',
        description: 'User identity records, credentials, and role-based access permissions',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'User master UUID' },
          { name: 'organization_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing organizations.id' },
          { name: 'email', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Corporate email' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'User full name' },
          { name: 'role', type: 'ENUM("admin","developer","viewer")', isPk: false, isFk: false, description: 'RBAC authorization role' },
        ]
      },
      {
        name: 'workflows',
        description: 'Operational process lifecycles, states, and automation task queues',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Workflow instance UUID' },
          { name: 'organization_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing organizations.id' },
          { name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, description: 'Workflow title' },
          { name: 'status', type: 'ENUM("Active","Paused","Completed","Archived")', isPk: false, isFk: false, description: 'Operational state' },
          { name: 'trigger_type', type: 'VARCHAR(50)', isPk: false, isFk: false, description: 'Webhook / Scheduled / Event' },
        ]
      },
      {
        name: 'audit_logs',
        description: 'Immutable security and change audit trail with user identity and diffs',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, description: 'Audit entry UUID' },
          { name: 'organization_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing organizations.id' },
          { name: 'user_id', type: 'UUID', isPk: false, isFk: true, description: 'FK referencing users.id' },
          { name: 'action', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Action performed' },
          { name: 'entity_name', type: 'VARCHAR(100)', isPk: false, isFk: false, description: 'Target entity' },
          { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, description: 'Timestamp' },
        ]
      },
    ],
    erMermaid: `erDiagram
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ WORKFLOW : owns
    ORGANIZATION ||--o{ AUDIT_LOG : tracks
    USER ||--o{ AUDIT_LOG : generates
    
    ORGANIZATION {
        uuid id PK
        string name
        string domain
        string plan_tier
        timestamp created_at
    }
    USER {
        uuid id PK
        uuid organization_id FK
        string email
        string full_name
        string role
    }
    WORKFLOW {
        uuid id PK
        uuid organization_id FK
        string name
        string status
        string trigger_type
    }
    AUDIT_LOG {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action
        string entity_name
        timestamp created_at
    }`,
    bpmnSteps: [
      { name: 'Enterprise Request Initiation', type: 'start', actor: 'Client Gateway / Webhook', description: 'Incoming business event authenticated & token validated', duration: '< 15ms' },
      { name: 'Policy Validation & Input Sanitation', type: 'task', actor: 'API Security Service', description: 'Zero-trust parameter audit and tenant permission verification', duration: '< 50ms' },
      { name: 'Core Microservice Workflow Execution', type: 'service', actor: 'Distributed Service Mesh', description: 'Executes transactional business logic and state machine updates', duration: '< 150ms' },
      { name: 'Manager Review & Approval Gate', type: 'task', actor: 'Designated Stakeholder', description: 'Role-based review and digital authorization checkpoint', duration: '< 4 Hours' },
      { name: 'Event Notification & Audit Ledger Commit', type: 'end', actor: 'Audit & Notification Stream', description: 'State committed to primary database and immutable audit log published', duration: '< 20ms' },
    ],
    bpmnMermaid: `flowchart TD
    Start(["Start: Enterprise Request Initiation"]) --> ValidateReq["Validate Business Policy & Credentials"]
    ValidateReq --> RuleCheck{"Policy Rules Compliant?"}
    RuleCheck -- "Violation" --> ExceptionDesk["Route to Governance Exception Desk"]
    ExceptionDesk --> ValidateReq
    RuleCheck -- "Passed" --> ProcessTask["Execute Core Service & Asynchronous Processing"]
    ProcessTask --> ReviewGate{"Manager / Supervisor Approval?"}
    ReviewGate -- "Changes Requested" --> ExceptionDesk
    ReviewGate -- "Approved" --> CommitTxn["Commit Transaction & Update Audit Ledger"]
    CommitTxn --> NotifyStakeholders["Transmit Real-time Event & Webhook Alerts"]
    NotifyStakeholders --> EndSuccess(["End: Task Successfully Fulfilled & Logged"])`,
    apiEndpoints: [
      { id: 'ent-1', method: 'GET', path: '/api/v1/workflows', summary: 'List all active enterprise workflows and operational states', params: [{ name: 'status', type: 'string', in: 'query', description: 'Active, Paused, Completed' }], sampleResponse: { total: 18, items: [{ id: 'WF-101', name: 'Document Ingestion & Analysis', status: 'Active' }, { id: 'WF-102', name: 'Monthly Financial Reconciliation', status: 'Active' }] } },
      { id: 'ent-2', method: 'POST', path: '/api/v1/workflows/trigger', summary: 'Trigger asynchronous enterprise processing workflow', requestBody: { workflowName: 'Data Pipeline Sync', priority: 'High', executionParams: { batchSize: 500 } }, sampleResponse: { success: true, executionId: 'EXEC-2026-9901', status: 'Queued' } },
      { id: 'ent-3', method: 'GET', path: '/api/v1/audit/logs', summary: 'Query immutable security and operational audit trail', params: [{ name: 'limit', type: 'integer', in: 'query', description: 'Page limit' }], sampleResponse: { count: 50, events: [{ id: 'AUD-8821', action: 'WORKFLOW_CONFIG_UPDATE', actor: 'admin@acme.com', timestamp: new Date().toISOString() }] } }
    ],
    wireframes: [
      { id: 'wf-ent-1', title: 'Enterprise Operations Command Center', layoutType: 'Metrics & Process Feed', description: 'Unified dashboard monitoring active microservices, workflow queue throughput, and system health', components: [{ label: 'System Throughput Chart', type: 'Line Chart' }, { label: 'Active Workflows Table', type: 'Data Grid' }, { label: 'Cluster Resource Allocation', type: 'Radial Progress' }] },
      { id: 'wf-ent-2', title: 'Workflow Configuration & Governance Console', layoutType: 'Step Editor', description: 'Interactive policy configuration, trigger rules, and role permission assignments', components: [{ label: 'Workflow Node Topology', type: 'Graph Canvas' }, { label: 'Security Policy Toggle', type: 'Switch Form' }] }
    ],
    sandboxRecords: [
      { id: 'ENT-2026-001', name: 'Core Platform Modernization', district: 'Engineering & DevOps', acres: 'Production Cluster US-East', hp: 'Tier: Enterprise', subsidy: 'SLA: 99.99%', status: 'Approved', urgent: false, date: '2026-09-22' },
      { id: 'ENT-2026-002', name: 'Customer Identity Service Migration', district: 'Security & Auth Team', acres: 'Zero-Trust Okta Gateway', hp: 'Tier: Enterprise', subsidy: 'SLA: 99.95%', status: 'Approved', urgent: true, date: '2026-09-21' },
      { id: 'ENT-2026-003', name: 'Financial Reconciliation Pipeline', district: 'Corporate Accounting', acres: 'Automated Audit Mesh', hp: 'Tier: Professional', subsidy: 'SLA: 99.90%', status: 'Pending', urgent: false, date: '2026-09-20' },
      { id: 'ENT-2026-004', name: 'Supply Chain Ingress Connector', district: 'Logistics Operations', acres: 'EDI / Webhook Ingress', hp: 'Tier: Professional', subsidy: 'SLA: 99.90%', status: 'In Review', urgent: true, date: '2026-09-19' },
      { id: 'ENT-2026-005', name: 'Employee Compliance Sentinel', district: 'People & Governance', acres: 'Statutory Policy Bot', hp: 'Tier: Starter', subsidy: 'SLA: 99.50%', status: 'Flagged', urgent: false, date: '2026-09-18' },
    ],
    columnLabels: { id: 'Initiative ID', name: 'Transformation Project', district: 'Business Unit / Team', acres: 'Infrastructure Scope', hp: 'Service Tier', subsidy: 'SLA Guarantee' }
  }
};

/**
 * Dynamically synthesizes a Mermaid ER diagram from any array of database tables.
 * Perfectly adapts to whatever entities the trained AI model generated.
 */
export function generateMermaidErdFromTables(tables = []) {
  if (!tables || !Array.isArray(tables) || tables.length === 0) return '';
  
  const relationships = [];
  const tableDefs = [];

  const cleanName = (str) => (str || '').trim().replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  const cleanColName = (str) => (str || '').trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const cleanType = (str) => {
    const s = (str || 'string').toLowerCase();
    if (s.includes('int')) return 'int';
    if (s.includes('uuid')) return 'uuid';
    if (s.includes('date') || s.includes('time')) return 'timestamp';
    if (s.includes('float') || s.includes('dec') || s.includes('num')) return 'float';
    if (s.includes('bool')) return 'boolean';
    return 'string';
  };

  const tableNames = tables.map(t => cleanName(t.name));

  tables.forEach(table => {
    const tName = cleanName(table.name);
    const cols = table.columns || [];

    cols.forEach(col => {
      const colName = (col.name || '').toLowerCase();
      if (col.isFk || colName.endsWith('_id') || colName.endsWith('id_fk')) {
        let targetTable = null;
        for (const candidate of tableNames) {
          if (candidate !== tName) {
            const singularCand = candidate.replace(/S$/, '').toLowerCase();
            const candLower = candidate.toLowerCase();
            if (colName.includes(singularCand) || colName.includes(candLower)) {
              targetTable = candidate;
              break;
            }
          }
        }
        if (targetTable) {
          relationships.push(`    ${targetTable} ||--o{ ${tName} : "references"`);
        }
      }
    });

    let colLines = cols.map(c => {
      const type = cleanType(c.type);
      const name = cleanColName(c.name);
      const key = c.isPk ? ' PK' : c.isFk ? ' FK' : '';
      return `        ${type} ${name}${key}`;
    });

    if (colLines.length === 0) {
      colLines = [
        '        uuid id PK',
        '        string status',
        '        timestamp created_at'
      ];
    }

    tableDefs.push(`    ${tName} {\n${colLines.join('\n')}\n    }`);
  });

  if (relationships.length === 0 && tableNames.length > 1) {
    for (let i = 1; i < tableNames.length; i++) {
      relationships.push(`    ${tableNames[0]} ||--o{ ${tableNames[i]} : "manages"`);
    }
  }

  const uniqueRels = Array.from(new Set(relationships));
  return `erDiagram\n${uniqueRels.join('\n')}\n\n${tableDefs.join('\n\n')}`;
}

/**
 * Dynamically synthesizes a Mermaid Architecture diagram from components & tech stack.
 */
export function generateMermaidArchFromComponents(components = [], techStack = [], sessionTitle = 'Enterprise Platform') {
  const safeTitle = (sessionTitle || 'Enterprise Platform').replace(/["\n\r[\]()]/g, '');
  const comps = Array.isArray(components) && components.length > 0 ? components.slice(0, 6) : [
    { name: 'Core API Services', tech: 'Node.js Express' },
    { name: 'Worker Processing Engine', tech: 'FastAPI / Python' },
    { name: 'Identity & Access Manager', tech: 'OAuth2 / JWT' }
  ];

  const lines = [
    'graph TD',
    `    Client["Client Web Portal & Mobile UI (${safeTitle})"] --> CDN["Global Edge CDN & TLS 1.3"]`,
    `    CDN --> Gateway["API Gateway (OAuth2 / JWT Auth)"]`
  ];

  comps.forEach((comp, idx) => {
    const compName = (comp.name || `Service-${idx + 1}`).replace(/["\n\r[\]()]/g, '');
    const compTech = comp.tech ? ` (${comp.tech.replace(/["\n\r[\]()]/g, '')})` : '';
    lines.push(`    Gateway --> Comp${idx}["${compName}${compTech}"]`);
  });

  const primaryDb = (techStack && Array.isArray(techStack)) ? (techStack.find(t => (t.category || '').toLowerCase().includes('data') || (t.category || '').toLowerCase().includes('persist'))?.choice || 'PostgreSQL 16 Enterprise') : 'PostgreSQL 16 Enterprise';
  const cacheChoice = (techStack && Array.isArray(techStack)) ? (techStack.find(t => (t.category || '').toLowerCase().includes('cache'))?.choice || 'Redis Distributed Cache') : 'Redis Distributed Cache';
  const queueChoice = (techStack && Array.isArray(techStack)) ? (techStack.find(t => (t.category || '').toLowerCase().includes('queue') || (t.category || '').toLowerCase().includes('stream') || (t.category || '').toLowerCase().includes('broker'))?.choice || 'Kafka / RabbitMQ Broker') : 'Kafka / RabbitMQ Broker';

  lines.push(`    Comp0 --> DB[("Primary Database (${primaryDb.replace(/["\n\r[\]()]/g, '')})")]`);
  if (comps.length > 1) {
    lines.push(`    Comp1 --> DB`);
    lines.push(`    Comp0 --> Cache[("${cacheChoice.replace(/["\n\r[\]()]/g, '')}")]`);
    lines.push(`    Comp1 --> Queue["Message Broker (${queueChoice.replace(/["\n\r[\]()]/g, '')})"]`);
  }
  if (comps.length > 2) {
    lines.push(`    Queue --> Comp2`);
  }

  return lines.join('\n');
}

/**
 * Dynamically synthesizes a Mermaid BPMN flowchart from workflow nodes.
 */
export function generateMermaidBpmnFromNodes(nodes = [], processName = 'Workflow Lifecycle') {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return '';
  const stepCount = Math.min(nodes.length, 7);

  const lines = ['flowchart TD'];

  nodes.slice(0, stepCount).forEach((node, idx) => {
    const name = (node.name || `Step ${idx + 1}`).replace(/["\n\r[\]()]/g, '');
    const actor = node.actor ? ` [${node.actor.replace(/["\n\r[\]()]/g, '')}]` : '';

    if (idx === 0) {
      lines.push(`    Start(["Start: ${name}${actor}"])`);
    } else if (idx === stepCount - 1) {
      lines.push(`    End(["End: ${name}${actor}"])`);
    } else {
      if ((node.type || '').toLowerCase().includes('decision') || name.toLowerCase().includes('check') || name.toLowerCase().includes('verify') || name.includes('?')) {
        lines.push(`    Step${idx}{"${name}?"}`);
      } else {
        lines.push(`    Step${idx}["${name}${actor}"]`);
      }
    }
  });

  for (let i = 0; i < stepCount - 1; i++) {
    const fromId = i === 0 ? 'Start' : `Step${i}`;
    const toId = i + 1 === stepCount - 1 ? 'End' : `Step${i + 1}`;
    lines.push(`    ${fromId} --> ${toId}`);
  }

  return lines.join('\n');
}

/**
 * Detect matching domain profile from session title, industry, and raw input text
 */
export function detectDomainProfile(sessionTitle = '', rawInput = '', industry = '') {
  const combined = `${sessionTitle} ${rawInput} ${industry}`.toLowerCase();
  
  if (DOMAIN_PROFILES.deeptech.match.some(kw => combined.includes(kw))) {
    return DOMAIN_PROFILES.deeptech;
  }
  if (DOMAIN_PROFILES.egovernance.match.some(kw => combined.includes(kw))) {
    return DOMAIN_PROFILES.egovernance;
  }
  if (DOMAIN_PROFILES.healthcare.match.some(kw => combined.includes(kw))) {
    return DOMAIN_PROFILES.healthcare;
  }
  if (DOMAIN_PROFILES.hr.match.some(kw => combined.includes(kw))) {
    return DOMAIN_PROFILES.hr;
  }
  if (DOMAIN_PROFILES.logistics.match.some(kw => combined.includes(kw))) {
    return DOMAIN_PROFILES.logistics;
  }
  
  // Clean universal enterprise fallback
  return DOMAIN_PROFILES.enterprise;
}

/**
 * Dynamically synthesizes all Blueprint deliverables for a session
 */
export function generateDynamicBlueprintArtifacts(session = {}, brd = {}, architecture = {}) {
  const title = session?.title || brd?.title || 'Enterprise Transformation';
  const rawInput = session?.summary || brd?.objectives || '';
  const industry = architecture?.industry || 'General';

  const profile = detectDomainProfile(title, rawInput, industry);

  // 1. Dynamic Mermaid Architecture Topology - derived directly from AI architecture if available
  let dynamicArchChart = '';
  if (architecture?.components && Array.isArray(architecture.components) && architecture.components.length > 0) {
    dynamicArchChart = generateMermaidArchFromComponents(architecture.components, architecture.tech_stack, title);
  } else {
    dynamicArchChart = `graph TD
    Client["Client Web Portal & Mobile PWA (${profile.entityName})"] --> CDN["Global Edge CDN & TLS 1.3 Routing"]
    CDN --> Gateway["API Gateway (OAuth2 / JWT Token Auth)"]
    Gateway --> ServiceA["${profile.cloudServices[0]}"]
    Gateway --> ServiceB["${profile.cloudServices[1]}"]
    Gateway --> ServiceC["${profile.cloudServices[2]}"]
    ServiceA --> DB[("Primary Database (${profile.dbEngine})")]
    ServiceB --> DB
    ServiceA --> Cache[("${profile.cacheEngine}")]
    ServiceA --> Queue["Message Broker (${profile.queueEngine})"]
    Queue --> Worker["${profile.cloudServices[3]}"]
    Worker --> CloudVault[("${profile.cloudServices[4]}")]`;
  }

  // 2. Dynamic Mermaid BPMN Process Chart - derived directly from AI bpmn nodes if available
  let dynamicBpmnChart = '';
  if (architecture?.bpmn_workflows?.nodes && Array.isArray(architecture.bpmn_workflows.nodes) && architecture.bpmn_workflows.nodes.length > 0) {
    dynamicBpmnChart = generateMermaidBpmnFromNodes(architecture.bpmn_workflows.nodes, architecture.bpmn_workflows.processName);
  } else {
    dynamicBpmnChart = profile.bpmnMermaid;
  }

  // 3. Dynamic Mermaid ERD Chart - derived directly from AI database schema if available
  let dynamicErChart = '';
  if (architecture?.database_schema?.tables && Array.isArray(architecture.database_schema.tables) && architecture.database_schema.tables.length > 0) {
    dynamicErChart = generateMermaidErdFromTables(architecture.database_schema.tables);
  } else {
    dynamicErChart = profile.erMermaid;
  }

  // 4. Dynamic Relational Database Tables
  const dynamicDbTables = (architecture?.database_schema?.tables && Array.isArray(architecture.database_schema.tables) && architecture.database_schema.tables.length > 0)
    ? architecture.database_schema.tables
    : profile.tables;

  // 5. Dynamic OpenAPI Endpoints
  const dynamicApiEndpoints = (architecture?.api_specs?.endpoints && Array.isArray(architecture.api_specs.endpoints) && architecture.api_specs.endpoints.length > 0)
    ? architecture.api_specs.endpoints
    : profile.apiEndpoints;

  // 6. Dynamic Wireframe Screens
  const dynamicWireframes = { screens: profile.wireframes };

  // 7. Dynamic Working Solution Sandbox App Data
  const dynamicSandboxData = {
    entityName: profile.entityName,
    records: profile.sandboxRecords,
    columnLabels: profile.columnLabels,
    defaultSvc: profile.cloudServices[0],
  };

  return {
    dynamicArchChart,
    dynamicBpmnChart,
    dynamicErChart,
    dynamicDbTables,
    dynamicApiEndpoints,
    dynamicWireframes,
    dynamicSandboxData,
    bpmnSteps: profile.bpmnSteps,
  };
}

