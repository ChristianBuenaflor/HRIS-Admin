// utils/payslipPDFGenerator.ts
export interface PayslipData {
  employee_name: string;
  period: string;
  daily_rate: string;
  days_worked: string;
  gross_base: string;
  gross_pay: string;
  night_diff_pay?: string;
  total_allowances?: string;
  total_deductions: string;
  net_pay: string;
  generated_at: string;
  allowances?: Array<{ allowance_type: string; allowance_amount: string }>;
  deductions?: Array<{ deduction_type: string; deduction_amount: string }>;
  employee?: {
    department?: string;
    position?: string;
    employee_id?: string;
  };
}

export const generatePayslipPDF = async (payslip: PayslipData): Promise<void> => {
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Could not create iframe document');
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
          }
          body {
            padding: 15mm;
            background: white;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
          }
          .payslip-container {
            max-width: 180mm;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 8mm;
            border-bottom: 2px solid #333;
            padding-bottom: 4mm;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          .payslip-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 6mm;
            text-align: center;
          }
          .employee-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
            margin-bottom: 6mm;
          }
          .info-group {
            margin-bottom: 2mm;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 40mm;
          }
          .tables-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5mm;
            margin-bottom: 6mm;
          }
          .table-section {
            margin-bottom: 4mm;
          }
          .section-title {
            font-weight: bold;
            background: #f0f0f0;
            padding: 2mm;
            border: 1px solid #ccc;
            margin-bottom: 2mm;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 2mm;
            text-align: left;
          }
          th {
            background: #f8f8f8;
            font-weight: bold;
          }
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .total-row {
            background: #f0f0f0;
            font-weight: bold;
          }
          .summary-section {
            border: 2px solid #000;
            padding: 4mm;
            margin-top: 4mm;
            text-align: center;
          }
          .net-pay {
            font-size: 16px;
            font-weight: bold;
            margin: 2mm 0;
          }
          .footer {
            text-align: center;
            margin-top: 8mm;
            font-size: 9px;
            color: #666;
          }
          .signature-section {
            margin-top: 10mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10mm;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 15mm;
            padding-top: 2mm;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <!-- Header -->
          <div class="header">
            <div class="company-name">SNL TECHNOLOGY</div>
            <div>VQRQ+J4 Calumpit, Bulacan, Philippines</div>
            <div>0927-592-6072 | hello@snlvirtualpartner.com</div>
          </div>

          <!-- Payslip Title -->
          <div class="payslip-title">PAYSLIP FOR PERIOD: ${payslip.period}</div>

          <!-- Employee Information -->
          <div class="employee-info">
            <div>
              <div class="info-group">
                <span class="info-label">Employee Name:</span>
                <span>${payslip.employee_name}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Position:</span>
                <span>${payslip.employee?.position || 'N/A'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Department:</span>
                <span>${payslip.employee?.department || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div class="info-group">
                <span class="info-label">Employee ID:</span>
                <span>${payslip.employee?.employee_id || 'N/A'}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Pay Date:</span>
                <span>${payslip.generated_at}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Days Worked:</span>
                <span>${payslip.days_worked}</span>
              </div>
            </div>
          </div>

          <!-- Earnings and Deductions -->
          <div class="tables-container">
            <!-- Earnings -->
            <div class="table-section">
              <div class="section-title">EARNINGS</div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="width: 25mm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary (${payslip.days_worked} days @ ₱${payslip.daily_rate})</td>
                    <td class="amount">₱${payslip.gross_base}</td>
                  </tr>
                  ${payslip.night_diff_pay && Number(payslip.night_diff_pay.replace(/,/g, '')) > 0 ? `
                    <tr>
                      <td>Night Differential</td>
                      <td class="amount">₱${payslip.night_diff_pay}</td>
                    </tr>
                  ` : ''}
                  ${payslip.allowances && payslip.allowances.length > 0
        ? payslip.allowances.map(allowance => `
                      <tr>
                        <td>${allowance.allowance_type}</td>
                        <td class="amount">₱${allowance.allowance_amount}</td>
                      </tr>
                    `).join('')
        : ''
      }
                  <tr class="total-row">
                    <td><strong>TOTAL EARNINGS</strong></td>
                    <td class="amount"><strong>₱${payslip.gross_pay}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Deductions -->
            <div class="table-section">
              <div class="section-title">DEDUCTIONS</div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="width: 25mm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${payslip.deductions && payslip.deductions.length > 0
        ? payslip.deductions.map(deduction => `
                      <tr>
                        <td>${deduction.deduction_type}</td>
                        <td class="amount">₱${deduction.deduction_amount}</td>
                      </tr>
                    `).join('')
        : `
                    <tr>
                      <td>No Deductions</td>
                      <td class="amount">₱0.00</td>
                    </tr>
                    `
      }
                  <tr class="total-row">
                    <td><strong>TOTAL DEDUCTIONS</strong></td>
                    <td class="amount"><strong>₱${payslip.total_deductions}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Net Pay Summary -->
          <div class="summary-section">
            <div style="margin-bottom: 2mm;">
              <strong>GROSS PAY: ₱${payslip.gross_pay}</strong> | 
              <strong>DEDUCTIONS: ₱${payslip.total_deductions}</strong>
            </div>
            <div class="net-pay">NET PAY: ₱${payslip.net_pay}</div>
            <div style="font-size: 10px; margin-top: 2mm;">
              Amount will be deposited to your registered bank account
            </div>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-line">
              Employee's Signature
            </div>
            <div class="signature-line">
              Authorized Signature
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>Generated by SNL Technology Payroll System</div>
            <div>This is a computer-generated document. No signature required for electronic copy.</div>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123 // A4 height in pixels at 96 DPI
    });

    document.body.removeChild(iframe);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);

    const fileName = `payslip-${payslip.employee_name.replace(/[^a-zA-Z0-9]/g, '-')}-${payslip.period.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Ultra-simple version for thermal printers or quick printing
export const generateSimplePayslipPDF = async (payslip: PayslipData): Promise<void> => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Set font
    pdf.setFont('helvetica');
    pdf.setFontSize(10);

    let yPosition = 20;

    // Header
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SNL TECHNOLOGY', 105, yPosition, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition += 6;
    pdf.text('PAYSLIP', 105, yPosition, { align: 'center' });
    yPosition += 4;
    pdf.text(`Period: ${payslip.period}`, 105, yPosition, { align: 'center' });
    yPosition += 8;

    // Employee Info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employee Information:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 5;
    pdf.text(`Name: ${payslip.employee_name}`, 20, yPosition);
    yPosition += 4;
    pdf.text(`ID: ${payslip.employee?.employee_id || 'N/A'}`, 20, yPosition);
    yPosition += 4;
    pdf.text(`Position: ${payslip.employee?.position || 'N/A'}`, 20, yPosition);
    yPosition += 4;
    pdf.text(`Days Worked: ${payslip.days_worked}`, 20, yPosition);
    yPosition += 8;

    // Earnings
    pdf.setFont('helvetica', 'bold');
    pdf.text('EARNINGS', 20, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.text('Basic Salary:', 25, yPosition);
    pdf.text(`₱${payslip.gross_base}`, 180, yPosition, { align: 'right' });
    yPosition += 4;

    // Allowances
    if (payslip.allowances && payslip.allowances.length > 0) {
      payslip.allowances.forEach(allowance => {
        pdf.text(`${allowance.allowance_type}:`, 25, yPosition);
        pdf.text(`₱${allowance.allowance_amount}`, 180, yPosition, { align: 'right' });
        yPosition += 4;
      });
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Earnings:', 25, yPosition);
    pdf.text(`₱${payslip.gross_pay}`, 180, yPosition, { align: 'right' });
    yPosition += 8;

    // Deductions
    pdf.setFont('helvetica', 'bold');
    pdf.text('DEDUCTIONS', 20, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    if (payslip.deductions && payslip.deductions.length > 0) {
      payslip.deductions.forEach(deduction => {
        pdf.text(`${deduction.deduction_type}:`, 25, yPosition);
        pdf.text(`₱${deduction.deduction_amount}`, 180, yPosition, { align: 'right' });
        yPosition += 4;
      });
    } else {
      pdf.text('No Deductions', 25, yPosition);
      pdf.text('₱0.00', 180, yPosition, { align: 'right' });
      yPosition += 4;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Deductions:', 25, yPosition);
    pdf.text(`₱${payslip.total_deductions}`, 180, yPosition, { align: 'right' });
    yPosition += 8;

    // Net Pay
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NET PAY:', 20, yPosition);
    pdf.text(`₱${payslip.net_pay}`, 180, yPosition, { align: 'right' });
    yPosition += 8;

    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${payslip.generated_at}`, 20, yPosition);
    yPosition += 4;
    pdf.text('SNL Technology Payroll System', 105, yPosition, { align: 'center' });

    const fileName = `payslip-${payslip.employee_name.replace(/[^a-zA-Z0-9]/g, '-')}-${payslip.period.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};