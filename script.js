/* global html2canvas */

const $ = (sel) => document.querySelector(sel);

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

function formatDateISOToAr(iso) {
  // iso: yyyy-mm-dd
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "2-digit" }).format(
      d
    );
  } catch {
    return iso;
  }
}

function nowAr() {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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

function setPdfTextData(data) {
  pdfSchoolName.textContent = safeText(data.schoolName);
  pdfEducationAdminHeader.textContent = safeText(data.educationAdmin);
  pdfEducationAdmin.textContent = safeText(data.educationAdmin);
  pdfReportType.textContent = safeText(data.reportType);
  pdfExecutingGroup.textContent = safeText(data.executingGroup);
  pdfTargetGroup.textContent = safeText(data.targetGroup);
  pdfBeneficiaries.textContent = safeText(data.beneficiaries);
  pdfExecutionDate.textContent = safeText(data.executionDate);
  pdfDuration.textContent = safeText(data.duration);
  pdfBarcodeLink.textContent = safeText(data.barcodeLink);
  pdfGoals.textContent = safeText(data.goals);
  pdfTeacherName.textContent = safeText(data.teacherName);
  pdfPrincipalName.textContent = safeText(data.principalName);

  // Meta
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

  // reset slots
  for (const s of slots) {
    if (!s) continue;
    s.src = "";
    s.classList.add("is-hidden");
  }

  if (!files || !files.length) return;

  const count = Math.min(slots.length, files.length);
  for (let i = 0; i < count; i += 1) {
    const url = await fileToDataUrl(files[i]);
    slots[i].src = url;
    slots[i].classList.remove("is-hidden");
  }
}

async function setPdfData(data) {
  setPdfTextData(data);
  await Promise.all([setBarcodeImageFromInput(), setEvidenceImagesFromInput()]);
}

function buildRef(data) {
  const base = String(data.schoolName || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 18);
  const date = String(data.executionDate || "").replaceAll("-", "");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  const parts = [];
  if (date) parts.push(date);
  if (base) parts.push(base);
  parts.push(rand);
  return parts.join("-");
}

function setQr(value) {
  const v = String(value ?? "").trim();

  // Clear old QR
  if (qrInstance) {
    qrEl.innerHTML = "";
    qrInstance = null;
  } else {
    qrEl.innerHTML = "";
  }

  if (!v) {
    qrWrap.classList.add("is-hidden");
    qrEmpty.classList.remove("is-hidden");
    qrText.textContent = "";
    return;
  }

  qrEmpty.classList.add("is-hidden");
  qrWrap.classList.remove("is-hidden");
  qrText.textContent = v;

  // QRCode.js writes a canvas/img into qrEl
  qrInstance = new QRCode(qrEl, {
    text: v,
    width: 140,
    height: 140,
    colorDark: "#0b1220",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
}

function getFormData() {
  const fd = new FormData(form);
  return {
    schoolName: fd.get("schoolName"),
    educationAdmin: fd.get("educationAdmin"),
    reportType: fd.get("reportType"),
    executingGroup: fd.get("executingGroup"),
    targetGroup: fd.get("targetGroup"),
    beneficiaries: fd.get("beneficiaries"),
    executionDate: fd.get("executionDate"),
    duration: fd.get("duration"),
    barcodeLink: fd.get("barcodeLink"),
    goals: fd.get("goals"),
    teacherName: fd.get("teacherName"),
    principalName: fd.get("principalName"),
  };
}

async function generatePdf() {
  // HTML5 validation UI
  if (!form.reportValidity()) return;

  const data = getFormData();
  await setPdfData(data);

  // Render template to canvas
  const canvas = await html2canvas(pdfPage, {
    backgroundColor: "#0b1220",
    scale: 2.2, // crisp output
    useCORS: true,
    logging: false,
    windowWidth: pdfPage.scrollWidth,
    windowHeight: pdfPage.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");

  // Create PDF (A4 portrait)
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit image to page
  const imgProps = pdf.getImageProperties(imgData);
  const imgRatio = imgProps.width / imgProps.height;
  const pageRatio = pageWidth / pageHeight;

  let w, h;
  if (imgRatio > pageRatio) {
    w = pageWidth;
    h = pageWidth / imgRatio;
  } else {
    h = pageHeight;
    w = pageHeight * imgRatio;
  }

  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;

  pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");

  // output + preview
  const blob = pdf.output("blob");
  cleanupOldBlobUrl();
  lastBlobUrl = URL.createObjectURL(blob);

  // Make filename nice
  const filenameBase = String(data.schoolName || "report").trim().replace(/[\\/:*?"<>|]/g, "-");
  downloadLink.download = `تقرير-تنفيذ-${filenameBase || "PDF"}.pdf`;

  setPreviewEnabled(true, lastBlobUrl);
}

btnGenerate.addEventListener("click", () => {
  btnGenerate.disabled = true;
  btnGenerate.textContent = "جاري الإنشاء...";
  generatePdf()
    .catch((err) => {
      console.error(err);
      alert("حدث خطأ أثناء إنشاء PDF. افتح Console للمزيد.");
    })
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

  // ثابت هجري 1447
  form.executionDate.value = "1447/01/01";

  form.duration.value = "يوم واحد";
  form.barcodeLink.value = "https://example.com/qrcode";
  form.goals.value =
    "رفع الوعي الصحي لدى الطلبة.\nتعزيز السلوكيات الصحية اليومية.\nتقديم إرشادات عملية قابلة للتطبيق.";
  form.teacherName.value = "أ. فاطمة علي";
  form.principalName.value = "أ. نورة محمد";
});

// initial state
setPreviewEnabled(false);

