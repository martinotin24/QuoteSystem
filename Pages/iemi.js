// Al cargar la página, se asigna el número de proforma siguiente
window.addEventListener("load", function() {
  const invoiceSpan = document.getElementById("idinvoice");
  let lastInvoice = localStorage.getItem("lastInvoiceNumber");
  if (!lastInvoice) {
    // Valor inicial si no hay proforma previa
    invoiceSpan.innerText = "A-025-351";
  } else {
    invoiceSpan.innerText = getNextInvoice(lastInvoice);
  }
});

// Función que incrementa la parte numérica del número de proforma
function getNextInvoice(last) {
  // Se asume el formato "A-025-<numero>"
  const parts = last.split("-");
  let num = parseInt(parts[2], 10);
  return parts[0] + "-" + parts[1] + "-" + (num + 1);
}

// Función para guardar la proforma y almacenarla en localStorage
function guardarProforma() {
  // Recopilar los datos de la proforma
  const proforma = {
    id: document.getElementById("idinvoice").innerText,
    client: document.getElementById("client").value,
    attention: document.getElementById("attention").value,
    date: document.getElementById("date").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    validity: document.getElementById("validity").value,
    delivery: document.getElementById("delivery").value,
    payment: document.getElementById("payment").value,
    warranty: document.getElementById("warranty").value,
    products: [],
    subtotal: document.getElementById("subtotal").textContent,
    iva: document.getElementById("iva").textContent,
    total: document.getElementById("total").textContent
  };

  // Recopilar los productos de la tabla
  const rows = document.querySelectorAll("#products-table tbody tr");
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const product = {
      item: cells[0].textContent,
      quantity: cells[1].querySelector("input").value,
      description: cells[2].querySelector("textarea").value,
      unitPrice: cells[3].querySelector("input").value,
      total: cells[4].textContent.replace("$", "")
    };
    proforma.products.push(product);
  });

  // Recuperar el array de proformas ya almacenado o inicializarlo
  let proformasArray = JSON.parse(localStorage.getItem("proformas")) || [];
  proformasArray.push(proforma);
  localStorage.setItem("proformas", JSON.stringify(proformasArray));

  // Actualiza el número de proforma guardado para la próxima vez
  localStorage.setItem("lastInvoiceNumber", proforma.id);

  alert("Proforma guardada con número " + proforma.id);

  // Actualizar el número de proforma en pantalla para la siguiente
  document.getElementById("idinvoice").innerText = getNextInvoice(proforma.id);
}

function addProductRow() {
  const table = document.getElementById("products-table").querySelector("tbody");
  const rowCount = table.rows.length + 1; 
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="number" value="1" onchange="updateTotals(this)"></td>
    <td><textarea placeholder="Descripción" oninput="autoExpand(this)"></textarea></td>
    <td><input type="number" value="0" onchange="updateTotals(this)"></td>
    <td class="total-cell">$0.00</td>
    <td><button class="delete-btn" onclick="deleteProductRow(this)">Eliminar</button></td>
  `;

  table.appendChild(row);
}

function autoExpand(field) {
  field.style.height = 'inherit'; 
  const computed = window.getComputedStyle(field);
  const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
    + parseInt(computed.getPropertyValue('padding-top'), 10)
    + field.scrollHeight
    + parseInt(computed.getPropertyValue('padding-bottom'), 10)
    + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
  field.style.height = `${height}px`; 
}

function deleteProductRow(button) {
  const row = button.closest("tr");
  row.remove();
  updateItemNumbers(); 
  calculateTotals();
}

function updateItemNumbers() {
  const rows = document.querySelectorAll("#products-table tbody tr");
  rows.forEach((row, index) => {
      row.querySelector("td:first-child").textContent = index + 1; 
  });
}

function updateTotals(input) {
  const row = input.closest("tr");
  const quantity = row.querySelector("td:nth-child(2) input").value; 
  const unitPrice = row.querySelector("td:nth-child(4) input").value; 
  const totalCell = row.querySelector(".total-cell"); 

  const total = (quantity * unitPrice).toFixed(2);
  totalCell.textContent = `$${total}`; 

  calculateTotals(); 
}

function calculateTotals() {
  let subtotal = 0;

  document.querySelectorAll(".total-cell").forEach(cell => {
      subtotal += parseFloat(cell.textContent.replace("$", "")) || 0;
  });

  const iva = (subtotal * 0.15).toFixed(2);
  const total = (subtotal + parseFloat(iva)).toFixed(2);

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("iva").textContent = iva;
  document.getElementById("total").textContent = total;
}

// Función logout actualizada para destruir la sesión y redirigir
function logout() {
  fetch('http://localhost:3000/logout', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
       window.location.href = "index.html";
    })
    .catch(error => {
       window.location.href = "index.html";
    });
}

// Funciones para IVA
function deleteiva() {
  const ivaElement = document.getElementById("iva");
  const totalElement = document.getElementById("total");
  const subtotalElement = document.getElementById("subtotal");

  const subtotal = parseFloat(subtotalElement.textContent) || 0;

  ivaElement.textContent = "0.00";
  totalElement.textContent = subtotal.toFixed(2);
}

function restoreiva() {
  const ivaElement = document.getElementById("iva");
  const totalElement = document.getElementById("total");
  const subtotalElement = document.getElementById("subtotal");

  const subtotal = parseFloat(subtotalElement.textContent) || 0;
  const iva = (subtotal * 0.15).toFixed(2);

  ivaElement.textContent = iva;
  totalElement.textContent = (subtotal + parseFloat(iva)).toFixed(2);
}

// Funciones para generar y descargar PDF
function drawPageHeader(doc, marginX, marginY, contentWidth, rowHeight, headers, columnWidths, columnX, boldHeader = true) {
  // Logo y datos generales
  doc.addImage("IEMI.png", "PNG", 15, 10, 18, 7);
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9);
  // Se utiliza el número de proforma del span
  doc.text(`PROFORMA N° A-024-${document.getElementById("idinvoice").innerText}`, 105, 35, { align: "center" });
  doc.text(`Cliente: ${document.getElementById("client").value}`, 15, 40);
  doc.text(`Atención: ${document.getElementById("attention").value}`, 15, 45);
  doc.text(`Fecha: ${document.getElementById("date").value}`, 15, 50);
  doc.text(`Dirección: ${document.getElementById("address").value}`, 15, 55);
  doc.text(`Teléfono: ${document.getElementById("phone").value}`, 15, 60);
  doc.text(`E-mail: ${document.getElementById("email").value}`, 15, 65);
  doc.text(`Validez: ${document.getElementById("validity").value}`, 130, 40);
  doc.text(`Entrega: ${document.getElementById("delivery").value}`, 130, 45);
  doc.text(`Pago: ${document.getElementById("payment").value}`, 130, 50);
  doc.text(`Garantia: ${document.getElementById("warranty").value}`, 130, 55);
  doc.text("En atención a su solicitud, es grato poner a su consideración nuestra oferta.", 55, 83);

  // Dibujar la cuadrícula de la tabla y los títulos
  doc.rect(marginX, marginY, contentWidth, 120);
  doc.setLineWidth(0.1);
  doc.setDrawColor(0, 0, 0);
  if (boldHeader) {
    doc.setFont('Arial', 'bold');
  } else {
    doc.setFont('Arial', 'normal');
  }
  doc.setFontSize(9);
  headers.forEach((header, index) => {
    doc.text(header, columnX[index] - columnWidths[index] + 2, marginY + 6);
  });
  columnX.forEach((x) => {
    doc.line(x, marginY, x, marginY + 120);
  });
  doc.line(marginX, marginY + rowHeight, marginX + contentWidth, marginY + rowHeight);
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont('Arial', 'normal');
    doc.setFontSize(9);
    doc.text('SERVICIOS, PROVISIÓN DE INSUMOS DE INGENERÍA ELÉCTRICA, MECÁNICA E INDUSTRIAL', 15, 25);
    doc.text('RUC: 040139993601', 15, 30);
    
  const marginX = 10;
  const marginY = 90; 
  const pageWidth = 210;
  const contentWidth = pageWidth - 2 * marginX;
  const rowHeight = 8;
  const lineSpacingWithinProduct = 4; 
  const lineSpacingBetweenProducts = -2; 
  const headers = ["ITEM", "CANT", "DESCRIPCIÓN", "V. UNITARIO", "V. TOTAL"];
  const columnWidths = [10, 15, 115, 30, 30]; 
  const columnX = columnWidths.reduce((acc, width, i) => {
    acc.push((i === 0 ? marginX : acc[i - 1]) + width);
    return acc;
  }, []);

  const products = document.querySelectorAll("#products-table tbody tr");
  const totalItems = products.length;
  let firstPageLimit;
  if (totalItems <= 14) {
    firstPageLimit = totalItems;
  } else if (totalItems > 14 && totalItems <= 17) {
    firstPageLimit = 14;
  } else {
    firstPageLimit = 17;
  }
  const otherPageLimit = 14;
  let pageCount = 1;
  let pageItemCount = 0;

  drawPageHeader(doc, marginX, marginY, contentWidth, rowHeight, headers, columnWidths, columnX, true);
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9);
  let currentY = marginY + rowHeight + 4;

  products.forEach((product, index) => {
    if (index > 0 && index % 14 === 0) {
      doc.addPage();
      drawPageHeader(doc, marginX, marginY, contentWidth, rowHeight, headers, columnWidths, columnX, false);
      currentY = marginY + rowHeight + 4;
    }

    const cells = product.querySelectorAll("td");
    const item = cells[0].textContent; 
    const quantity = cells[1].querySelector("input").value; 
    const description = cells[2].querySelector("textarea").value; 
    const unitPrice = parseFloat(cells[3].querySelector("input").value).toFixed(2); 
    const total = parseFloat(quantity * unitPrice).toFixed(2); 
    const rowData = [item, quantity, description, unitPrice, `$${total}`]; 
    const descriptionLines = doc.splitTextToSize(description, columnWidths[2] - 2); 

    rowData.forEach((data, colIndex) => {
      if (colIndex === 2) {
        descriptionLines.forEach((line, lineIndex) => {
          const yOffset = lineIndex === 0 ? 0 : lineSpacingWithinProduct;
          doc.text(line, columnX[colIndex] - columnWidths[colIndex] + 2, currentY + yOffset);
        });
      } else {
        doc.text(String(data), columnX[colIndex] - columnWidths[colIndex] + 2, currentY);
      }
    });

    currentY += rowHeight + (descriptionLines.length - 1) * lineSpacingWithinProduct + lineSpacingBetweenProducts; 
  });

  const totalsStartY = marginY + 100; 
  const totals = [
    { label: "Subtotal", value: `$${document.getElementById("subtotal").textContent}` },
    { label: "IVA 15%", value: `$${document.getElementById("iva").textContent}` },
    { label: "TOTAL", value: `$${document.getElementById("total").textContent}` }
  ];

  const unitarioX = columnX[3] - columnWidths[3] + 2; 
  const totalX = columnX[4] - columnWidths[4] + 2;   
  totals.forEach((total, index) => {
    const posY = totalsStartY + index * rowHeight;
    doc.text(total.label, unitarioX, posY);
    doc.text(total.value, totalX, posY);
  });

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const idinvoice = document.getElementById("idinvoice").innerText;
  const newWindow = window.open(pdfUrl, '_blank');
  newWindow.document.title = `Oferta_A-024-${idinvoice}.pdf`;
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const marginX = 10;
  const marginY = 90; 
  const pageWidth = 210;
  const contentWidth = pageWidth - 2 * marginX;
  const rowHeight = 8;
  const lineSpacingWithinProduct = 4;
  const lineSpacingBetweenProducts = -2;
  const headers = ["ITEM", "CANT", "DESCRIPCIÓN", "V. UNITARIO", "V. TOTAL"];
  const columnWidths = [10, 15, 115, 30, 30];
  const columnX = columnWidths.reduce((acc, width, i) => {
    acc.push((i === 0 ? marginX : acc[i - 1]) + width);
    return acc;
  }, []);

  const products = document.querySelectorAll("#products-table tbody tr");
  const totalItems = products.length;
  let firstPageLimit;
  if (totalItems <= 14) {
    firstPageLimit = totalItems;
  } else if (totalItems > 14 && totalItems <= 17) {
    firstPageLimit = 14;
  } else {
    firstPageLimit = 17;
  }
  const otherPageLimit = 14;
  let pageCount = 1;
  let pageItemCount = 0;

  drawPageHeader(doc, marginX, marginY, contentWidth, rowHeight, headers, columnWidths, columnX, true);
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9);
  let currentY = marginY + rowHeight + 4;

  for (let i = 0; i < totalItems; i++) {
    let currentLimit = (pageCount === 1) ? firstPageLimit : otherPageLimit;
    if (pageItemCount === currentLimit) {
      doc.addPage();
      drawPageHeader(doc, marginX, marginY, contentWidth, rowHeight, headers, columnWidths, columnX, false);
      pageCount++;
      pageItemCount = 0;
      currentY = marginY + rowHeight + 4;
    }

    const cells = products[i].querySelectorAll("td");
    const item = cells[0].textContent;
    const quantity = cells[1].querySelector("input").value;
    const description = cells[2].querySelector("textarea").value;
    const unitPrice = parseFloat(cells[3].querySelector("input").value).toFixed(2);
    const total = parseFloat(quantity * unitPrice).toFixed(2);
    const rowData = [item, quantity, description, unitPrice, `$${total}`];
    const descriptionLines = doc.splitTextToSize(description, columnWidths[2] - 2);

    rowData.forEach((data, colIndex) => {
      if (colIndex === 2) {
        descriptionLines.forEach((line, lineIndex) => {
          const yOffset = lineIndex === 0 ? 0 : lineSpacingWithinProduct;
          doc.text(line, columnX[colIndex] - columnWidths[colIndex] + 2, currentY + yOffset);
        });
      } else {
        doc.text(String(data), columnX[colIndex] - columnWidths[colIndex] + 2, currentY);
      }
    });

    pageItemCount++;
    currentY += rowHeight + (descriptionLines.length - 1) * lineSpacingWithinProduct + lineSpacingBetweenProducts;
  }

  const totalsStartY = marginY + 100;
  const totals = [
    { label: "Subtotal", value: `$${document.getElementById("subtotal").textContent}` },
    { label: "IVA 15%", value: `$${document.getElementById("iva").textContent}` },
    { label: "TOTAL", value: `$${document.getElementById("total").textContent}` }
  ];
  const unitarioX = columnX[3] - columnWidths[3] + 2;
  const totalX = columnX[4] - columnWidths[4] + 2;
  totals.forEach((total, index) => {
    const posY = totalsStartY + index * rowHeight;
    doc.text(total.label, unitarioX, posY);
    doc.text(total.value, totalX, posY);
  });

  const idInvoice = document.getElementById("idinvoice").innerText || "sin-numero";
  doc.save(`Proforma_${idInvoice}.pdf`);
}
