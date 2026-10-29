function asText(value, fallback = "Not specified") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function listOf(value) {
  return Array.isArray(value) ? value : [];
}

export function meetingReportText({ title = "Meeting report", createdAt, analysis = {} }) {
  const sections = [
    ["MEETING SUMMARY", listOf(analysis.meeting_summary).map(item => `• ${item}`)],
    ["DECISIONS", listOf(analysis.decisions).map(item => `• ${asText(item.decision, item)}${item.evidence ? `\n  Evidence: ${item.evidence}` : ""}`)],
    ["ACTION ITEMS", listOf(analysis.action_items).map((item, index) => `${index + 1}. ${asText(item.task, item)}\n   Owner: ${asText(item.owner)} | Deadline: ${asText(item.deadline)} | Priority: ${asText(item.priority)} | Status: ${asText(item.status, "Open")}`)],
    ["RISKS & BLOCKERS", listOf(analysis.risks_and_blockers).map(item => `• ${asText(item.issue, item)}${item.impact ? ` — Impact: ${item.impact}` : ""}`)],
    ["OPEN QUESTIONS", listOf(analysis.open_questions).map(item => `• ${item}`)],
    ["NEXT STEPS", listOf(analysis.next_steps).map(item => `• ${item}`)],
  ];
  const lines = [title, `Date: ${createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, ""];
  sections.forEach(([heading, items]) => {
    lines.push(heading);
    lines.push(...(items.length ? items : ["• None recorded"]), "");
  });
  return lines.join("\n");
}

const COLORS = {
  sage: "0.518 0.592 0.498",
  cream: "0.953 0.925 0.875",
  burgundy: "0.361 0.125 0.208",
};

function pdfSafe(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrap(value, limit = 91) {
  const words = pdfSafe(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > limit) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function downloadMeetingReport({ title = "Meeting report", createdAt, analysis = {} }) {
  const pageWidth = 612;
  const pageHeight = 792;
  const pages = [];
  let operations = [];
  let y = 0;

  const paintPage = (pageIndex) => {
    operations = [
      `${COLORS.cream} rg 0 0 ${pageWidth} ${pageHeight} re f`,
      `${COLORS.burgundy} rg 0 700 ${pageWidth} 92 re f`,
    ];
    const topLine = pageIndex === 0 ? "MEETING INTELLIGENCE" : "MEETING INTELLIGENCE  /  CONTINUED";
    text(topLine, 44, 758, 9, COLORS.cream, true);
    text(pageIndex === 0 ? title : "Meeting report", 44, 728, 19, COLORS.cream, true);
    if (pageIndex === 0) {
      const date = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();
      text(`Prepared ${date}`, 44, 710, 9, COLORS.cream);
    }
    y = 674;
  };

  function text(value, x, baseline, size, color, bold = false) {
    operations.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${x} ${baseline} Td (${pdfSafe(value)}) Tj ET`);
  }

  function nextPage() {
    pages.push(operations.join("\n"));
    paintPage(pages.length);
  }

  function ensureSpace(height) {
    if (y - height < 62) nextPage();
  }

  function addSection(heading, items, formatter = value => value) {
    ensureSpace(43);
    y -= 4;
    text(heading.toUpperCase(), 44, y, 9, COLORS.sage, true);
    y -= 18;
    const entries = items.length ? items : ["None recorded"];
    entries.forEach((item, index) => {
      const rendered = formatter(item, index);
      const lines = Array.isArray(rendered) ? rendered : [rendered];
      const wrapped = lines.flatMap(line => wrap(line));
      ensureSpace(wrapped.length * 13 + 13);
      wrapped.forEach(line => {
        text(line, 48, y, 9.5, COLORS.burgundy);
        y -= 13;
      });
      y -= 7;
    });
    y -= 6;
  }

  paintPage(0);
  addSection("Meeting summary", listOf(analysis.meeting_summary), item => `•  ${item}`);
  addSection("Decisions", listOf(analysis.decisions), item => [
    `•  ${asText(item.decision, item)}`,
    ...(item.evidence ? [`   Evidence: ${item.evidence}`] : []),
  ]);
  addSection("Action items", listOf(analysis.action_items), (item, index) => [
    `${index + 1}.  ${asText(item.task, item)}`,
    `    Owner: ${asText(item.owner)}   |   Deadline: ${asText(item.deadline)}`,
    `    Priority: ${asText(item.priority)}   |   Status: ${asText(item.status, "Open")}`,
  ]);
  addSection("Risks & blockers", listOf(analysis.risks_and_blockers), item => `•  ${asText(item.issue, item)}${item.impact ? ` — Impact: ${item.impact}` : ""}`);
  addSection("Open questions", listOf(analysis.open_questions), item => `•  ${item}`);
  addSection("Next steps", listOf(analysis.next_steps), item => `•  ${item}`);

  pages.push(operations.join("\n"));
  const pageObjects = [];
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  pages.forEach((content, index) => {
    const pageNumber = 5 + index * 2;
    const streamNumber = pageNumber + 1;
    pageObjects.push(`${pageNumber} 0 R`);
    const footer = `BT /F1 8 Tf ${COLORS.sage} rg 44 38 Td (MEETING INTELLIGENCE AGENT) Tj ET\nBT /F1 8 Tf ${COLORS.sage} rg 520 38 Td (${index + 1} / ${pages.length}) Tj ET`;
    const stream = `${content}\n${footer}`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamNumber} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageObjects.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n%MeetingReport\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
  const link = document.createElement("a");
  const safeName = pdfSafe(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "meeting-report";
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = `${safeName}.pdf`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
