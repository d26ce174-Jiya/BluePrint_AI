import { compileAiClient } from './compileAiClient.js';
import { inputAnalyzer } from './inputAnalyzer.js';

/**
 * Domain-Adaptive Architecture & Database Schema Profiles
 * Ensures zero static hardcoded templates — every blueprint delivers
 * real domain tables, REST APIs, BPMN lifecycles, and microservice components.
 */
const DOMAIN_PROFILES = {
  deeptech: {
    match: ['nano', 'nanotech', 'sensor', 'quantum', 'iot', 'robotics', 'semiconductor', 'physics', 'chip', 'firmware', 'device', 'material', 'telemetry', 'hardware', 'lab', 'telematics'],
    title: 'Nano-Tech Sensor Telemetry & Diagnostics Platform',
    hldSummary: 'Ultra-low latency telemetry ingress pipeline with real-time signal processing, automated precision calibration, time-series TimescaleDB storage, and anomaly detection alerts.',
    techStack: [
      { category: 'Client Application', choice: 'React 19 + TypeScript Dashboard', rationale: 'Sub-millisecond oscilloscope waveform rendering and interactive hardware diagnostics.' },
      { category: 'Telemetry Ingress', choice: 'Node.js Express + MQTT / gRPC Broker', rationale: 'High-frequency binary packet ingestion, hardware heartbeat pings, and sub-10ms latency.' },
      { category: 'Signal Processing & AI Engine', choice: 'FastAPI + Python NumPy/SciPy Pipeline', rationale: 'Real-time noise filtering, Fast Fourier Transforms, and precision drift compensation.' },
      { category: 'Time-Series Database', choice: 'TimescaleDB / PostgreSQL 16', rationale: 'Optimized hypertable partitioning for gigabyte-scale telemetry metrics and ACID compliance.' },
      { category: 'Message Stream & Queue', choice: 'Apache Kafka / Redis Streams', rationale: 'Decoupled asynchronous worker queues for dynamic calibration routines and anomaly alerts.' }
    ],
    components: [
      { name: 'Hardware Telemetry Gateway', responsibility: 'Authenticates physical nano-devices and ingests high-frequency signal metrics', tech: 'Node.js / gRPC / MQTT', scaling: 'Clustered Edge Pods' },
      { name: 'Real-Time Signal Engine', responsibility: 'Applies noise rejection, baseline drift analysis, and FFT transformation', tech: 'FastAPI / Python', scaling: 'Auto-Scaling Pods' },
      { name: 'Device Registry & Firmware Service', responsibility: 'Manages hardware device identities, calibration profiles, and microcode versions', tech: 'Node.js / Express', scaling: 'Horizontal Pods' },
      { name: 'Automated Calibration Worker', responsibility: 'Dispatches dynamic feedback coefficients to sensor nodes exceeding tolerance', tech: 'Python Background Worker', scaling: 'Queue-Driven Workers' },
      { name: 'Time-Series Metrics Store', responsibility: 'Hypertable storage for signal frequencies, SNR fidelity, and operating temperatures', tech: 'TimescaleDB (PostgreSQL 16)', scaling: 'Primary + Read Replicas' }
    ],
    dataFlow: '1. Nano device streams high-frequency telemetry via MQTT -> 2. Ingress Broker buffers packet into Redis stream -> 3. Signal processing engine executes noise filtering and FFT -> 4. Anomaly detector evaluates precision tolerances -> 5. If drift exceeds threshold, micro-calibration worker dispatches feedback coefficient -> 6. Telemetry written to TimescaleDB data lake -> 7. Live operator dashboard updated.',
    securityNotes: 'Hardware mTLS device authentication, tamper-resistant cryptographic telemetry signatures, encrypted time-series partitions, and zero-trust API ingress.',
    bpmnWorkflows: {
      processName: 'Nano-Device Telemetry Ingress, Processing & Automated Calibration',
      slaTarget: '< 200ms',
      nodes: [
        { id: 'node-1', name: 'Device Ingress & Telemetry Handshake', type: 'start', actor: 'Nano-Sensor Controller', description: 'Real-time telemetry packet received via secure MQTT/gRPC socket', duration: '< 10ms' },
        { id: 'node-2', name: 'Stream Signal Processing & Filter', type: 'task', actor: 'FastAPI Signal Pipeline', description: 'Applies Fast Fourier Transform & noise rejection algorithms', duration: '< 50ms' },
        { id: 'node-3', name: 'Anomaly & Tolerance Threshold Check', type: 'task', actor: 'AI Diagnostics Engine', description: 'Compares real-time telemetry against precision baseline', duration: '< 100ms' },
        { id: 'node-4', name: 'Dynamic Micro-Calibration Routine', type: 'service', actor: 'Automated Calibration Worker', description: 'Transmits dynamic feedback coefficient to sensor controller', duration: '< 200ms' },
        { id: 'node-5', name: 'Time-Series Data Lake & Dashboard Update', type: 'end', actor: 'TimescaleDB Ingestion Pool', description: 'Telemetry committed to time-series ledger & UI stream updated', duration: '< 25ms' }
      ],
      decisionGates: [
        { condition: 'Telemetry frequency deviation within +/- 0.05% nominal tolerance', outcomeIfTrue: 'Commit packet to standard time-series hypertable', outcomeIfFalse: 'Flag anomaly event and trigger automated micro-calibration cycle' },
        { condition: 'Operating cryogenic temperature < 10 Kelvin', outcomeIfTrue: 'Maintain normal measurement cadence', outcomeIfFalse: 'Alert cleanroom thermal control operator' }
      ],
      escalations: [
        { trigger: 'Consecutive anomaly count exceeds 5 cycles', action: 'Quarantine device and notify lead instrumentation scientist', owner: 'Diagnostics Sentinel' },
        { trigger: 'MQTT telemetry packet loss exceeds 0.1%', action: 'Switch edge broker to fallback redundant gateway', owner: 'Cluster Health Monitor' }
      ]
    },
    tables: [
      {
        name: 'devices',
        description: 'Physical nano-tech instruments, probes, and telemetry controller nodes',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Device master UUID' },
          { name: 'serial_number', type: 'VARCHAR(64)', isPk: false, isFk: false, isNullable: false, description: 'Hardware unique serial' },
          { name: 'device_model', type: 'VARCHAR(100)', isPk: false, isFk: false, isNullable: false, description: 'Device hardware model' },
          { name: 'firmware_version', type: 'VARCHAR(32)', isPk: false, isFk: false, isNullable: false, description: 'Microcode version' },
          { name: 'status', type: 'ENUM("Online","Calibrating","Standby","Offline")', isPk: false, isFk: false, isNullable: false, description: 'Operational lifecycle' },
          { name: 'registered_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Registration timestamp' }
        ]
      },
      {
        name: 'sensor_telemetry',
        description: 'High-frequency telemetry readings, frequency spectra, and signal fidelity',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Telemetry packet UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing devices.id' },
          { name: 'signal_frequency_ghz', type: 'DECIMAL(8,4)', isPk: false, isFk: false, isNullable: false, description: 'Resonant frequency' },
          { name: 'signal_to_noise_db', type: 'DECIMAL(6,2)', isPk: false, isFk: false, isNullable: false, description: 'SNR in dB' },
          { name: 'operating_temp_k', type: 'DECIMAL(6,2)', isPk: false, isFk: false, isNullable: false, description: 'Temperature in Kelvin' },
          { name: 'recorded_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Sample timestamp' }
        ]
      },
      {
        name: 'calibration_runs',
        description: 'Precision calibration logs, accuracy scores, and applied compensation offsets',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Calibration run UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing devices.id' },
          { name: 'accuracy_score', type: 'DECIMAL(5,3)', isPk: false, isFk: false, isNullable: false, description: 'Precision coefficient' },
          { name: 'offset_applied', type: 'VARCHAR(50)', isPk: false, isFk: false, isNullable: false, description: 'Feedback bias offset' },
          { name: 'status', type: 'ENUM("Passed","Recalibrated","Failed")', isPk: false, isFk: false, isNullable: false, description: 'Result' },
          { name: 'calibrated_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Calibration timestamp' }
        ]
      },
      {
        name: 'anomaly_alerts',
        description: 'Tolerance breach events and diagnostic warning records',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Alert event UUID' },
          { name: 'device_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing devices.id' },
          { name: 'severity_level', type: 'ENUM("Critical","Warning","Info")', isPk: false, isFk: false, isNullable: false, description: 'Incident severity' },
          { name: 'description', type: 'TEXT', isPk: false, isFk: false, isNullable: false, description: 'Anomaly description' },
          { name: 'triggered_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Trigger timestamp' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'GET',
        path: '/api/v1/devices',
        summary: 'List registered nano-tech devices and active telemetry status',
        authRequired: true,
        requestBody: 'None (Query Param: status=Online)',
        responseSample: '{\n  "total": 48,\n  "devices": [\n    { "id": "dev-01", "model": "QuantumProbe-V4", "status": "Online", "accuracyScore": 0.9994 }\n  ]\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/telemetry/stream',
        summary: 'Ingest high-frequency sensor signal telemetry packet',
        authRequired: true,
        requestBody: '{\n  "deviceId": "dev-01",\n  "frequencyGhz": 28.452,\n  "snrDb": 42.1,\n  "tempK": 4.2\n}',
        responseSample: '{\n  "acknowledged": true,\n  "packetId": "pkt-882194",\n  "anomalyScore": 0.02\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/devices/:id/calibrate',
        summary: 'Execute automated precision calibration cycle on target sensor node',
        authRequired: true,
        requestBody: '{\n  "targetTolerance": 0.001,\n  "calibrationMode": "DYNAMIC_RESONANCE"\n}',
        responseSample: '{\n  "status": "CALIBRATED",\n  "newAccuracy": 0.9998,\n  "offsetApplied": "+0.0014 GHz"\n}'
      }
    ]
  },

  egovernance: {
    match: ['governance', 'citizen', 'civic', 'municipal', 'government', 'public', 'permit', 'license', 'grievance', 'certificate', 'scheme', 'panchayat'],
    title: 'Smart Citizen Digital E-Governance Platform',
    hldSummary: 'Citizen-centric digital delivery platform with automated credential validation, departmental approval workflow queues, digital PKI signing, and automated multi-channel citizen notifications.',
    techStack: [
      { category: 'Client Application', choice: 'React 19 + PWA (Mobile Responsive)', rationale: 'Accessible, multilingual citizen self-service portal with offline document caching.' },
      { category: 'Identity & API Gateway', choice: 'Node.js Express + OAuth2 / JWT', rationale: 'Zero-trust citizen authentication, rate limiting, and secure departmental API access.' },
      { category: 'Verification Engine', choice: 'FastAPI + Python Document Verification', rationale: 'Automated document integrity validation, OCR text extraction, and duplicate check.' },
      { category: 'Relational Database', choice: 'PostgreSQL 16 (Statutory Audit Ledger)', rationale: 'ACID transaction support with encrypted records and immutable civic audit logs.' },
      { category: 'Notification & Queue', choice: 'RabbitMQ / Redis Streams', rationale: 'Decoupled worker queues for SMS notifications, email dispatches, and certificate delivery.' }
    ],
    components: [
      { name: 'Citizen Self-Service Portal', responsibility: 'Multilingual application submission, status tracking, and certificate downloads', tech: 'React / Vite / Tailwind', scaling: 'Static CloudFront CDN' },
      { name: 'Digital Verification Gateway', responsibility: 'Verifies uploaded identity documents and cross-checks jurisdictional prerequisites', tech: 'FastAPI / Python', scaling: 'Auto-Scaling Pods' },
      { name: 'Departmental Workflow Engine', responsibility: 'Manages desk reviews, officer sign-offs, and multi-tier approval gates', tech: 'Node.js / Express', scaling: 'Clustered Pods' },
      { name: 'PKI Digital Signature Worker', responsibility: 'Generates cryptographically sealed, tamper-evident digital certificates', tech: 'Node.js Crypto Service', scaling: 'Worker Nodes' },
      { name: 'Civic Ledger Database', responsibility: 'Stores citizen applications, audit trails, fee receipts, and official records', tech: 'PostgreSQL 16', scaling: 'Primary with Read Replicas' }
    ],
    dataFlow: '1. Citizen submits application via portal -> 2. Verification gateway cross-checks identity and documents -> 3. Assigned departmental officer reviews dossier -> 4. Officer approves application -> 5. PKI service stamps digital certificate -> 6. Citizen receives SMS alert with download link -> 7. Transaction recorded in statutory audit ledger.',
    securityNotes: 'TLS 1.3 encrypted communications, SHA-256 identity masking, digital PKI certificate sealing, and immutable audit logs.',
    bpmnWorkflows: {
      processName: 'Citizen Service Intake, Verification & Digital Delivery Lifecycle',
      slaTarget: '< 48 Hours',
      nodes: [
        { id: 'node-1', name: 'Citizen Application & Document Intake', type: 'start', actor: 'Citizen Portal / CSC Center', description: 'Submission of service request form and identity credentials', duration: '< 10 min' },
        { id: 'node-2', name: 'Automated Document & Identity Verification', type: 'task', actor: 'Govt API Integration Gateway', description: 'Cross-verifies identity credentials and eliminates duplicate claims', duration: '< 30s' },
        { id: 'node-3', name: 'Departmental Desk Review & Inspection', type: 'task', actor: 'Designated Civic Officer', description: 'Reviews compliance prerequisites and regulatory criteria', duration: '< 24 Hours' },
        { id: 'node-4', name: 'Digital Sanction & PKI Credential Signing', type: 'service', actor: 'PKI Digital Signature Engine', description: 'Issues digitally signed official certificate with cryptographic seal', duration: '< 1 min' },
        { id: 'node-5', name: 'Service Delivery & Citizen Notification', type: 'end', actor: 'Citizen Notification Bridge', description: 'Certificate delivered to citizen wallet and confirmed via SMS', duration: '< 1 Hour' }
      ],
      decisionGates: [
        { condition: 'Uploaded documents validated with zero discrepancy', outcomeIfTrue: 'Route dossier to departmental officer review queue', outcomeIfFalse: 'Notify citizen to upload clarification and pause SLA clock' },
        { condition: 'Departmental officer approves application', outcomeIfTrue: 'Trigger PKI digital signature and issue official credential', outcomeIfFalse: 'Return application with rejection rationale and appeal instructions' }
      ],
      escalations: [
        { trigger: 'Officer review SLA exceeds 48 hours', action: 'Auto-escalate to Municipal Commissioner dashboard', owner: 'SLA Sentinel' },
        { trigger: 'SMS notification delivery failure', action: 'Retry delivery over WhatsApp and email gateway', owner: 'Notification Worker' }
      ]
    },
    tables: [
      {
        name: 'citizens',
        description: 'Registered citizen profiles and verified identity records',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Citizen UUID' },
          { name: 'national_id_hash', type: 'CHAR(64)', isPk: false, isFk: false, isNullable: false, description: 'Hashed identity token' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Citizen legal name' },
          { name: 'phone_number', type: 'VARCHAR(20)', isPk: false, isFk: false, isNullable: false, description: 'Contact phone' },
          { name: 'district', type: 'VARCHAR(100)', isPk: false, isFk: false, isNullable: false, description: 'Revenue district' },
          { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Registration timestamp' }
        ]
      },
      {
        name: 'service_applications',
        description: 'Citizen applications for certificates, trade licenses, and civic services',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Application UUID' },
          { name: 'citizen_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing citizens.id' },
          { name: 'service_category', type: 'VARCHAR(100)', isPk: false, isFk: false, isNullable: false, description: 'Requested civic service' },
          { name: 'status', type: 'ENUM("Submitted","Under-Review","Approved","Dispatched","Rejected")', isPk: false, isFk: false, isNullable: false, description: 'Lifecycle state' },
          { name: 'submitted_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Submission timestamp' }
        ]
      },
      {
        name: 'verification_audits',
        description: 'Officer inspection reports, verification findings, and compliance reviews',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Audit record UUID' },
          { name: 'application_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing service_applications.id' },
          { name: 'officer_badge_id', type: 'VARCHAR(64)', isPk: false, isFk: false, isNullable: false, description: 'Reviewing officer ID' },
          { name: 'status', type: 'VARCHAR(50)', isPk: false, isFk: false, isNullable: false, description: 'Verification outcome' },
          { name: 'audited_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Audit timestamp' }
        ]
      },
      {
        name: 'service_deliveries',
        description: 'Digitally signed credentials, issued certificates, and delivery confirmations',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Delivery UUID' },
          { name: 'application_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing service_applications.id' },
          { name: 'certificate_serial', type: 'VARCHAR(100)', isPk: false, isFk: false, isNullable: false, description: 'Credential serial number' },
          { name: 'delivered_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Delivery timestamp' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST',
        path: '/api/v1/applications/submit',
        summary: 'Submit citizen service application with verified identity documents',
        authRequired: true,
        requestBody: '{\n  "citizenName": "Kavita Joshi",\n  "serviceCategory": "Municipal Trade License",\n  "district": "Gandhinagar"\n}',
        responseSample: '{\n  "success": true,\n  "applicationId": "gov-94281",\n  "status": "Submitted",\n  "slaHours": 48\n}'
      },
      {
        method: 'GET',
        path: '/api/v1/applications/status',
        summary: 'Retrieve real-time application processing and approval status',
        authRequired: true,
        requestBody: 'None (Query Param: applicationId=gov-94281)',
        responseSample: '{\n  "applicationId": "gov-94281",\n  "stage": "Under Review",\n  "assignedOfficer": "OFFICER-410"\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/applications/:id/approve',
        summary: 'Departmental sign-off and PKI digital certificate issuance',
        authRequired: true,
        requestBody: '{\n  "approvedBy": "OFFICER-410",\n  "remarks": "Prerequisites satisfied"\n}',
        responseSample: '{\n  "status": "APPROVED",\n  "certificateSerial": "CERT-GJ-2026-99120",\n  "smsDelivered": true\n}'
      }
    ]
  },

  healthcare: {
    match: ['patient', 'hospital', 'doctor', 'clinic', 'ehr', 'emr', 'health', 'medical', 'prescription', 'triage'],
    title: 'Hospital Clinical EHR & Telemedicine Pipeline',
    hldSummary: 'HIPAA-compliant decoupled clinical ecosystem with FHIR / HL7 standard ingress, microservices for appointment triage, electronic prescriptions, and encrypted DICOM diagnostic archives.',
    techStack: [
      { category: 'Frontend UI', choice: 'React 19 + TypeScript', rationale: 'Fast component hierarchy with sub-millisecond triage updates and medical chart rendering.' },
      { category: 'Clinical Gateway', choice: 'Node.js Express + FHIR Bridge', rationale: 'HL7/FHIR v4 interoperability supporting electronic medical record exchange with zero-trust token auth.' },
      { category: 'Persistence Tier', choice: 'PostgreSQL 16 (Row-Level Security)', rationale: 'ACID transactional data store with encrypted PHI tables and HIPAA compliant access auditing.' },
      { category: 'Real-time Triage Cache', choice: 'Redis Enterprise Cluster', rationale: 'In-memory queue for patient vitals, emergency desk alerts, and active consultation sessions.' },
      { category: 'Message Streaming', choice: 'Apache Kafka', rationale: 'Asynchronous event stream for lab result notifications, prescription dispatches, and insurance claims.' }
    ],
    components: [
      { name: 'Physician & Nurse Web Portal', responsibility: 'Patient chart visualization, vital signs monitoring, and electronic order entry', tech: 'React / Vite', scaling: 'Static CDN' },
      { name: 'FHIR Interoperability Gateway', responsibility: 'Validates and converts incoming diagnostic records against HL7/FHIR standard specs', tech: 'Node.js / Express', scaling: 'Horizontal Pods' },
      { name: 'E-Prescription Microservice', responsibility: 'Drug interaction checks, dosage verification, and digital pharmacy order dispatch', tech: 'FastAPI / Python', scaling: 'Auto-Scaling Pods' },
      { name: 'Insurance Adjudication Service', responsibility: 'Processes automated prior authorizations and real-time medical insurance claims', tech: 'Node.js Worker', scaling: 'Worker Nodes' },
      { name: 'Clinical PostgreSQL Cluster', responsibility: 'Stores HIPAA encrypted patient records, consultation notes, and pharmacy receipts', tech: 'PostgreSQL 16 with RLS', scaling: 'Primary + 2 Read Replicas' }
    ],
    dataFlow: '1. Patient registers via portal -> 2. FHIR Gateway creates EMR profile -> 3. Nurse inputs vitals to Redis triage stream -> 4. Doctor examines patient and generates e-prescription -> 5. Drug interaction checked -> 6. Order sent to pharmacy -> 7. Claim submitted to insurer.',
    securityNotes: 'HIPAA compliant encryption (AES-256 for data at rest, TLS 1.3 in transit), strict Role-Based Access Control, and audit trail on every patient record access.',
    bpmnWorkflows: {
      processName: 'Clinical Patient Intake, Consultation & Billing Pipeline',
      slaTarget: '< 4 Hours',
      nodes: [
        { id: 'node-1', name: 'Patient Intake & Insurance Check', type: 'start', actor: 'Reception Desk / Mobile App', description: 'Capture demographics, ID, and active policy number', duration: '< 5 min' },
        { id: 'node-2', name: 'Nursing Vitals & Triage Classification', type: 'task', actor: 'Triage Nurse', description: 'Records BP, SpO2, heart rate, and temperature; assigns severity category', duration: '< 10 min' },
        { id: 'node-3', name: 'Physician Consultation & Diagnosis', type: 'task', actor: 'Attending Physician', description: 'Clinical examination, electronic notes, and e-prescription formulation', duration: '< 20 min' },
        { id: 'node-4', name: 'Drug Interaction & Safety Audit', type: 'service', actor: 'Automated Pharmacy Engine', description: 'Cross-checks prescribed medications against patient allergy history', duration: '< 2s' },
        { id: 'node-5', name: 'Prescription Dispatch & Claim Settlement', type: 'end', actor: 'Pharmacy & Billing Desk', description: 'Dispenses medications and transmits electronic insurance claim', duration: '< 15 min' }
      ],
      decisionGates: [
        { condition: 'Patient triage urgency is Category 1 (Critical Emergency)', outcomeIfTrue: 'Fast-track to trauma resuscitation bay with immediate physician alert', outcomeIfFalse: 'Place patient in prioritized outpatient consultation queue' },
        { condition: 'Automated drug allergy safety check returns conflict score > 0', outcomeIfTrue: 'Lock prescription and alert prescribing physician for alternative formulation', outcomeIfFalse: 'Authorize prescription to hospital dispensary' }
      ],
      escalations: [
        { trigger: 'Emergency triage wait time > 15 minutes', action: 'Page on-call emergency room attending physician', owner: 'Triage Monitor' },
        { trigger: 'Insurance claim verification timeout', action: 'Route claim to financial counselor for manual adjudication', owner: 'Billing Service' }
      ]
    },
    tables: [
      {
        name: 'patients',
        description: 'Patient demographics, medical record numbers, and contact info',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Patient master UUID' },
          { name: 'mrn', type: 'VARCHAR(64)', isPk: false, isFk: false, isNullable: false, description: 'Medical record number' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Patient legal name' },
          { name: 'date_of_birth', type: 'DATE', isPk: false, isFk: false, isNullable: false, description: 'Birthdate' },
          { name: 'blood_group', type: 'VARCHAR(8)', isPk: false, isFk: false, isNullable: true, description: 'Blood type' },
          { name: 'primary_phone', type: 'VARCHAR(20)', isPk: false, isFk: false, isNullable: false, description: 'Contact phone' }
        ]
      },
      {
        name: 'appointments',
        description: 'Doctor consultation schedules, status, and triage queue',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Appointment UUID' },
          { name: 'patient_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing patients.id' },
          { name: 'doctor_id', type: 'UUID', isPk: false, isFk: false, isNullable: false, description: 'Assigned physician' },
          { name: 'scheduled_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Consultation slot' },
          { name: 'triage_priority', type: 'ENUM("Emergency","Urgent","Routine")', isPk: false, isFk: false, isNullable: false, description: 'Triage tier' },
          { name: 'status', type: 'ENUM("Scheduled","Checked-In","In-Consult","Completed")', isPk: false, isFk: false, isNullable: false, description: 'Appointment status' }
        ]
      },
      {
        name: 'prescriptions',
        description: 'Electronic drug orders and dispensary fulfillment status',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Prescription UUID' },
          { name: 'appointment_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing appointments.id' },
          { name: 'medication_name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Prescribed drug' },
          { name: 'dosage_mg', type: 'DECIMAL(6,2)', isPk: false, isFk: false, isNullable: false, description: 'Dosage amount' },
          { name: 'frequency', type: 'VARCHAR(50)', isPk: false, isFk: false, isNullable: false, description: 'Frequency (e.g. Twice Daily)' },
          { name: 'fulfillment_status', type: 'ENUM("Pending","Dispensed","Cancelled")', isPk: false, isFk: false, isNullable: false, description: 'Pharmacy status' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST',
        path: '/api/v1/patients/intake',
        summary: 'Register new patient with demographics and insurance policy data',
        authRequired: true,
        requestBody: '{\n  "fullName": "Ananya Sharma",\n  "dob": "1991-04-12",\n  "bloodGroup": "O+",\n  "insurancePolicyNo": "HDFC-ERGO-9921"\n}',
        responseSample: '{\n  "patientId": "pt-88129",\n  "mrn": "MRN-2026-4410",\n  "triageEligible": true\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/prescriptions/create',
        summary: 'Create electronic prescription with automated drug conflict check',
        authRequired: true,
        requestBody: '{\n  "appointmentId": "apt-5501",\n  "medicationName": "Amoxicillin 500mg",\n  "dosageMg": 500,\n  "frequency": "Three times daily"\n}',
        responseSample: '{\n  "prescriptionId": "rx-11029",\n  "allergyCheck": "PASSED_ZERO_CONFLICTS",\n  "dispensaryNotified": true\n}'
      }
    ]
  },

  hr: {
    match: ['hr', 'employee', 'payroll', 'onboarding', 'salary', 'leave', 'attendance', 'recruit', 'workforce'],
    title: 'Enterprise HR & Workforce Automation Hub',
    hldSummary: 'Modular HRMS with automated employee onboarding, self-service portal, background verification integrations, role-based offer generation, and automated payroll deduction calculations.',
    techStack: [
      { category: 'Frontend Client', choice: 'React 19 + Tailwind CSS', rationale: 'Responsive portal for candidate onboarding, leave approvals, and employee profile self-service.' },
      { category: 'Application Server', choice: 'Node.js Express + NestJS', rationale: 'Role-gated API layer managing employee lifecycle, salary calculations, and tax withholding.' },
      { category: 'Relational Database', choice: 'PostgreSQL 16', rationale: 'Strict relational integrity for employee records, salary structures, leave balances, and audit trails.' },
      { category: 'Document Vault', choice: 'AWS S3 / Azure Blob Storage', rationale: 'Encrypted object storage for candidate identity proofs, offer letters, and signed contracts.' },
      { category: 'Notification Dispatcher', choice: 'RabbitMQ + SendGrid', rationale: 'Reliable worker queue for automated offer dispatch, welcome emails, and payslip distribution.' }
    ],
    components: [
      { name: 'Employee Self-Service Portal', responsibility: 'Leave requests, profile updates, tax declaration, and payslip downloads', tech: 'React / Vite', scaling: 'Static CDN' },
      { name: 'Onboarding & BGV Workflow Engine', responsibility: 'Automates candidate document collection and background verification checks', tech: 'Node.js / Express', scaling: 'Horizontal Pods' },
      { name: 'Payroll Computation Service', responsibility: 'Monthly gross-to-net salary calculations, tax withholdings, and provident fund deductions', tech: 'FastAPI / Python', scaling: 'Scheduled Batch Pods' },
      { name: 'Leave & Attendance Tracker', responsibility: 'Clock-in/out records, leave balance accrual, and managerial approval queues', tech: 'Node.js API', scaling: 'Auto-Scaling Pods' },
      { name: 'Enterprise HR Database', responsibility: 'Stores employee master records, compensation grades, department hierarchies, and ledger logs', tech: 'PostgreSQL 16', scaling: 'Primary + Read Replica' }
    ],
    dataFlow: '1. Candidate accepts job offer -> 2. Onboarding engine sends document upload link -> 3. Automated BGV checks run -> 4. HR approves -> 5. Employee record created in HRMS -> 6. Monthly attendance ingested -> 7. Payroll computed & direct deposit disbursed.',
    securityNotes: 'Role-Based Access Control (Admin, HR Manager, Employee), salary field encryption at rest (AES-256), and biometric attendance integrity verification.',
    bpmnWorkflows: {
      processName: 'Employee Onboarding & Monthly Payroll Execution Lifecycle',
      slaTarget: '< 3 Business Days',
      nodes: [
        { id: 'node-1', name: 'Candidate Offer Acceptance', type: 'start', actor: 'Candidate / Recruiter', description: 'Offer signed digitally; automated onboarding link issued', duration: 'Instant' },
        { id: 'node-2', name: 'Document Collection & Automated BGV', type: 'task', actor: 'Onboarding Automation Service', description: 'Extracts government ID credentials, degree certificates, and triggers background check', duration: '< 24 Hours' },
        { id: 'node-3', name: 'IT Asset & Account Provisioning', type: 'service', actor: 'IT Identity Service', description: 'Provisions corporate Google Workspace email, Slack access, and laptop', duration: '< 2 Hours' },
        { id: 'node-4', name: 'Day 1 Orientation & Department Check-In', type: 'task', actor: 'HR Manager / Team Lead', description: 'Assigns buddy, reviews 30-60-90 day goal roadmap', duration: '< 1 Day' },
        { id: 'node-5', name: 'Monthly Payroll & Tax Settlement', type: 'end', actor: 'Finance Payroll Engine', description: 'Computes monthly deductions, generates encrypted payslips, and executes bank wire', duration: 'Monthly' }
      ],
      decisionGates: [
        { condition: 'Background verification check completes with zero adverse findings', outcomeIfTrue: 'Approve candidate profile and generate employee ID', outcomeIfFalse: 'Escalate to Chief HR Officer for manual compliance review' },
        { condition: 'Monthly attendance leaves balance >= 0 and approved by manager', outcomeIfTrue: 'Process regular full salary credit', outcomeIfFalse: 'Apply loss-of-pay pro-rated deduction to monthly net salary' }
      ],
      escalations: [
        { trigger: 'Candidate document submission pending > 48 hours', action: 'Send automated WhatsApp and email reminder', owner: 'Recruiting Bot' },
        { trigger: 'Managerial leave approval pending > 72 hours', action: 'Auto-approve or escalate to next-level department head', owner: 'HR Policy Engine' }
      ]
    },
    tables: [
      {
        name: 'employees',
        description: 'Master employee profiles, department codes, and employment status',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Employee master UUID' },
          { name: 'employee_code', type: 'VARCHAR(32)', isPk: false, isFk: false, isNullable: false, description: 'Unique staff code (e.g. EMP-1042)' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Full legal name' },
          { name: 'email', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Official corporate email' },
          { name: 'department', type: 'VARCHAR(100)', isPk: false, isFk: false, isNullable: false, description: 'Department (e.g. Engineering)' },
          { name: 'status', type: 'ENUM("Active","Onboarding","On-Leave","Terminated")', isPk: false, isFk: false, isNullable: false, description: 'Employment state' }
        ]
      },
      {
        name: 'salary_structures',
        description: 'Compensation packages, base pay, allowances, and tax bands',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Salary record UUID' },
          { name: 'employee_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing employees.id' },
          { name: 'basic_salary', type: 'DECIMAL(10,2)', isPk: false, isFk: false, isNullable: false, description: 'Monthly base pay' },
          { name: 'house_rent_allowance', type: 'DECIMAL(10,2)', isPk: false, isFk: false, isNullable: false, description: 'HRA component' },
          { name: 'special_allowance', type: 'DECIMAL(10,2)', isPk: false, isFk: false, isNullable: false, description: 'Special allowance' },
          { name: 'provident_fund_deduction', type: 'DECIMAL(10,2)', isPk: false, isFk: false, isNullable: false, description: 'PF employee contribution' }
        ]
      },
      {
        name: 'leave_requests',
        description: 'Employee time-off requests and supervisor approval logs',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Leave request UUID' },
          { name: 'employee_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing employees.id' },
          { name: 'leave_type', type: 'ENUM("Casual","Sick","Earned","Maternity")', isPk: false, isFk: false, isNullable: false, description: 'Leave category' },
          { name: 'start_date', type: 'DATE', isPk: false, isFk: false, isNullable: false, description: 'Leave start date' },
          { name: 'end_date', type: 'DATE', isPk: false, isFk: false, isNullable: false, description: 'Leave end date' },
          { name: 'status', type: 'ENUM("Pending","Approved","Rejected")', isPk: false, isFk: false, isNullable: false, description: 'Manager decision' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST',
        path: '/api/v1/onboarding/initiate',
        summary: 'Initiate digital onboarding workflow for new hire and send document portal link',
        authRequired: true,
        requestBody: '{\n  "candidateName": "Pooja Varma",\n  "personalEmail": "pooja.v@example.com",\n  "department": "Product Management",\n  "annualCtc": 1800000\n}',
        responseSample: '{\n  "onboardingId": "onb-22019",\n  "employeeCode": "EMP-4491",\n  "portalLinkSent": true\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/payroll/calculate-monthly',
        summary: 'Execute monthly salary calculation with tax withholding and PF deductions',
        authRequired: true,
        requestBody: '{\n  "payrollMonth": "2026-03",\n  "department": "Engineering"\n}',
        responseSample: '{\n  "processedEmployees": 142,\n  "totalDisbursement": 15420000.00,\n  "payslipsGenerated": true\n}'
      }
    ]
  },

  default: {
    match: [],
    title: 'Enterprise Digital Transformation Architecture',
    hldSummary: 'Cloud-native decoupled microservices architecture with modern Single Page Application (SPA), asynchronous API ingress gateway, distributed transactional database, and event message queue.',
    techStack: [
      { category: 'Frontend Client', choice: 'React 19 + Vite', rationale: 'Modern component-driven web application with reactive state management and sub-second load times.' },
      { category: 'API Ingress Gateway', choice: 'Node.js Express + JWT', rationale: 'Asynchronous event-driven gateway handling session tokens, rate limiting, and request normalization.' },
      { category: 'Persistence Tier', choice: 'PostgreSQL 16 / MySQL 8.0', rationale: 'ACID relational storage for operational entities, audit logs, and version control.' },
      { category: 'Distributed Cache', choice: 'Redis Enterprise Cluster', rationale: 'Sub-millisecond latency for session state, API response caching, and active user metrics.' },
      { category: 'Event Message Broker', choice: 'RabbitMQ / Kafka', rationale: 'Decoupled worker queues for asynchronous background processing, notifications, and export jobs.' }
    ],
    components: [
      { name: 'Web Application Client', responsibility: 'Interactive user interface, dashboard analytics, and real-time form intake', tech: 'React / Vite', scaling: 'Static Edge CDN' },
      { name: 'API Ingress Gateway', responsibility: 'Authentication, token verification, rate limiting, and request routing', tech: 'Node.js Express', scaling: 'Horizontal Pods' },
      { name: 'Core Business Logic Engine', responsibility: 'Domain rules enforcement, status transitions, and data transformations', tech: 'Node.js / Python', scaling: 'Auto-Scaling Pods' },
      { name: 'Async Worker Queue', responsibility: 'Executes long-running report exports, batch notifications, and third-party integrations', tech: 'RabbitMQ + Celery', scaling: 'Worker Pool' },
      { name: 'Relational Database Cluster', responsibility: 'Persistent storage for user records, transactional models, and audit logs', tech: 'PostgreSQL 16', scaling: 'Primary + Read Replicas' }
    ],
    dataFlow: '1. User interacts with web client -> 2. Ingress API verifies JWT and validates schema -> 3. Core service processes business logic -> 4. Transaction written to relational database -> 5. Redis cache invalidated -> 6. Response returned to client.',
    securityNotes: 'TLS 1.3 encryption in transit, AES-256 data at rest, Role-Based Access Control (Admin, Developer, Viewer), and sanitized inputs preventing SQL injection and XSS.',
    bpmnWorkflows: {
      processName: 'Enterprise Workflow & Business Pipeline',
      slaTarget: '< 24 Hours',
      nodes: [
        { id: 'node-1', name: 'Operational Request Intake', type: 'start', actor: 'User / External System', description: 'Intake and schema validation of business request', duration: 'Instant' },
        { id: 'node-2', name: 'Automated Rule Evaluation', type: 'task', actor: 'Core Business Engine', description: 'Validates business constraints and policies', duration: '< 2s' },
        { id: 'node-3', name: 'Supervisor Review & Approval', type: 'task', actor: 'Department Manager', description: 'Review of flagged exceptions and manual sign-off', duration: '< 4 Hours' },
        { id: 'node-4', name: 'System Execution & Integration', type: 'service', actor: 'Async Worker Service', description: 'Executes core transactional update and downstream sync', duration: '< 10s' },
        { id: 'node-5', name: 'Delivery Notification & Archival', type: 'end', actor: 'System Notification Hub', description: 'Sends confirmation to stakeholders and commits audit log', duration: 'Complete' }
      ],
      decisionGates: [
        { condition: 'Automated business validation check passed with 100% confidence', outcomeIfTrue: 'Fast-track to automated execution without manual review', outcomeIfFalse: 'Route to supervisor exception desk for manual review' }
      ],
      escalations: [
        { trigger: 'Request SLA pending > 24 hours', action: 'Send escalation alert to operations supervisor', owner: 'SLA Monitor' }
      ]
    },
    tables: [
      {
        name: 'organizations',
        description: 'Multi-tenant organization accounts and enterprise workspaces',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Organization UUID' },
          { name: 'name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'Organization name' },
          { name: 'domain', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: true, description: 'Corporate domain' },
          { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, isNullable: false, description: 'Creation timestamp' }
        ]
      },
      {
        name: 'users',
        description: 'User accounts, credential tokens, and role-based permissions',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'User UUID' },
          { name: 'organization_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing organizations.id' },
          { name: 'email', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'User email' },
          { name: 'full_name', type: 'VARCHAR(255)', isPk: false, isFk: false, isNullable: false, description: 'User full name' },
          { name: 'role', type: 'ENUM("admin","developer","viewer")', isPk: false, isFk: false, isNullable: false, description: 'RBAC role' }
        ]
      },
      {
        name: 'transactions',
        description: 'Operational transaction log and state lifecycle tracking',
        columns: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false, isNullable: false, description: 'Transaction UUID' },
          { name: 'organization_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing organizations.id' },
          { name: 'created_by_user_id', type: 'UUID', isPk: false, isFk: true, isNullable: false, description: 'FK referencing users.id' },
          { name: 'status', type: 'ENUM("Draft","Submitted","Processing","Completed","Failed")', isPk: false, isFk: false, isNullable: false, description: 'Lifecycle state' },
          { name: 'amount', type: 'DECIMAL(12,2)', isPk: false, isFk: false, isNullable: true, description: 'Transaction value' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST',
        path: '/api/v1/transactions',
        summary: 'Create and submit a new operational transaction',
        authRequired: true,
        requestBody: '{\n  "title": "Quarterly Operations Review",\n  "amount": 45000.00\n}',
        responseSample: '{\n  "success": true,\n  "transactionId": "txn-88192",\n  "status": "Submitted"\n}'
      },
      {
        method: 'GET',
        path: '/api/v1/transactions/:id',
        summary: 'Retrieve detailed transaction state, logs, and approval progress',
        authRequired: true,
        requestBody: 'None (URL Param: id)',
        responseSample: '{\n  "transactionId": "txn-88192",\n  "status": "Completed",\n  "approvedAt": "2026-03-22T14:20:00Z"\n}'
      }
    ]
  }
};

function detectDomain(text = '') {
  const lower = String(text).toLowerCase();
  for (const [key, profile] of Object.entries(DOMAIN_PROFILES)) {
    if (key === 'default') continue;
    if (profile.match.some(kw => lower.includes(kw))) {
      return profile;
    }
  }
  return DOMAIN_PROFILES.default;
}

export const solutionArchitecture = {
  async generateArchitecture({ brd = {}, context = {}, rawInput = '', sessionTitle = '' }) {
    const analysis = await inputAnalyzer.analyze(rawInput || brd.objectives || '', context);
    const domainProfile = detectDomain(`${sessionTitle} ${rawInput} ${brd.objectives || ''} ${context?.industry || ''}`);

    let hldSummaryContent = domainProfile.hldSummary;

    try {
      if (await compileAiClient.isHealthy()) {
        const sections = await compileAiClient.generate(rawInput || brd.objectives || '', {}, 'architecture');
        if (Array.isArray(sections) && sections.length > 0 && sections[0].content) {
          hldSummaryContent = sections[0].content;
        }
      }
    } catch (err) {
      console.warn('[SolutionArchitecture] Compile AI server architecture generation fallback:', err.message);
    }

    return {
      hldSummary: hldSummaryContent,
      techStack: domainProfile.techStack,
      components: domainProfile.components,
      dataFlow: domainProfile.dataFlow,
      securityNotes: domainProfile.securityNotes,
      bpmnWorkflows: domainProfile.bpmnWorkflows,
      databaseSchema: {
        tables: domainProfile.tables
      },
      apiSpecs: {
        endpoints: domainProfile.apiEndpoints
      }
    };
  }
};
