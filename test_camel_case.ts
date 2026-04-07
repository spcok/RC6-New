
import { toCamelCase } from './src/lib/dataMapping';

const testCases = [
  { input: 'animal_id', expected: 'animalId' },
  { input: 'log_date', expected: 'logDate' },
  { input: 'due_date', expected: 'dueDate' },
  { input: 'weight_unit', expected: 'weightUnit' },
  { input: 'is_deleted', expected: 'isDeleted' },
  { input: 'user_initials', expected: 'userInitials' },
  { input: 'created_by', expected: 'createdBy' },
  { input: 'latin_name', expected: 'latinName' },
  { input: 'disposition_status', expected: 'dispositionStatus' },
  { input: 'origin_location', expected: 'originLocation' },
  { input: 'transfer_date', expected: 'transferDate' },
  { input: 'microchip_id', expected: 'microchipId' },
  { input: 'destination_location', expected: 'destinationLocation' },
  { input: 'task_type', expected: 'taskType' },
  { input: 'enclosure_id', expected: 'enclosureId' },
  { input: 'date_logged', expected: 'dateLogged' },
  { input: 'sire_id', expected: 'sireId' },
  { input: 'dam_id', expected: 'damId' },
  { input: 'entity_type', expected: 'entityType' },
  { input: 'census_count', expected: 'censusCount' },
  { input: 'transfer_type', expected: 'transferType' },
  { input: 'cites_article_10_ref', expected: 'citesArticle10Ref' },
  { input: 'integrity_seal', expected: 'integritySeal' },
  { input: 'start_time', expected: 'startTime' },
  { input: 'user_name', expected: 'userName' },
  { input: 'end_time', expected: 'endTime' },
  { input: 'assigned_area', expected: 'assignedArea' },
  { input: 'shift_type', expected: 'shiftType' },
  { input: 'staff_name', expected: 'staffName' },
  { input: 'clock_in', expected: 'clockIn' },
  { input: 'clock_out', expected: 'clockOut' },
  { input: 'total_hours', expected: 'totalHours' },
  { input: 'staff_id', expected: 'staffId' },
  { input: 'reported_by', expected: 'reportedBy' },
  { input: 'reporter_id', expected: 'reporterId' },
  { input: 'created_at', expected: 'createdAt' },
  { input: 'org_name', expected: 'orgName' },
  { input: 'contact_email', expected: 'contactEmail' },
  { input: 'contact_phone', expected: 'contactPhone' },
  { input: 'zla_license_number', expected: 'zlaLicenseNumber' },
  { input: 'official_website', expected: 'officialWebsite' },
  { input: 'adoption_portal', expected: 'adoptionPortal' },
];

testCases.forEach(({ input, expected }) => {
  const result = toCamelCase(input);
  if (result !== expected) {
    console.error(`Failed: ${input} -> Expected ${expected}, got ${result}`);
  } else {
    console.log(`Passed: ${input} -> ${result}`);
  }
});
