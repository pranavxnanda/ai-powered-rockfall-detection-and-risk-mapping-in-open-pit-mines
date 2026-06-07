const PDFDocument = require('pdfkit');
const Risk = require('../models/mongodb/RiskAssessment');
const Alert = require('../models/mongodb/Alert');
const Incident = require('../models/mongodb/Incident');
const Zone = require('../models/mongodb/Zone');
const WorkAssignment = require('../models/mongodb/WorkAssignment');

// ─── Helpers ────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#1D4ED8',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  muted: '#6B7280',
  border: '#E5E7EB',
  rowAlt: '#F9FAFB',
};

const RISK_COLORS = {
  low: COLORS.success,
  moderate: COLORS.warning,
  high: '#EA580C',
  critical: COLORS.danger,
};

function drawPageHeader(doc, title, dateRange) {
  // Header bar
  doc.rect(0, 0, doc.page.width, 70).fill(COLORS.primary);

  // Title
  doc
    .fillColor('#FFFFFF')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('RFD — Rockfall Detection System', 40, 18);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(title, 40, 44);

  // Date range top-right
  doc
    .fontSize(9)
    .text(dateRange, 0, 44, { align: 'right', width: doc.page.width - 40 });

  doc.fillColor('#000000');
  doc.moveDown(3);
}

function drawSectionTitle(doc, text) {
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(text, { underline: false })
    .moveDown(0.4);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(COLORS.border)
    .stroke();
  doc.moveDown(0.5);
  doc.fillColor('#000000').font('Helvetica').fontSize(10);
}

function drawTable(doc, headers, rows, colWidths) {
  const startX = doc.page.margins.left;
  const rowH = 20;
  let y = doc.y;

  // Header row
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#EFF6FF');
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9);
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + 4, y + 6, { width: colWidths[i] - 8, ellipsis: true });
    x += colWidths[i];
  });

  y += rowH;

  // Data rows
  rows.forEach((row, rowIdx) => {
    // New page if needed
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    if (rowIdx % 2 === 1) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill(COLORS.rowAlt);
    }
    doc.fillColor('#111827').font('Helvetica').fontSize(9);
    x = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell ?? '—'), x + 4, y + 6, { width: colWidths[i] - 8, ellipsis: true });
      x += colWidths[i];
    });
    y += rowH;
  });

  doc.y = y + 8;
}

function drawStatRow(doc, stats) {
  const boxW = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / stats.length;
  const startX = doc.page.margins.left;
  const y = doc.y;
  const boxH = 50;

  stats.forEach((s, i) => {
    const x = startX + i * boxW;
    doc.rect(x + 2, y, boxW - 4, boxH).fill('#EFF6FF').stroke(COLORS.border);
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(18)
      .text(String(s.value), x + 2, y + 8, { width: boxW - 4, align: 'center' });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(s.label, x + 2, y + 32, { width: boxW - 4, align: 'center' });
  });

  doc.y = y + boxH + 12;
  doc.fillColor('#000000');
}

function buildDateFilter(startDate, endDate) {
  return { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59Z') };
}

// ─── Report Generators ────────────────────────────────────────────────────────

async function generateRiskSummary(doc, { startDate, endDate, riskLevel }) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const filter = { createdAt: dateFilter };
  if (riskLevel && riskLevel !== 'all') filter.riskLevel = riskLevel;

  const risks = await Risk.find(filter)
    .populate('zoneId', 'zoneName')
    .sort({ createdAt: -1 })
    .lean();

  const counts = { low: 0, moderate: 0, high: 0, critical: 0 };
  risks.forEach((r) => { if (counts[r.riskLevel] !== undefined) counts[r.riskLevel]++; });

  drawSectionTitle(doc, 'Overview');
  drawStatRow(doc, [
    { label: 'Total Risks', value: risks.length },
    { label: 'Critical', value: counts.critical },
    { label: 'High', value: counts.high },
    { label: 'Moderate', value: counts.moderate },
    { label: 'Low', value: counts.low },
  ]);

  drawSectionTitle(doc, 'Risk Records');
  drawTable(
    doc,
    ['Zone', 'Risk Level', 'Score', 'Factors', 'Date'],
    risks.map((r) => [
      r.zoneId?.zoneName || 'N/A',
      r.riskLevel?.toUpperCase() || '—',
       r.confidenceScore != null ? (r.confidenceScore * 100).toFixed(1) + '%' : '—',
      Array.isArray(r.contributingFactors) ? r.contributingFactors.join(', ') : '—',
      new Date(r.createdAt).toLocaleDateString(),
    ]),
    [110, 80, 55, 180, 90],
  );
}

async function generateIncidentLog(doc, { startDate, endDate, riskLevel }) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const filter = { reportedAt: dateFilter };
  if (riskLevel && riskLevel !== 'all') filter.severity = riskLevel;

  const incidents = await Incident.find(filter)
    .populate('zoneId', 'zoneName')
    .sort({ reportedAt: -1 })
    .lean();

  const statuses = {};
  incidents.forEach((i) => { statuses[i.status] = (statuses[i.status] || 0) + 1; });

  drawSectionTitle(doc, 'Overview');
  drawStatRow(doc, [
    { label: 'Total Incidents', value: incidents.length },
    { label: 'Open', value: statuses['open'] || 0 },
    { label: 'Investigating', value: statuses['investigating'] || 0 },
    { label: 'Resolved', value: statuses['resolved'] || 0 },
  ]);

  drawSectionTitle(doc, 'Incident Records');
  drawTable(
    doc,
    ['Title', 'Zone', 'Severity', 'Status', 'Reported'],
    incidents.map((i) => [
      i.title || '—',
      i.zoneId?.zoneName || 'N/A',
      i.severity?.toUpperCase() || '—',
      i.status || '—',
      new Date(i.reportedAt).toLocaleDateString(),
    ]),
    [140, 90, 70, 80, 90],
  );
}

async function generateZoneAnalysis(doc, { startDate, endDate }) {
  const zones = await Zone.find({}).lean();
  const dateFilter = buildDateFilter(startDate, endDate);

  drawSectionTitle(doc, `Zone Overview (${zones.length} zones)`);

  for (const zone of zones) {
    const [riskCount, alertCount, assignmentCount] = await Promise.all([
      Risk.countDocuments({ zoneId: zone._id, createdAt: dateFilter }),
      Alert.countDocuments({ zoneId: zone._id, createdAt: dateFilter }),
      WorkAssignment.countDocuments({ zoneId: zone._id, scheduledStart: dateFilter }),
    ]);

    if (doc.y > doc.page.height - 120) doc.addPage();

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827')
      .text(`${zone.zoneName}  `, { continued: true })
      .font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text(`(${zone.zoneType || 'untyped'})`);

    doc.fontSize(9).fillColor('#374151').font('Helvetica')
      .text(`Risks: ${riskCount}   Alerts: ${alertCount}   Assignments: ${assignmentCount}`)
      .moveDown(0.6);

    doc.fillColor('#000000');
  }
}

async function generateAlertHistory(doc, { startDate, endDate, riskLevel }) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const filter = { createdAt: dateFilter };
  if (riskLevel && riskLevel !== 'all') filter.severity = riskLevel;

  const alerts = await Alert.find(filter)
    .populate('zoneId', 'zoneName')
    .sort({ createdAt: -1 })
    .lean();

  const acknowledged = alerts.filter((a) => a.isAcknowledged).length;

  drawSectionTitle(doc, 'Overview');
  drawStatRow(doc, [
    { label: 'Total Alerts', value: alerts.length },
    { label: 'Acknowledged', value: acknowledged },
    { label: 'Unacknowledged', value: alerts.length - acknowledged },
  ]);

  drawSectionTitle(doc, 'Alert Records');
  drawTable(
    doc,
    ['Message', 'Zone', 'Severity', 'Acknowledged', 'Date'],
    alerts.map((a) => [
      a.message || '—',
      a.zoneId?.zoneName || 'N/A',
      a.severity?.toUpperCase() || '—',
      a.isAcknowledged ? 'Yes' : 'No',
      new Date(a.createdAt).toLocaleDateString(),
    ]),
    [170, 90, 70, 80, 90],
  );
}

// ─── Main Controller ──────────────────────────────────────────────────────────

exports.generateReport = async (req, res, next) => {
  try {
    const { reportType, startDate, endDate, riskLevel } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required.' });
    }

    const TITLES = {
      risk_summary: 'Risk Summary Report',
      incident_log: 'Incident Log Report',
      zone_analysis: 'Zone Analysis Report',
      alert_history: 'Alert History Report',
    };

    const title = TITLES[reportType] || 'Operational Report';
    const dateRange = `${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}`;

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.pdf"`);
    doc.pipe(res);

    drawPageHeader(doc, title, dateRange);

    const params = { startDate, endDate, riskLevel };

    switch (reportType) {
      case 'risk_summary':    await generateRiskSummary(doc, params);   break;
      case 'incident_log':    await generateIncidentLog(doc, params);   break;
      case 'zone_analysis':   await generateZoneAnalysis(doc, params);  break;
      case 'alert_history':   await generateAlertHistory(doc, params);  break;
      default:
        return res.status(400).json({ message: `Unknown reportType: ${reportType}` });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};