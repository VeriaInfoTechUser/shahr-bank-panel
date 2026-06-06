#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load raw data
const rawJsonPath = path.join(__dirname, '../src/assets/response-content-report-get.json');
const rawData = JSON.parse(fs.readFileSync(rawJsonPath, 'utf8'));
const items = rawData.data.list;

// Transform function
function transformListToReport(items) {
  const environmental = {};
  const social = {};
  const governance = {};
  const keyFigures = [];
  const keyFigureSlugs = new Set();

  // Hardcoded important KPIs to prioritize
  const importantKpis = [
    'total-employees-count',
    'ghg-total-emissions',
    'climate-goals-achievement',
    'energy-total-consumption',
    'employee-training-hours',
    'board-attendance-rate',
    'social-investment',
    'climate-risk-assessment-coverage',
    'work-related-fatalities',
  ];

  // Group items by source
  const bySource = {
    environmental: items.filter(item => item.source === 'environmental'),
    social: items.filter(item => item.source === 'social'),
    governance: items.filter(item => item.source === 'governance'),
  };

  // Process each section
  processSection(bySource.environmental, environmental, keyFigures, keyFigureSlugs, importantKpis);
  processSection(bySource.social, social, keyFigures, keyFigureSlugs, importantKpis);
  processSection(bySource.governance, governance, keyFigures, keyFigureSlugs, importantKpis);

  return {
    meta: {
      generated_at: new Date().toISOString(),
      reporting_year: 1405,
    },
    key_figures: keyFigures.slice(0, 9),
    environmental,
    social,
    governance,
    narratives: {
      about_report:
        'گزارش پایداری سال ۱۴۰۵ بر اساس استانداردهای بین‌المللی GRI و SASB تهیه شده است. این گزارش عملکرد سازمان را در سه حوزه زیست‌محیطی، اجتماعی و حاکمیتی به صورت جامع پوشش می‌دهد.',
      environmental:
        'سازمان در حوزه محیط‌زیست اقدامات معنادی انجام داده است. کاهش مصرف انرژی، کنترل انتشار گازهای گلخانه‌ای و مدیریت پایدار منابع آب از اولویت‌های اصلی سازمان است.',
      social:
        'در حوزه اجتماعی، سازمان به تنوع و شمول، سلامت و ایمنی کارکنان، و توسعه نیروی کار توجه ویژه دارد. برنامه‌های آموزشی جامع و بیمه پوشش‌دهنده نشان‌دهنده تعهد سازمان به رفاه کارکنان است.',
      governance:
        'ساختار حاکمیتی سازمان بر شفافیت، پاسخگویی و کنترل ریسک استوار است. حضور فعال هیئت‌مدیره و سیستم‌های کنترلی قوی پایه‌های حاکمیت سالم را تشکیل می‌دهند.',
      report_conclusion:
        'سازمان متعهد به توسعه پایدار و بهبود مستمر عملکرد ESG است. هدف‌گذاری واضح، نظارت منظم و گزارش‌دهی شفاف راه رفتن سازمان به سمت پایداری را هموار می‌کنند.',
    },
  };
}

function processSection(items, section, keyFigures, keyFigureSlugs, importantKpis) {
  const controls = items.filter(item => item.type === 'control' && item.answer !== null);

  // Group controls by parent_slug (domain)
  const controlsByDomain = {};
  controls.forEach(control => {
    const parent = control.parent_slug || 'general';
    if (!controlsByDomain[parent]) {
      controlsByDomain[parent] = [];
    }
    controlsByDomain[parent].push(control);
  });

  // Populate section with grouped data
  Object.entries(controlsByDomain).forEach(([parentSlug, domainControls]) => {
    // Extract domain key (short form)
    const domainKey = extractDomainKey(parentSlug);

    if (!section[domainKey]) {
      section[domainKey] = [];
    }

    domainControls.forEach(control => {
      section[domainKey].push({
        id: control.slug,
        title: control.title,
        summary: control.summary,
        description: control.description,
        value: control.answer,
        unit: control.answer_unit,
        code: control.metric_code || control.kpi_code,
        status: control.answer_status,
      });

      // Add to key figures if it's a numeric value and not already added
      if (typeof control.answer === 'number' && !keyFigureSlugs.has(control.slug)) {
        keyFigures.push({
          code: control.metric_code || control.kpi_code || control.slug,
          label: control.summary || control.title,
          value: control.answer,
          unit: control.answer_unit || '',
          priority: importantKpis.includes(control.slug) ? 0 : 1,
        });
        keyFigureSlugs.add(control.slug);
      }
    });
  });
}

function extractDomainKey(parentSlug) {
  // Extract first word as domain key
  const parts = parentSlug.split('-');
  return parts[0] || parentSlug;
}

// Transform and save
const transformed = transformListToReport(items);

// Sort key figures by priority and limit to 9
transformed.key_figures.sort((a, b) => (a.priority || 1) - (b.priority || 1));
transformed.key_figures = transformed.key_figures.slice(0, 9);

// Save to file
const outputPath = path.join(__dirname, '../docs/esg-report/report-data.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2), 'utf8');

console.log('✅ Report data transformed and saved to:', outputPath);
console.log('Key figures:', transformed.key_figures.length);
console.log('Environmental domains:', Object.keys(transformed.environmental).length);
console.log('Social domains:', Object.keys(transformed.social).length);
console.log('Governance domains:', Object.keys(transformed.governance).length);
