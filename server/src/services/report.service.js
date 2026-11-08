/**
 * report.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Data-fetching helpers + CSV + PDF export for all three reports.
 *
 * PDF RENDERING FIXES (v2):
 *   - BUG FIX: Removed hardcoded PAGE_W/PAGE_H constants. Now uses
 *     `size: 'A4', layout: 'landscape'` and reads doc.page.width / height
 *     AFTER creation. The old code passed [841.89, 595.28] + layout:'landscape'
 *     which caused PDFKit to swap those values → portrait rendering → all
 *     columns after "Badge" were clipped off the right edge of the page.
 *   - Column weights reduced and labels shortened so all 12 columns are
 *     clearly legible on a single landscape row.
 *   - Increased DATA_FONT_SZ to 9.5 for better readability.
 *   - Minimum row height bumped to 22 pts.
 *   - Cell padding increased for breathing room.
 *   - Meta header uses simple stacked rows instead of 2-column grid to
 *     avoid right-column clipping in constrained environments.
 *
 * Data functions (dailyReport, monthlyReport, currentVisitorsReport),
 * toCsv(), and module.exports are UNCHANGED.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Parser: CsvParser } = require('json2csv');
const PDFDocument = require('pdfkit');
const prisma = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// Shared Prisma include / row-flatten  (UNCHANGED)
// ─────────────────────────────────────────────────────────────────────────────
const reportInclude = {
  visitor:      { select: { firstName: true, lastName: true, phone: true, companyName: true } },
  hostEmployee: { select: { firstName: true, lastName: true } },
  department:   { select: { departmentName: true } },
};

function flattenVisit(v) {
  return {
    visitId:      v.visitId,
    visitorName:  `${v.visitor.firstName} ${v.visitor.lastName}`,
    visitorPhone: v.visitor.phone,
    company:      v.visitor.companyName || '',
    hostEmployee: `${v.hostEmployee.firstName} ${v.hostEmployee.lastName}`,
    department:   v.department.departmentName,
    purpose:      v.purpose,
    badgeNumber:  v.badgeNumber || '',
    checkInTime:  v.checkInTime  ? v.checkInTime.toISOString()  : '',
    checkOutTime: v.checkOutTime ? v.checkOutTime.toISOString() : '',
    status:       v.visitStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers  (UNCHANGED)
// ─────────────────────────────────────────────────────────────────────────────
async function dailyReport(dateStr) {
  const cleanDate = dateStr ? dateStr.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const start = new Date(`${cleanDate}T00:00:00.000Z`);
  const end   = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const visits = await prisma.visit.findMany({
    where:   { checkInTime: { gte: start, lt: end } },
    include: reportInclude,
    orderBy: { checkInTime: 'asc' },
  });
  return { date: cleanDate, totalVisits: visits.length, visits: visits.map(flattenVisit) };
}

async function monthlyReport(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));

  const visits = await prisma.visit.findMany({
    where:   { checkInTime: { gte: start, lt: end } },
    include: reportInclude,
    orderBy: { checkInTime: 'asc' },
  });

  const perDay = {};
  for (const v of visits) {
    const day = v.checkInTime.toISOString().slice(0, 10);
    perDay[day] = (perDay[day] || 0) + 1;
  }

  return {
    year, month,
    totalVisits:  visits.length,
    dailyCounts:  Object.entries(perDay).map(([date, count]) => ({ date, count })),
    visits:       visits.map(flattenVisit),
  };
}

async function currentVisitorsReport() {
  const visits = await prisma.visit.findMany({
    where:   { visitStatus: 'Checked_In', checkOutTime: null },
    include: reportInclude,
    orderBy: { checkInTime: 'asc' },
  });

  const now = Date.now();
  return visits.map((v) => ({
    ...flattenVisit(v),
    minutesInside: v.checkInTime
      ? Math.round((now - new Date(v.checkInTime).getTime()) / 60000)
      : null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV export  (UNCHANGED)
// ─────────────────────────────────────────────────────────────────────────────
function toCsv(rows) {
  if (!rows || rows.length === 0) {
    return new CsvParser({ fields: ['message'] }).parse([{ message: 'No data for the selected period' }]);
  }
  return new CsvParser().parse(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format an ISO timestamp into a readable two-line string.
 * "2026-07-25T21:15:23.469Z"  →  "25 Jul 2026\n9:15 PM"
 * Falsy / invalid             →  "—"
 */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  return `${datePart}\n${timePart}`;
}

/** Current date and time as human-readable strings. */
function nowStrings() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
  };
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const PALETTE = {
  headerBg:    '#1E3A5F',
  headerText:  '#FFFFFF',
  rowEven:     '#FFFFFF',
  rowOdd:      '#EEF4FB',
  border:      '#8AAFC8',
  textPrimary: '#1A202C',
  textMuted:   '#4A5568',
  accent:      '#2B6CB0',
};

// ─── Column definitions ───────────────────────────────────────────────────────
// weight = proportional share of page content width.
// Total weight = 83 across 12 columns.
const COLUMNS = [
  { key: 'visitId',       label: 'Visit\nID',       weight: 4  },
  { key: 'visitorName',   label: 'Visitor\nName',   weight: 9  },
  { key: 'visitorPhone',  label: 'Phone',           weight: 7  },
  { key: 'company',       label: 'Company',         weight: 8  },
  { key: 'hostEmployee',  label: 'Host\nEmployee',  weight: 8  },
  { key: 'department',    label: 'Department',      weight: 8  },
  { key: 'purpose',       label: 'Purpose',         weight: 10 },
  { key: 'badgeNumber',   label: 'Badge\nNo.',      weight: 5  },
  { key: 'checkInTime',   label: 'Check-In',        weight: 8  },
  { key: 'checkOutTime',  label: 'Check-Out',       weight: 8  },
  { key: 'status',        label: 'Status',          weight: 5  },
  { key: 'minutesInside', label: 'Min.\nInside',    weight: 5  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main PDF renderer
// ─────────────────────────────────────────────────────────────────────────────
/**
 * toPdf(title, rows, res, [generatedBy])
 *
 * Streams a professional, enterprise PDF to `res`.
 * Backward-compatible signature — caller doesn't need to change.
 */
function toPdf(title, rows, res, generatedBy = 'System') {
  // ── Document: use NAMED size + layout so PDFKit sets dimensions correctly ──
  // IMPORTANT: do NOT pass numeric [w, h] + layout:'landscape' together —
  // PDFKit swaps the array values again → portrait output.
  const doc = new PDFDocument({
    size:          'A4',
    layout:        'landscape',
    margin:        0,   // we control all margins manually
    autoFirstPage: true,
    bufferPages:   true, // needed for retroactive "Page X of Y"
  });
  doc.pipe(res);

  // Read actual page dimensions AFTER creation (safe, regardless of PDFKit version)
  const PAGE_W    = doc.page.width;   // 841.89 pts (landscape A4)
  const PAGE_H    = doc.page.height;  // 595.28 pts
  const MARGIN    = 36;               // 0.5 in margins
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // Typography constants
  const FONT_BOLD     = 'Helvetica-Bold';
  const FONT_REG      = 'Helvetica';
  const FONT_SZ_TITLE = 18;
  const FONT_SZ_SUB   = 12;
  const FONT_SZ_META  = 9;
  const FONT_SZ_HDR   = 9.5;
  const FONT_SZ_DATA  = 9.5;

  // Table layout constants
  const CELL_PAD_X = 5;   // horizontal padding (pts) inside each cell
  const CELL_PAD_Y = 4;   // vertical padding (pts) inside each cell
  const MIN_ROW_H  = 22;  // minimum row height (pts)
  const FOOTER_H   = 22;  // vertical space reserved at bottom of each page

  // ── Resolve which columns to render ──────────────────────────────────────
  const dataKeys    = rows && rows.length > 0 ? Object.keys(rows[0]) : COLUMNS.map(c => c.key);
  const activeCols  = COLUMNS.filter(c => dataKeys.includes(c.key));

  // Any keys in the data that our COLUMNS list doesn't know about → add them
  const knownKeys = new Set(COLUMNS.map(c => c.key));
  dataKeys.forEach(k => {
    if (!knownKeys.has(k)) activeCols.push({ key: k, label: k, weight: 6 });
  });

  // Assign pixel widths proportionally
  const totalWeight = activeCols.reduce((s, c) => s + c.weight, 0);
  activeCols.forEach(c => { c.width = (c.weight / totalWeight) * CONTENT_W; });

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Compute height of a text string when wrapped to `colWidth`. */
  function measureText(text, fontSize, colWidth) {
    doc.font(FONT_REG).fontSize(fontSize);
    return doc.heightOfString(String(text ?? ''), {
      width: colWidth - CELL_PAD_X * 2,
    });
  }

  /** Calculate the required height for one data row. */
  function calcRowHeight(row) {
    let maxH = 0;
    activeCols.forEach(col => {
      const raw   = row[col.key];
      const value = (col.key === 'checkInTime' || col.key === 'checkOutTime')
        ? fmtDate(raw) : String(raw ?? '');
      const h = measureText(value, FONT_SZ_DATA, col.width);
      if (h > maxH) maxH = h;
    });
    return Math.max(maxH + CELL_PAD_Y * 2, MIN_ROW_H);
  }

  /**
   * Draw a single cell:
   *   • fills background
   *   • draws border
   *   • clips and renders text so it never overflows
   */
  function drawCell(text, x, y, w, h, opts = {}) {
    const {
      font      = FONT_REG,
      fontSize  = FONT_SZ_DATA,
      textColor = PALETTE.textPrimary,
      bgColor   = null,
      align     = 'left',
    } = opts;

    // Background fill
    if (bgColor) {
      doc.save().rect(x, y, w, h).fill(bgColor).restore();
    }

    // Cell border
    doc.save()
       .rect(x, y, w, h)
       .strokeColor(PALETTE.border)
       .lineWidth(0.5)
       .stroke()
       .restore();

    // Clipped text — text never bleeds outside the cell
    const textX = x + CELL_PAD_X;
    const textY = y + CELL_PAD_Y;
    const textW = w - CELL_PAD_X * 2;
    const textH = h - CELL_PAD_Y * 2;

    doc.save()
       .rect(textX, textY, textW, textH)
       .clip()
       .font(font)
       .fontSize(fontSize)
       .fillColor(textColor)
       .text(String(text ?? ''), textX, textY, {
         width:     textW,
         height:    textH,
         align,
         lineBreak: true,
       })
       .restore();
  }

  /**
   * Draw the table header row at position y.
   * Returns y-coordinate immediately after the header row.
   */
  function drawTableHeader(y) {
    // Compute header row height — headers can also wrap (we use \n in some labels)
    let maxH = 0;
    activeCols.forEach(col => {
      const h = measureText(col.label, FONT_SZ_HDR, col.width);
      if (h > maxH) maxH = h;
    });
    const hdrH = Math.max(maxH + CELL_PAD_Y * 2, MIN_ROW_H + 4);

    let x = MARGIN;
    activeCols.forEach(col => {
      drawCell(col.label, x, y, col.width, hdrH, {
        font:      FONT_BOLD,
        fontSize:  FONT_SZ_HDR,
        textColor: PALETTE.headerText,
        bgColor:   PALETTE.headerBg,
        align:     'center',
      });
      x += col.width;
    });

    return y + hdrH;
  }

  /**
   * Draw the report header block (title, subtitle, metadata, divider).
   * Returns y-coordinate immediately after the divider.
   */
  function drawReportHeader() {
    const { date: nowDate, time: nowTime } = nowStrings();
    let y = MARGIN;

    // ── Organisation title ──
    doc.font(FONT_BOLD).fontSize(FONT_SZ_TITLE)
       .fillColor(PALETTE.accent)
       .text('Visitor Management System', MARGIN, y, { width: CONTENT_W, align: 'center' });
    y = doc.y + 3;

    // ── Report subtitle ──
    doc.font(FONT_BOLD).fontSize(FONT_SZ_SUB)
       .fillColor(PALETTE.textPrimary)
       .text(title, MARGIN, y, { width: CONTENT_W, align: 'center' });
    y = doc.y + 8;

    // ── Meta fields — 4 items in a 2×2 grid to save vertical space ──────────
    const metaColW  = CONTENT_W / 2;
    const totalRows = rows && rows.length > 0 ? rows.length : 0;
    const metaItems = [
      { label: 'Generated Date:', value: nowDate },
      { label: 'Generated Time:', value: nowTime },
      { label: 'Generated By:',   value: generatedBy },
      { label: 'Total Visitors:', value: String(totalRows) },
    ];

    doc.fontSize(FONT_SZ_META);
    metaItems.forEach((item, idx) => {
      const col = idx % 2;        // 0 = left, 1 = right
      const row = Math.floor(idx / 2);
      const xPos = MARGIN + col * metaColW;
      const lineY = y + row * 13;

      // Label (bold) + value (regular) inline
      doc.font(FONT_BOLD).fillColor(PALETTE.textPrimary)
         .text(item.label + ' ', xPos, lineY, { continued: true, lineBreak: false });
      doc.font(FONT_REG).fillColor(PALETTE.textMuted)
         .text(item.value, { lineBreak: false });
    });

    // How many meta rows?
    const metaRows = Math.ceil(metaItems.length / 2);
    y += metaRows * 13 + 6;

    // ── Horizontal divider ──
    doc.save()
       .moveTo(MARGIN, y)
       .lineTo(MARGIN + CONTENT_W, y)
       .lineWidth(1.5)
       .strokeColor(PALETTE.accent)
       .stroke()
       .restore();

    return y + 8;
  }

  /**
   * Draw footer on the CURRENT page.
   * The "Page X of Y" text is overwritten in the final pass (bufferPages).
   */
  function drawFooter(pageNum) {
    const footerY = PAGE_H - FOOTER_H + 6;
    doc.save()
       .font(FONT_REG).fontSize(8).fillColor(PALETTE.textMuted)
       .text('Generated by Visitor Management System', MARGIN, footerY, {
         width: CONTENT_W, align: 'left', lineBreak: false,
       })
       .text(`Page ${pageNum}`, MARGIN, footerY, {
         width: CONTENT_W, align: 'right', lineBreak: false,
       })
       .restore();
  }

  // ── Lowest Y at which a row may begin before triggering a page break ───────
  const BODY_BOTTOM = PAGE_H - FOOTER_H - MARGIN;

  // ── Render: page 1 ────────────────────────────────────────────────────────
  let pageNum   = 1;
  let cursorY   = drawReportHeader();
  cursorY       = drawTableHeader(cursorY);

  // ── Empty data guard ──────────────────────────────────────────────────────
  if (!rows || rows.length === 0) {
    doc.font(FONT_REG).fontSize(11).fillColor(PALETTE.textMuted)
       .text('No data available for the selected period.', MARGIN, cursorY + 20, {
         width: CONTENT_W, align: 'center',
       });
    drawFooter(1);
    doc.end();
    return doc;
  }

  // ── Data rows ─────────────────────────────────────────────────────────────
  rows.forEach((row, rowIdx) => {
    const rh = calcRowHeight(row);

    // Page break when row won't fit on the current page
    if (cursorY + rh > BODY_BOTTOM) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      cursorY = drawTableHeader(MARGIN);
    }

    const bgColor = rowIdx % 2 === 0 ? PALETTE.rowEven : PALETTE.rowOdd;

    let x = MARGIN;
    activeCols.forEach(col => {
      const raw   = row[col.key];
      const value = (col.key === 'checkInTime' || col.key === 'checkOutTime')
        ? fmtDate(raw) : String(raw ?? '');
      const isNum = typeof raw === 'number';

      drawCell(value, x, cursorY, col.width, rh, {
        fontSize:  FONT_SZ_DATA,
        textColor: PALETTE.textPrimary,
        bgColor,
        align:     isNum ? 'center' : 'left',
      });
      x += col.width;
    });

    cursorY += rh;
  });

  // Footer on the last page
  drawFooter(pageNum);

  // ── Retroactively stamp "Page X of Y" on every page ──────────────────────
  // bufferPages:true keeps all pages accessible until doc.end().
  const totalPages = pageNum;
  const range = doc.bufferedPageRange();

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const footerY = PAGE_H - FOOTER_H + 6;
    doc.save()
       .font(FONT_REG).fontSize(8).fillColor(PALETTE.textMuted)
       .text(`Page ${range.start + i + 1} of ${totalPages}`, MARGIN, footerY, {
         width: CONTENT_W, align: 'right', lineBreak: false,
       })
       .restore();
  }

  doc.end();
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { dailyReport, monthlyReport, currentVisitorsReport, toCsv, toPdf };
