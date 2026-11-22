// Draws the pass on a canvas (so any script, e.g. Hindi names, renders) and saves it as a PDF.

function svgToImage(svg) {
  const xml = new XMLSerializer().serializeToString(svg);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not draw the QR code."));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export async function downloadPassPdf({ rows, passId, qrSvg }) {
  const [{ jsPDF }, qr] = await Promise.all([import("jspdf"), svgToImage(qrSvg)]);

  const width = 800;
  const height = 560 + rows.length * 70;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const font = "Manrope, system-ui, sans-serif";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#5457d6";
  ctx.fillRect(0, 0, width, 120);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 40px ${font}`;
  ctx.fillText("VISITRA", 50, 75);
  ctx.textAlign = "right";
  ctx.font = `700 24px ${font}`;
  ctx.fillText("VISITOR PASS", width - 50, 72);
  ctx.textAlign = "left";

  let y = 175;
  for (const [label, value] of rows) {
    ctx.fillStyle = "#5d6382";
    ctx.font = `700 18px ${font}`;
    ctx.fillText(label.toUpperCase(), 50, y);
    ctx.fillStyle = "#1b1f36";
    ctx.font = `700 26px ${font}`;
    ctx.fillText(fitText(ctx, value || "-", width - 100), 50, y + 31);
    y += 70;
  }

  ctx.textAlign = "center";
  ctx.font = `800 32px ${font}`;
  ctx.fillText(`Pass ID: ${passId}`, width / 2, y + 30);
  ctx.drawImage(qr, width / 2 - 130, y + 60, 260, 260);

  const pdf = new jsPDF("p", "mm", "a4");
  const w = 150;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 30, 20, w, (height * w) / width);
  pdf.save(`visitra-pass-${passId}.pdf`);
}
