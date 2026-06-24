import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const LOGO_MODULE = require('@/assets/images/bmv_internal_logo.png');

export async function loadPdfLogoBase64(): Promise<string> {
  try {
    const asset = Asset.fromModule(LOGO_MODULE);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return '';

    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    console.warn('[PDF] Logo load failed:', err);
    return '';
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared print layout: large logo header + page footer on every page. */
export const PDF_PRINT_BASE_STYLES = `
  @page {
    size: A4;
    margin: 124px 24px 52px 24px;
  }
  * { box-sizing: border-box; }
  html, body {
    font-family: Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pdf-page-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 108px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 14px 24px 10px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
    z-index: 9999;
  }
  .pdf-page-header img {
    height: 90px;
    width: auto;
    max-width: 340px;
    object-fit: contain;
    display: block;
  }
  .pdf-page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #9ca3af;
    background: #ffffff;
    border-top: 1px solid #f0f0f0;
    z-index: 9999;
  }
  .pdf-page-footer::after {
    content: "Page " counter(page) " of " counter(pages);
  }
  .pdf-body {
    padding-top: 0;
    overflow: visible !important;
  }
`;

export function buildPdfPageHeader(logoBase64: string): string {
  if (!logoBase64) return '';
  const img = '<img src="data:image/png;base64,' + logoBase64 + '" alt="BookMyVendors" />';
  return '<div class="pdf-page-header">' + img + '</div>';
}

export function buildPdfPageFooter(): string {
  return '<div class="pdf-page-footer"></div>';
}

export function buildPdfDocumentHtml(options: {
  title: string;
  styles: string;
  body: string;
  logoBase64: string;
}): string {
  const { title, styles, body, logoBase64 } = options;

  return (
    '<html><head>' +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<title>' + escapeHtml(title) + '</title>' +
    '<style>' + PDF_PRINT_BASE_STYLES + styles + '</style>' +
    '</head><body>' +
    buildPdfPageHeader(logoBase64) +
    buildPdfPageFooter() +
    '<div class="pdf-body">' + body + '</div>' +
    '</body></html>'
  );
}

export type ChecklistPdfCategory = {
  title: string;
  items: {
    task: string;
    priority?: string | null;
    is_completed?: boolean;
  }[];
};

function buildChecklistRepeatHeaderRow(
  eventName: string,
  totalSteps: number,
  userName: string,
  generatedDate: string,
  logoBase64: string
): string {
  const stepsLabel = totalSteps + ' Step' + (totalSteps === 1 ? '' : 's');
  const logoHtml = logoBase64
    ? '<img src="data:image/png;base64,' + logoBase64 + '" alt="BookMyVendors" />'
    : '';

  return (
    '<tr class="pdf-repeat-header-row">' +
    '<td class="pdf-header-info">' +
    '<span class="doc-title">' + escapeHtml(eventName) + ' Checklist</span>' +
    '<span class="doc-dot"></span>' +
    '<span class="doc-subtitle">' + stepsLabel + '</span>' +
    '<span class="doc-dot"></span>' +
    '<span class="doc-meta">' + escapeHtml(userName) + ', ' + escapeHtml(generatedDate) + '</span>' +
    '</td>' +
    '<td class="pdf-header-logo">' + logoHtml + '</td>' +
    '</tr>'
  );
}

export function buildChecklistPdfHtml(options: {
  eventName: string;
  userName: string;
  logoBase64: string;
  categories: ChecklistPdfCategory[];
}): string {
  const { eventName, userName, logoBase64, categories } = options;
  const totalSteps = categories.length;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const categoryBlocks = categories
    .map((cat) => {
      const taskCount = cat.items.length;
      const tasksHtml = cat.items
        .map((item) => {
          const done = item.is_completed;
          const priority = escapeHtml(item.priority || 'medium');
          const task = escapeHtml(item.task);
          const checkClass = done ? 'checkbox-box checked' : 'checkbox-box';
          return (
            '<table class="task-card" cellpadding="0" cellspacing="0">' +
            '<tr>' +
            '<td class="task-check-td"><div class="' + checkClass + '"></div></td>' +
            '<td class="task-text-td' + (done ? ' task-done' : '') + '">' + task + '</td>' +
            '<td class="task-priority-td">' + priority + '</td>' +
            '</tr></table>'
          );
        })
        .join('');

      return (
        '<section class="category-section">' +
        '<div class="category-bar">' +
        '<span class="category-bar-title">' + escapeHtml(cat.title) + '</span>' +
        '<span class="category-bar-count">' + taskCount + ' Task' + (taskCount === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<div class="category-tasks">' + tasksHtml + '</div>' +
        '</section>'
      );
    })
    .join('');

  const printStyles = `
    @page { size: A4; margin: 20px 24px 28px 24px; }
    * { box-sizing: border-box; }
    html, body {
      font-family: Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-print-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    .pdf-repeat-header-row td {
      vertical-align: middle;
      padding: 12px 0 14px;
      border-bottom: 1px solid #e5e7eb;
      background: #ffffff;
    }
    .pdf-header-info {
      width: 58%;
      white-space: nowrap;
    }
    .pdf-header-info .doc-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
      display: inline;
    }
    .pdf-header-info .doc-subtitle,
    .pdf-header-info .doc-meta {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      display: inline;
    }
    .pdf-header-info .doc-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      margin: 0 10px;
      border-radius: 50%;
      background: #d1d5db;
      vertical-align: middle;
    }
    .pdf-header-logo {
      width: 42%;
      text-align: right;
      vertical-align: middle;
    }
    .pdf-header-logo img {
      height: 72px;
      width: auto;
      max-width: 300px;
      object-fit: contain;
      display: inline-block;
    }
    .pdf-repeat-footer {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      padding: 12px 0 4px;
      border-top: 1px solid #f0f0f0;
      background: #ffffff;
    }
    .pdf-repeat-footer::after {
      content: "Page " counter(page) " of " counter(pages);
    }
    .pdf-content-cell {
      vertical-align: top;
      padding: 20px 0 0;
    }
  `;

  const styles = `
    .category-section {
      margin-bottom: 28px;
      page-break-inside: auto;
      break-inside: auto;
    }
    .category-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-radius: 14px;
      background: linear-gradient(90deg, #1e3a8a 0%, #4f46e5 55%, #7c3aed 100%);
      color: #ffffff;
      margin-bottom: 14px;
      margin-top: 8px;
    }
    .category-bar-title {
      font-size: 17px;
      font-weight: 700;
    }
    .category-bar-count {
      font-size: 14px;
      font-weight: 600;
      opacity: 0.95;
    }
    .category-tasks {
      display: block;
      padding-top: 6px;
    }
    .task-card {
      width: 100%;
      margin: 0 0 14px 0;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #ffffff;
      border-collapse: collapse;
    }
    .task-check-td {
      width: 48px;
      padding: 16px 0 16px 16px;
      vertical-align: middle;
    }
    .task-text-td {
      padding: 16px 12px;
      font-size: 15px;
      color: #111827;
      line-height: 1.4;
      vertical-align: middle;
    }
    .task-priority-td {
      width: 88px;
      padding: 16px 16px 16px 0;
      font-size: 13px;
      font-weight: 600;
      color: #7c3aed;
      text-transform: capitalize;
      text-align: right;
      vertical-align: middle;
      white-space: nowrap;
    }
    .checkbox-box {
      width: 22px;
      height: 22px;
      min-width: 22px;
      min-height: 22px;
      border: 2px solid #4b5563;
      border-radius: 5px;
      background: #ffffff;
      display: block;
      overflow: visible;
      position: relative;
    }
    .checkbox-box.checked {
      background: #7c3aed;
      border-color: #7c3aed;
    }
    .checkbox-box.checked::after {
      content: "";
      position: absolute;
      left: 7px;
      top: 3px;
      width: 5px;
      height: 11px;
      border: solid #ffffff;
      border-width: 0 2.5px 2.5px 0;
      transform: rotate(45deg);
    }
    .task-done {
      text-decoration: line-through;
      color: #9ca3af;
    }
  `;

  const headerRow = buildChecklistRepeatHeaderRow(
    eventName,
    totalSteps,
    userName,
    generatedDate,
    logoBase64
  );

  return (
    '<html><head>' +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<title>' + escapeHtml(eventName) + ' Checklist</title>' +
    '<style>' + printStyles + styles + '</style>' +
    '</head><body>' +
    '<table class="pdf-print-table" cellpadding="0" cellspacing="0">' +
    '<thead>' + headerRow + '</thead>' +
    '<tfoot><tr><td colspan="2" class="pdf-repeat-footer"></td></tr></tfoot>' +
    '<tbody><tr><td colspan="2" class="pdf-content-cell">' + categoryBlocks + '</td></tr></tbody>' +
    '</table>' +
    '</body></html>'
  );
}
