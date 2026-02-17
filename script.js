/* global html2canvas */

const $ = (sel) => document.querySelector(sel);

const pdfDynamicReportType = $("#pdfDynamicReportType");
const pdfSchoolNameTitle = $("#pdfSchoolNameTitle");
const form = $("#infoForm");
const btnGenerate = $("#btnGenerate");
const btnFillDemo = $("#btnFillDemo");

const pdfPage = $("#pdfPage");
const pdfFrame = $("#pdfFrame");
const emptyState = $("#emptyState");
const downloadLink = $("#downloadLink");

// PDF fields
const pdfSchoolName = $("#pdfSchoolName");
const pdfEducationAdminHeader = $("#pdfEducationAdminHeader");
const pdfEducationAdmin = $("#pdfEducationAdmin");
const pdfReportType = $("#pdfReportType");
const pdfExecutingGroup = $("#pdfExecutingGroup");
const pdfTargetGroup = $("#pdfTargetGroup");
const pdfBeneficiaries = $("#pdfBeneficiaries");
const pdfExecutionDate = $("#pdfExecutionDate");
const pdfDuration = $("#pdfDuration");
const pdfBarcodeLink = $("#pdfBarcodeLink");
const pdfGoals = $("#pdfGoals");
const pdfTeacherName = $("#pdfTeacherName");
const pdfPrincipalName = $("#pdfPrincipalName");
const pdfGeneratedAt = $("#pdfGeneratedAt");
const pdfRef = $("#pdfRef");

// Barcode & files
const barcodeImg = $("#barcodeImg");
const barcodeEmpty = $("#barcodeEmpty");
const evidenceImagesInput = form.querySelector('input[name="evidenceImages"]');
const barcodeImageInput = form.querySelector('input[name="barcodeImage"]');
const evImg1 = $("#evImg1");
const evImg2 = $("#evImg2");
const evImg3 = $("#evImg3");
const evImg4 = $("#evImg4");

let lastBlobUrl = null;

function safeText(v) {
  const s = String(v ?? "").trim();
  return s.length ? s : "—";
}

function nowAr() {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric", month: "long", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toLocaleString();
  }
}

function setPreviewEnabled(enabled, blobUrl) {
  if (!enabled) {
    pdfFrame.classList.add("is-hidden");
    emptyState.classList.remove("is-hidden");
    downloadLink.classList.add("is-disabled");
    downloadLink.href = "#";
    return;
  }
  emptyState.classList.add("is-hidden");
  pdfFrame.classList.remove("is-hidden");
  pdfFrame.src = blobUrl;
  downloadLink.classList.remove("is-disabled");
  downloadLink.href = blobUrl;
}

function cleanupOldBlobUrl() {
  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
  lastBlobUrl = null;
}

function buildRef(data) {
  const base = String(data.schoolName || "").trim().replace(/\s+/g, " ").slice(0, 18);
  const date = String(data.executionDate || "").replaceAll("/", "");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${date}-${base}-${rand}`;
}

function setPdfTextData(data) {
  const school = safeText(data.schoolName);
  const type = safeText(data.reportType);

  pdfSchoolNameTitle.textContent = school;
  pdfDynamicReportType.textContent = `${type}`;

  pdfSchoolName.textContent = school;
  pdfReportType.textContent = type;
  pdfEducationAdminHeader.textContent = safeText(data.educationAdmin);
  pdfEducationAdmin.textContent = safeText(data.educationAdmin);
  pdfExecutingGroup.textContent = safeText(data.executingGroup);
  pdfTargetGroup.textContent = safeText(data.targetGroup);
  pdfBeneficiaries.textContent = safeText(data.beneficiaries);
  pdfExecutionDate.textContent = safeText(data.executionDate);
  pdfDuration.textContent = safeText(data.duration);
  pdfBarcodeLink.textContent = safeText(data.barcodeLink);
  pdfGoals.textContent = safeText(data.goals);
  pdfTeacherName.textContent = safeText(data.teacherName);
  pdfPrincipalName.textContent = safeText(data.principalName);

  pdfGeneratedAt.textContent = nowAr();
  pdfRef.textContent = buildRef(data);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function setBarcodeImageFromInput() {
  const file = barcodeImageInput?.files?.[0];
  if (!file) {
    barcodeImg.src = "";
    barcodeImg.classList.add("is-hidden");
    barcodeEmpty.classList.remove("is-hidden");
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  barcodeImg.src = dataUrl;
  barcodeImg.classList.remove("is-hidden");
  barcodeEmpty.classList.add("is-hidden");
}

async function setEvidenceImagesFromInput() {
  const files = evidenceImagesInput?.files;
  const slots = [evImg1, evImg2, evImg3, evImg4];
  slots.forEach(s => { s.src = ""; s.classList.add("is-hidden"); });

  if (!files || !files.length) return;
  const count = Math.min(slots.length, files.length);
  for (let i = 0; i < count; i++) {
    slots[i].src = await fileToDataUrl(files[i]);
    slots[i].classList.remove("is-hidden");
  }
}

async function setPdfData(data) {
  setPdfTextData(data);
  await Promise.all([setBarcodeImageFromInput(), setEvidenceImagesFromInput()]);
}

function getFormData() {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

async function generatePdf() {
  if (!form.reportValidity()) return;

  const data = getFormData();
  await setPdfData(data);

  // Wait for images to render
  await new Promise(r => setTimeout(r, 300));

  const canvas = await html2canvas(pdfPage, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Basic Image Add
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

  // --- MAKE THE LINK WORK ---
  if (data.barcodeLink && data.barcodeLink.startsWith('http')) {
      /**
       * Coordinates for the link (X, Y, Width, Height in mm)
       * These depend on your CSS layout. In a standard A4 (210x297mm),
       * the info grid usually sits around the middle-left or right.
       * Adjustment: You might need to tweak these numbers to hit the exact spot.
       **/
      const linkX = 35;  // Distance from right/left edge
      const linkY = 165; // Distance from top
      const linkW = 60;  // Width of clickable area
      const linkH = 10;  // Height of clickable area

      pdf.link(linkX, linkY, linkW, linkH, { url: data.barcodeLink });
  }

  const blob = pdf.output("blob");
  cleanupOldBlobUrl();
  lastBlobUrl = URL.createObjectURL(blob);

  const filenameBase = String(data.schoolName || "report").trim().replace(/[\\/:*?"<>|]/g, "-");
  downloadLink.download = `تقرير-${filenameBase}.pdf`;

  setPreviewEnabled(true, lastBlobUrl);
}

btnGenerate.addEventListener("click", () => {
  btnGenerate.disabled = true;
  btnGenerate.textContent = "جاري الإنشاء...";
  generatePdf()
    .catch(err => { console.error(err); alert("Error generating PDF"); })
    .finally(() => {
      btnGenerate.disabled = false;
      btnGenerate.textContent = "إنشاء PDF";
    });
});

btnFillDemo.addEventListener("click", () => {
  form.schoolName.value = "ثانوية النور";
  form.educationAdmin.value = "الرياض";
  form.reportType.value = "برنامج";
  form.executingGroup.value = "فريق التوعية الصحية";
  form.targetGroup.value = "طالبات الصف الثالث ثانوي";
  form.beneficiaries.value = "120";
  form.executionDate.value = "1447/01/01";
  form.duration.value = "يوم واحد";
  form.barcodeLink.value = "https://example.com/view-report";
  form.goals.value = "رفع الوعي الصحي.\nتعزيز السلوكيات الصحية.\nإرشادات عملية.";
  form.teacherName.value = "أ. فاطمة علي";
  form.principalName.value = "أ. نورة محمد";
});

setPreviewEnabled(false);