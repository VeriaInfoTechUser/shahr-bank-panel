export interface SourceDataSourceType {
  slug: string;
  key: string;
  title: string;
}

export const sourceDataSourceTypes: SourceDataSourceType[] = [
  { slug: 'codebase_repository', key: 'codebase_repository', title: 'source-asset-type.codebase_repository' },
  { slug: 'compliance_log', key: 'compliance_log', title: 'source-asset-type.compliance_log' },
  { slug: 'cybersecurity_siem', key: 'cybersecurity_siem', title: 'source-asset-type.cybersecurity_siem' },
  { slug: 'data_repository', key: 'data_repository', title: 'source-asset-type.data_repository' },
  { slug: 'department_unit', key: 'department_unit', title: 'source-asset-type.department_unit' },
  { slug: 'discharge_point', key: 'discharge_point', title: 'source-asset-type.discharge_point' },
  { slug: 'emission_point', key: 'emission_point', title: 'source-asset-type.emission_point' },
  { slug: 'emission_stack', key: 'emission_stack', title: 'source-asset-type.emission_stack' },
  { slug: 'energy_source', key: 'energy_source', title: 'source-asset-type.energy_source' },
  { slug: 'equipment_data_source', key: 'equipment_data_source', title: 'source-asset-type.equipment_data_source' },
  { slug: 'facility', key: 'facility', title: 'source-asset-type.facility' },
  { slug: 'facility_meter', key: 'facility_meter', title: 'source-asset-type.facility_meter' },
  { slug: 'facility_site', key: 'facility_site', title: 'source-asset-type.facility_site' },
  { slug: 'geographical_site', key: 'geographical_site', title: 'source-asset-type.geographical_site' },
  { slug: 'grievance_channel', key: 'grievance_channel', title: 'source-asset-type.grievance_channel' },
  { slug: 'incident_log', key: 'incident_log', title: 'source-asset-type.incident_log' },
  { slug: 'ip_registry', key: 'ip_registry', title: 'source-asset-type.ip_registry' },
  { slug: 'legal_case_log', key: 'legal_case_log', title: 'source-asset-type.legal_case_log' },
  { slug: 'monitoring_station', key: 'monitoring_station', title: 'source-asset-type.monitoring_station' },
  { slug: 'none', key: 'none', title: 'source-asset-type.none' },
  { slug: 'payroll_system', key: 'payroll_system', title: 'source-asset-type.payroll_system' },
  { slug: 'portfolio_ledger', key: 'portfolio_ledger', title: 'source-asset-type.portfolio_ledger' },
  { slug: 'production_line', key: 'production_line', title: 'source-asset-type.production_line' },
  { slug: 'project_profile', key: 'project_profile', title: 'source-asset-type.project_profile' },
  { slug: 'risk_register', key: 'risk_register', title: 'source-asset-type.risk_register' },
  { slug: 'server_node', key: 'server_node', title: 'source-asset-type.server_node' },
  { slug: 'software_repository', key: 'software_repository', title: 'source-asset-type.software_repository' },
  { slug: 'supplier_profile', key: 'supplier_profile', title: 'source-asset-type.supplier_profile' },
  { slug: 'timesheet_system', key: 'timesheet_system', title: 'source-asset-type.timesheet_system' },
  { slug: 'treatment_plant', key: 'treatment_plant', title: 'source-asset-type.treatment_plant' },
  { slug: 'vendor_profile', key: 'vendor_profile', title: 'source-asset-type.vendor_profile' },
  { slug: 'waste_storage', key: 'waste_storage', title: 'source-asset-type.waste_storage' },
  { slug: 'water_inlet', key: 'water_inlet', title: 'source-asset-type.water_inlet' },
];
