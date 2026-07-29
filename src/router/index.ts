import { createRouter, createWebHistory } from "vue-router";
import SideMenu from "@/layouts/SideMenu/SideMenu.vue";
import { setCurrentUser, getCurrentUser, getCookie } from '../utils/cookie';
import { usePermissionStore } from '@/core/permission/permissionStore';
import { usePermission } from '@/core/permission/usePermission';

import Dashboard from "@/pages/app/dashboard/index.vue";
import AppAccount from "@/pages/app/account/index.vue";
import AppAccountProfile from "@/pages/app/account/profile/index.vue";
import AppAccountPassword from "@/pages/app/account/password/index.vue";
import AppAccountEdit from "@/pages/app/account/edit/index.vue";
import AppAccountHistory from "@/pages/app/account/history/index.vue";
import AppAccountNotification from "@/pages/app/account/notification/index.vue";
import BaseInfoRulesRegulations from "@/pages/app/base-info/rules-regulations/index.vue";
import BaseInfoRulesRegulationsDeleted from "@/pages/app/base-info/rules-regulations/deleted.vue";
import BaseInfoTasks from "@/pages/app/base-info/tasks/index.vue";
import BaseInfoFramework from "@/pages/app/base-info/framework/index.vue";
import BaseInfoDomain from "@/pages/app/base-info/domain/index.vue";
import BaseInfoControl from "@/pages/app/base-info/control/index.vue";
import GovernanceGuide from "@/pages/app/governance/guide/index.vue";
import GovernanceLiaisons from "@/pages/app/governance/liaisons/index.vue";
import GovernanceLegislativeAuthority from "@/pages/app/governance/legislative-authority/index.vue";
import GovernanceLawType from "@/pages/app/governance/law-type/index.vue";
import GovernanceGeographicRegions from "@/pages/app/governance/geographic-regions/index.vue";
import GovernanceIndustry from "@/pages/app/governance/industry/index.vue";
import GovernanceKeyStakeholders from "@/pages/app/governance/key-stakeholders/index.vue";
import GovernanceOperationalUnits from "@/pages/app/governance/operational-units/index.vue";
import GovernanceOrganizationSize from "@/pages/app/governance/organization-size/index.vue";
import GovernanceOrganizationalStructure from "@/pages/app/governance/organizational-structure/index.vue";
import GovernanceProductsServices from "@/pages/app/governance/products-services/index.vue";
import GovernanceReportingBoundary from "@/pages/app/governance/reporting-boundary/index.vue";
import GovernanceSubsidiaries from "@/pages/app/governance/subsidiaries/index.vue";
import GovernanceValueChain from "@/pages/app/governance/value-chain/index.vue";
import ComplianceDashboard from "@/pages/app/compliance/dashboard/index.vue";
import CompliancePerformanceReport from "@/pages/app/compliance/performance-report/index.vue";
import ComplianceReport from "@/pages/app/compliance/report/index.vue";
import CompliancePlan from "@/pages/app/compliance/plan/index.vue";
import ComplianceTask from "@/pages/app/compliance/task/index.vue";
import ComplianceOperations from "@/pages/app/compliance/operations/index.vue";
import ComplianceDoingTask from "@/pages/app/compliance/doing-task/index.vue";
import RiskDashboard from "@/pages/app/risk/dashboard/index.vue";
import RiskPerformanceReport from "@/pages/app/risk/performance-report/index.vue";
import RiskReport from "@/pages/app/risk/report/index.vue";
import RiskOperations from "@/pages/app/risk/operations/index.vue";
import RiskDoingTask from "@/pages/app/risk/doing-task/index.vue";
import RiskList from "@/pages/app/risk/list/index.vue";
import RiskRepository from "@/pages/app/risk/repository/index.vue";
import RiskArchive from "@/pages/app/risk/archive/index.vue";
import RiskDetail from "@/pages/app/risk/detail/index.vue";
import RiskTask from "@/pages/app/risk/task/index.vue";
import EsgDashboard from "@/pages/app/esg/dashboard/index.vue";
import EsgGovernance from "@/pages/app/esg/governance/index.vue";
import EsgSocial from "@/pages/app/esg/social/index.vue";
import EsgEnvironment from "@/pages/app/esg/environment/index.vue";
import EsgReport from "@/pages/app/esg/report/index.vue";
import SustainabilityMetrics from "@/pages/app/sustainability/metrics/index.vue";
import SustainabilityAsset from "@/pages/app/sustainability/asset/index.vue";
import SustainabilityCategory from "@/pages/app/sustainability/category/index.vue";
import SustainabilityMetricsDetail from "@/pages/app/sustainability/metrics/detail/index.vue";
import SustainabilityFundamentalCapitals from "@/pages/app/sustainability/fundamental-capitals/index.vue";
import SustainabilityClaim from "@/pages/app/sustainability/claim/index.vue";
import SustainabilityIndicator from "@/pages/app/sustainability/indicator/index.vue";
import SustainabilityIndicatorForm from "@/pages/app/sustainability/indicator/IndicatorFormPage.vue";
import SustainabilityIndicatorDetail from "@/pages/app/sustainability/indicator/IndicatorDetailPage.vue";
import SustainabilityGraph from "@/pages/app/sustainability/graph/index.vue";
import ReportsBaseline from "@/pages/app/reports/baseline/index.vue";
import ReportsBaselineDetail from "@/pages/app/reports/baseline/detail/index.vue";
import ReportsBaselineDashboard from "@/pages/app/reports/baseline/dashboard/index.vue";
import ReportsComparative from "@/pages/app/reports/comparative/index.vue";
import ReportsComparativeDetail from "@/pages/app/reports/comparative/detail/index.vue";
import ReportsComparativeDashboard from "@/pages/app/reports/comparative/dashboard/index.vue";
import ReportsSustainabilityDashboard from "@/pages/app/reports/sustainability/dashboard/index.vue";
import DataEntry from "@/pages/app/data/entry/index.vue";
import DataRaw from "@/pages/app/data/raw/index.vue";
import DataLog from "@/pages/app/data/log/index.vue";
import DataProcessing from "@/pages/app/data/processing/index.vue";
import DataProcessingSecondary from "@/pages/app/data/processing-secondary/index.vue";
import DataExecutiveProcess from "@/pages/app/data/executive-process/index.vue";
import KnowledgeDocuments from "@/pages/app/knowledge/documents/index.vue";
import KnowledgeDocumentDetail from "@/pages/app/knowledge/documents/detail/index.vue";
import KnowledgeSemanticSearch from "@/pages/app/knowledge/semantic-search/index.vue";
import KnowledgeStructuredData from "@/pages/app/knowledge/structured-data/index.vue";
import KnowledgeStructuredDataDetail from "@/pages/app/knowledge/structured-data/detail/index.vue";
import KnowledgePrompts from "@/pages/app/knowledge/prompts/index.vue";
import KnowledgePromptsDetail from "@/pages/app/knowledge/prompts/detail/index.vue";
import SectionPlaceholderPage from "@/pages/app/shared/SectionPlaceholderPage.vue";
import AuthLogin from "@/pages/auth/login/index.vue";

const routes = [
    {
        path: "/",
        redirect: "/app/dashboard",
        children: [
            {
                path: "auth",
                meta: {requiresAuth: false},
                children: [
                    {
                        path: "login",
                        name: "auth-login",
                        component: AuthLogin,
                    }
                ]
            },
            {
                path: "app",
                component: SideMenu,
                meta: {requiresAuth: true},
                children: [
                    {
                        path: "dashboard",
                        name: "app-dashboard",
                        component: Dashboard,
                        meta: { breadcrumbLabel: 'menu.dashboard' },
                    },
                    {
                        path: "account",
                        name: "app-account",
                        component: AppAccount,
                        meta: { breadcrumbLabel: 'menu.profile' },
                        children: [
                            {
                                path: "profile",
                                name: "app-account-profile",
                                component: AppAccountProfile,
                                meta: { breadcrumbLabel: 'menu.profile' },
                            },
                            {
                                path: "password",
                                name: "app-account-password",
                                component: AppAccountPassword,
                                meta: { breadcrumbLabel: 'title.new-password' },
                            },
                            {
                                path: "edit",
                                name: "app-account-edit",
                                component: AppAccountEdit,
                                meta: { breadcrumbLabel: 'title.update' },
                            },
                            {
                                path: "history",
                                name: "app-account-history",
                                component: AppAccountHistory,
                                meta: { breadcrumbLabel: 'title.history' },
                            },
                            {
                                path: "notification",
                                name: "app-account-notification",
                                component: AppAccountNotification,
                                meta: { breadcrumbLabel: 'title.notification' },
                            },
                        ]
                    },
                    {
                        path: "base-info",
                        name: "app-base-info",
                        meta: { breadcrumbLabel: 'menu.base-info' },
                        children: [
                            {
                                path: "rules-regulations/deleted",
                                name: "app-base-info-rules-regulations-deleted",
                                component: BaseInfoRulesRegulationsDeleted,
                                meta: {
                                    breadcrumbLabel: 'menu.rules-regulations-deleted',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-base-info-rules-regulations',
                                            labelKey: 'menu.rules-regulations',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "rules-regulations",
                                name: "app-base-info-rules-regulations",
                                component: BaseInfoRulesRegulations,
                                meta: { breadcrumbLabel: 'menu.rules-regulations' },
                            },
                            {
                                path: "tasks",
                                name: "app-base-info-tasks",
                                component: BaseInfoTasks,
                                meta: { breadcrumbLabel: 'menu.tasks' },
                            },
                            {
                                path: "framework",
                                name: "app-base-info-framework",
                                component: BaseInfoFramework,
                                meta: { breadcrumbLabel: 'menu.framework' },
                            },
                            {
                                path: "domain",
                                name: "app-base-info-domain",
                                component: BaseInfoDomain,
                                meta: { breadcrumbLabel: 'menu.domain' },
                            },
                            {
                                path: "control",
                                name: "app-base-info-control",
                                component: BaseInfoControl,
                                meta: { breadcrumbLabel: 'menu.control' },
                            },
                        ]
                    },
                    {
                        path: "governance",
                        name: "app-governance",
                        redirect: { name: "app-governance-legislative-authority" },
                        meta: { breadcrumbLabel: 'menu.governance' },
                        children: [
                            {
                                path: "legislative-authority",
                                name: "app-governance-legislative-authority",
                                component: GovernanceLegislativeAuthority,
                                meta: { breadcrumbLabel: 'menu.governance-legislative-authority', requiredRole: 'grc_admin' },
                            },
                            {
                                path: "law-type",
                                name: "app-governance-law-type",
                                component: GovernanceLawType,
                                meta: { breadcrumbLabel: 'menu.governance-law-type', requiredRole: 'grc_admin' },
                            },
                            {
                                path: "geographic-regions",
                                name: "app-governance-geographic-regions",
                                component: GovernanceGeographicRegions,
                                meta: { breadcrumbLabel: 'menu.governance-geographic-regions' },
                            },
                            {
                                path: "industry",
                                name: "app-governance-industry",
                                component: GovernanceIndustry,
                                meta: { breadcrumbLabel: 'menu.governance-industry' },
                            },
                            {
                                path: "key-stakeholders",
                                name: "app-governance-key-stakeholders",
                                component: GovernanceKeyStakeholders,
                                meta: { breadcrumbLabel: 'menu.governance-key-stakeholders' },
                            },
                            {
                                path: "operational-units",
                                name: "app-governance-operational-units",
                                component: GovernanceOperationalUnits,
                                meta: { breadcrumbLabel: 'menu.governance-operational-units' },
                            },
                            {
                                path: "organization-size",
                                name: "app-governance-organization-size",
                                component: GovernanceOrganizationSize,
                                meta: { breadcrumbLabel: 'menu.governance-organization-size' },
                            },
                            {
                                path: "organizational-structure",
                                name: "app-governance-organizational-structure",
                                component: GovernanceOrganizationalStructure,
                                meta: { breadcrumbLabel: 'menu.governance-organizational-structure' },
                            },
                            {
                                path: "products-services",
                                name: "app-governance-products-services",
                                component: GovernanceProductsServices,
                                meta: { breadcrumbLabel: 'menu.governance-products-services' },
                            },
                            {
                                path: "reporting-boundary",
                                name: "app-governance-reporting-boundary",
                                component: GovernanceReportingBoundary,
                                meta: { breadcrumbLabel: 'menu.governance-reporting-boundary' },
                            },
                            {
                                path: "subsidiaries",
                                name: "app-governance-subsidiaries",
                                component: GovernanceSubsidiaries,
                                meta: { breadcrumbLabel: 'menu.governance-subsidiaries' },
                            },
                            {
                                path: "value-chain",
                                name: "app-governance-value-chain",
                                component: GovernanceValueChain,
                                meta: { breadcrumbLabel: 'menu.governance-value-chain' },
                            },
                            {
                                path: "liaisons",
                                name: "app-governance-liaisons",
                                component: GovernanceLiaisons,
                                meta: { breadcrumbLabel: 'menu.governance-liaisons', requiredRole: 'grc_admin' },
                            },
                            {
                                path: "guide",
                                name: "app-governance-guide",
                                component: GovernanceGuide,
                                meta: { breadcrumbLabel: 'menu.governance-guide' },
                            },
                        ],
                    },
                    {
                        path: "compliance",
                        name: "app-compliance",
                        redirect: { name: "app-compliance-dashboard" },
                        meta: { breadcrumbLabel: 'menu.compliance' },
                        children: [
                            {
                                path: "dashboard",
                                name: "app-compliance-dashboard",
                                component: ComplianceDashboard,
                                meta: { breadcrumbLabel: 'menu.dashboard' },
                            },
                            {
                                path: "operations",
                                name: "app-compliance-operations",
                                component: ComplianceOperations,
                                meta: { breadcrumbLabel: 'menu.compliance-operations' },
                            },
                            {
                                path: "doing-task",
                                name: "app-compliance-doing-task",
                                component: ComplianceDoingTask,
                                meta: {
                                    breadcrumbLabel: 'menu.compliance-doing-task',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-compliance-operations',
                                            labelKey: 'menu.compliance-operations',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "performance-report",
                                name: "app-compliance-performance-report",
                                component: CompliancePerformanceReport,
                                meta: { breadcrumbLabel: 'menu.performance-report' },
                            },
                            {
                                path: "report",
                                name: "app-compliance-report",
                                component: ComplianceReport,
                                meta: { breadcrumbLabel: 'menu.report' },
                            },
                            {
                                path: "plan",
                                name: "app-compliance-plan",
                                component: CompliancePlan,
                                meta: { breadcrumbLabel: 'menu.plan' },
                            },
                            {
                                path: "task",
                                name: "app-compliance-task",
                                component: ComplianceTask,
                                meta: { breadcrumbLabel: 'menu.compliance-task' },
                            },
                        ],
                    },
                    {
                        path: "risk",
                        name: "app-risk",
                        redirect: { name: "app-risk-dashboard" },
                        meta: { breadcrumbLabel: 'menu.risk' },
                        children: [
                            {
                                path: "dashboard",
                                name: "app-risk-dashboard",
                                component: RiskDashboard,
                                meta: { breadcrumbLabel: 'menu.dashboard' },
                            },
                            {
                                path: "operations",
                                name: "app-risk-operations",
                                component: RiskOperations,
                                meta: { breadcrumbLabel: 'menu.risk-operations' },
                            },
                            {
                                path: "doing-task",
                                name: "app-risk-doing-task",
                                component: RiskDoingTask,
                                meta: {
                                    breadcrumbLabel: 'menu.risk-doing-task',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-risk-operations',
                                            labelKey: 'menu.risk-operations',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "performance-report",
                                name: "app-risk-performance-report",
                                component: RiskPerformanceReport,
                                meta: { breadcrumbLabel: 'menu.performance-report' },
                            },
                            {
                                path: "report",
                                name: "app-risk-report",
                                component: RiskReport,
                                meta: { breadcrumbLabel: 'menu.report' },
                            },
                            {
                                path: "list",
                                name: "app-risk-list",
                                component: RiskList,
                                meta: { breadcrumbLabel: 'menu.risk-operations' },
                            },
                            {
                                path: "repository",
                                name: "app-risk-repository",
                                component: RiskRepository,
                                meta: { breadcrumbLabel: 'menu.risk-repository' },
                            },
                            {
                                path: "archive",
                                name: "app-risk-archive",
                                component: RiskArchive,
                                meta: { breadcrumbLabel: 'menu.risk-archive' },
                            },
                            {
                                path: "task",
                                name: "app-risk-task",
                                component: RiskTask,
                                meta: { breadcrumbLabel: 'menu.risk-task' },
                            },
                            {
                                path: "detail/:slug",
                                name: "app-risk-detail",
                                component: RiskDetail,
                                meta: {
                                    breadcrumbLabel: 'menu.risk-detail',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-risk-list',
                                            labelKey: 'menu.risk-operations',
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                    {
                        path: "data",
                        name: "app-data",
                        redirect: { name: "app-data-raw" },
                        meta: { breadcrumbLabel: 'menu.data' },
                        children: [
                            {
                                path: "raw",
                                name: "app-data-raw",
                                component: DataRaw,
                                meta: { breadcrumbLabel: 'menu.data-raw' },
                            },
                            {
                                path: "entry",
                                name: "app-data-entry",
                                component: DataEntry,
                                meta: { breadcrumbLabel: 'menu.data-entry' },
                            },
                            {
                                path: "log",
                                name: "app-data-log",
                                component: DataLog,
                                meta: { breadcrumbLabel: 'menu.data-log' },
                            },
                            {
                                path: "processing",
                                name: "app-data-processing",
                                component: DataProcessing,
                                meta: { breadcrumbLabel: 'menu.data-processing' },
                            },
                            {
                                path: "processing-secondary",
                                name: "app-data-processing-secondary",
                                component: DataProcessingSecondary,
                                meta: { breadcrumbLabel: 'menu.data-processing-indicator' },
                            },
                            {
                                path: "executive-process",
                                name: "app-data-executive-process",
                                component: DataExecutiveProcess,
                                meta: { breadcrumbLabel: 'menu.data-executive-process' },
                            },
                        ],
                    },
                    {
                        path: "esg",
                        name: "app-esg",
                        redirect: { name: "app-esg-dashboard" },
                        meta: { breadcrumbLabel: 'menu.esg' },
                        children: [
                            {
                                path: "dashboard",
                                name: "app-esg-dashboard",
                                component: EsgDashboard,
                                meta: { breadcrumbLabel: 'menu.esg-dashboard' },
                            },
                            {
                                path: "governance",
                                name: "app-esg-governance",
                                component: EsgGovernance,
                                meta: { breadcrumbLabel: 'menu.esg-governance' },
                            },
                            {
                                path: "social",
                                name: "app-esg-social",
                                component: EsgSocial,
                                meta: { breadcrumbLabel: 'menu.esg-social' },
                            },
                            {
                                path: "environment",
                                name: "app-esg-environment",
                                component: EsgEnvironment,
                                meta: { breadcrumbLabel: 'menu.esg-environment' },
                            },
                            {
                                path: "report",
                                name: "app-esg-report",
                                component: EsgReport,
                                meta: { breadcrumbLabel: 'menu.esg-report' },
                            },
                        ],
                    },
                    {
                        path: "sustainability",
                        name: "app-sustainability",
                        redirect: { name: "app-sustainability-category" },
                        meta: { breadcrumbLabel: 'menu.sustainability' },
                        children: [
                            {
                                path: "category",
                                name: "app-sustainability-category",
                                component: SustainabilityCategory,
                                meta: { breadcrumbLabel: 'menu.sustainability-category', requiredRole: 'grc_admin' },
                            },
                            {
                                path: "fundamental-capitals",
                                name: "app-sustainability-fundamental-capitals",
                                component: SustainabilityFundamentalCapitals,
                                meta: { breadcrumbLabel: 'menu.sustainability-fundamental-capitals' },
                            },
                            {
                                path: "claim",
                                name: "app-sustainability-claim",
                                component: SustainabilityClaim,
                                meta: { breadcrumbLabel: 'menu.sustainability-claim' },
                            },
                            {
                                path: "indicator",
                                name: "app-sustainability-indicator",
                                component: SustainabilityIndicator,
                                meta: { breadcrumbLabel: 'menu.sustainability-indicator' },
                            },
                            {
                                path: "indicator/create",
                                name: "app-sustainability-indicator-create",
                                component: SustainabilityIndicatorForm,
                                meta: { breadcrumbLabel: 'sustainability-indicator-page.add' },
                            },
                            {
                                path: "indicator/:slug",
                                name: "app-sustainability-indicator-detail",
                                component: SustainabilityIndicatorDetail,
                                meta: { breadcrumbLabel: 'sustainability-indicator-page.detail' },
                            },
                            {
                                path: "indicator/:slug/edit",
                                name: "app-sustainability-indicator-edit",
                                component: SustainabilityIndicatorForm,
                                meta: { breadcrumbLabel: 'sustainability-indicator-page.edit' },
                            },
                            {
                                path: "graph",
                                name: "app-sustainability-graph",
                                component: SustainabilityGraph,
                                meta: { breadcrumbLabel: 'menu.sustainability-graph' },
                            },
                            {
                                path: "metrics",
                                name: "app-sustainability-metrics",
                                component: SustainabilityMetrics,
                                meta: { breadcrumbLabel: 'menu.sustainability-metrics' },
                            },
                            {
                                path: "metrics/:slug",
                                name: "app-sustainability-metrics-detail",
                                component: SustainabilityMetricsDetail,
                                meta: {
                                    breadcrumbLabel: 'menu.sustainability-metrics-detail',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-sustainability-metrics',
                                            labelKey: 'menu.sustainability-metrics',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "asset",
                                name: "app-sustainability-asset",
                                component: SustainabilityAsset,
                                meta: { breadcrumbLabel: 'menu.sustainability-asset' },
                            },
                        ],
                    },
                    {
                        path: "reports",
                        name: "app-reports",
                        redirect: { name: "app-reports-baseline" },
                        meta: { breadcrumbLabel: 'menu.reports' },
                        children: [
                            {
                                path: "baseline",
                                name: "app-reports-baseline",
                                component: ReportsBaseline,
                                meta: { breadcrumbLabel: 'menu.reports-baseline' },
                            },
                            {
                                path: "baseline/:slug",
                                name: "app-reports-baseline-detail",
                                component: ReportsBaselineDetail,
                                meta: { breadcrumbLabel: 'reports.baseline-report' },
                            },
                            {
                                path: "baseline/dashboard/:slug",
                                name: "app-reports-baseline-dashboard",
                                component: ReportsBaselineDashboard,
                                meta: { breadcrumbLabel: 'reports.baseline-dashboard' },
                            },
                            {
                                path: "comparative",
                                name: "app-reports-comparative",
                                component: ReportsComparative,
                                meta: { breadcrumbLabel: 'menu.reports-comparative' },
                            },
                            {
                                path: "comparative/:slug",
                                name: "app-reports-comparative-detail",
                                component: ReportsComparativeDetail,
                                meta: { breadcrumbLabel: 'reports.comparative-report' },
                            },
{
                            path: "comparative/dashboard/:slug",
                            name: "app-reports-comparative-dashboard",
                            component: ReportsComparativeDashboard,
                            meta: { breadcrumbLabel: 'reports.comparative-dashboard' },
                        },
                        {
                            path: "sustainability/dashboard",
                            name: "app-reports-sustainability-dashboard",
                            component: ReportsSustainabilityDashboard,
                            meta: { breadcrumbLabel: 'reports.sustainability-dashboard' },
                        },
                    ],
                },
                    {
                        path: "knowledge",
                        name: "app-knowledge",
                        redirect: { name: "app-knowledge-documents" },
                        meta: { breadcrumbLabel: 'menu.knowledge' },
                        children: [
                            {
                                path: "documents",
                                name: "app-knowledge-documents",
                                component: KnowledgeDocuments,
                                meta: { breadcrumbLabel: 'menu.knowledge-documents' },
                            },
                            {
                                path: "semantic-search",
                                name: "app-knowledge-semantic-search",
                                component: KnowledgeSemanticSearch,
                                meta: { breadcrumbLabel: 'menu.knowledge-semantic-search' },
                            },
                            {
                                path: "structured-data",
                                name: "app-knowledge-structured-data",
                                component: KnowledgeStructuredData,
                                meta: { breadcrumbLabel: 'menu.knowledge-structured-data' },
                            },
                            {
                                path: "structured-data/:slug",
                                name: "app-knowledge-structured-data-detail",
                                component: KnowledgeStructuredDataDetail,
                                meta: {
                                    breadcrumbLabel: 'structured-data.detail-title',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-knowledge-structured-data',
                                            labelKey: 'menu.knowledge-structured-data',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "prompts",
                                name: "app-knowledge-prompts",
                                component: KnowledgePrompts,
                                meta: { breadcrumbLabel: 'menu.knowledge-prompts' },
                            },
                            {
                                path: "prompts/:slug",
                                name: "app-knowledge-prompts-detail",
                                component: KnowledgePromptsDetail,
                                meta: {
                                    breadcrumbLabel: 'prompts.detail-title',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-knowledge-prompts',
                                            labelKey: 'menu.knowledge-prompts',
                                        },
                                    ],
                                },
                            },
                            {
                                path: "documents/:slug",
                                name: "app-knowledge-document-detail",
                                component: KnowledgeDocumentDetail,
                                meta: {
                                    breadcrumbLabel: 'documents.detail-title',
                                    breadcrumbPrefix: [
                                        {
                                            routeName: 'app-knowledge-documents',
                                            labelKey: 'menu.knowledge-documents',
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ]
            },

        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || {left: 0, top: 0};
    },
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        const utn = getCookie('utn');
        const user = getCurrentUser();
        if (utn && user) {
            const permStore = usePermissionStore();
            permStore.init();
            const permission = to.meta.permission as string | undefined;
            const requiredRole = to.meta.requiredRole as string | undefined;
            
            if (permission) {
                const { canAccessRoute } = usePermission();
                if (canAccessRoute(permission)) {
                    next();
                } else {
                    next({ name: 'app-dashboard' });
                }
            } else if (requiredRole) {
                const { hasRole } = usePermission();
                if (hasRole(requiredRole)) {
                    next();
                } else {
                    next({ name: 'app-dashboard' });
                }
            } else {
                next();
            }
        } else {
            setCurrentUser(null);
            next({
                path: '/auth/login',
                query: { redirect: to.fullPath },
            });
        }
    } else {
        next();
    }
});

export default router;
