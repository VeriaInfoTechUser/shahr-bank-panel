export interface SourceDataSourceType {
  slug: string;
  key: string;
  title: string;
}

export const sourceDataSourceTypes: SourceDataSourceType[] = [
  { slug: 'codebase_repository', key: 'codebase_repository', title: 'source-data-source-type.codebase_repository' },
  { slug: 'compliance_log', key: 'compliance_log', title: 'source-data-source-type.compliance_log' },
  { slug: 'cybersecurity_siem', key: 'cybersecurity_siem', title: 'source-data-source-type.cybersecurity_siem' },
  { slug: 'data_repository', key: 'data_repository', title: 'source-data-source-type.data_repository' },
  { slug: 'department_unit', key: 'department_unit', title: 'source-data-source-type.department_unit' },
  { slug: 'discharge_point', key: 'discharge_point', title: 'source-data-source-type.discharge_point' },
  { slug: 'emission_point', key: 'emission_point', title: 'source-data-source-type.emission_point' },
  { slug: 'emission_stack', key: 'emission_stack', title: 'source-data-source-type.emission_stack' },
  { slug: 'energy_source', key: 'energy_source', title: 'source-data-source-type.energy_source' },
  { slug: 'equipment_data_source', key: 'equipment_data_source', title: 'source-data-source-type.equipment_data_source' },
  { slug: 'facility', key: 'facility', title: 'source-data-source-type.facility' },
  { slug: 'facility_meter', key: 'facility_meter', title: 'source-data-source-type.facility_meter' },
  { slug: 'facility_site', key: 'facility_site', title: 'source-data-source-type.facility_site' },
  { slug: 'geographical_site', key: 'geographical_site', title: 'source-data-source-type.geographical_site' },
  { slug: 'grievance_channel', key: 'grievance_channel', title: 'source-data-source-type.grievance_channel' },
  { slug: 'incident_log', key: 'incident_log', title: 'source-data-source-type.incident_log' },
  { slug: 'ip_registry', key: 'ip_registry', title: 'source-data-source-type.ip_registry' },
  { slug: 'legal_case_log', key: 'legal_case_log', title: 'source-data-source-type.legal_case_log' },
  { slug: 'monitoring_station', key: 'monitoring_station', title: 'source-data-source-type.monitoring_station' },
  { slug: 'none', key: 'none', title: 'source-data-source-type.none' },
  { slug: 'payroll_system', key: 'payroll_system', title: 'source-data-source-type.payroll_system' },
  { slug: 'portfolio_ledger', key: 'portfolio_ledger', title: 'source-data-source-type.portfolio_ledger' },
  { slug: 'production_line', key: 'production_line', title: 'source-data-source-type.production_line' },
  { slug: 'project_profile', key: 'project_profile', title: 'source-data-source-type.project_profile' },
  { slug: 'risk_register', key: 'risk_register', title: 'source-data-source-type.risk_register' },
  { slug: 'server_node', key: 'server_node', title: 'source-data-source-type.server_node' },
  { slug: 'software_repository', key: 'software_repository', title: 'source-data-source-type.software_repository' },
  { slug: 'supplier_profile', key: 'supplier_profile', title: 'source-data-source-type.supplier_profile' },
  { slug: 'timesheet_system', key: 'timesheet_system', title: 'source-data-source-type.timesheet_system' },
  { slug: 'treatment_plant', key: 'treatment_plant', title: 'source-data-source-type.treatment_plant' },
  { slug: 'vendor_profile', key: 'vendor_profile', title: 'source-data-source-type.vendor_profile' },
  { slug: 'waste_storage', key: 'waste_storage', title: 'source-data-source-type.waste_storage' },
  { slug: 'water_inlet', key: 'water_inlet', title: 'source-data-source-type.water_inlet' },
];
