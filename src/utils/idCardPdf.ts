import { School, Student } from '../types';

/**
 * Generates and triggers high-resolution, print-ready PDF printing of Student ID Cards.
 * Formats multiple cards per A4 page with crisp borders, accurate margins,
 * properly embedded Anek Gujarati font, and professional school badge aesthetics.
 */
export function printStudentIdCards(school: School, students: Student[]) {
  if (students.length === 0) {
    alert('કૃપા કરીને આઈડી કાર્ડ છાપવા માટે ઓછામાં ઓછો એક વિદ્યાર્થી પસંદ કરો (Please select at least one student).');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('કૃપા કરીને આઈડી કાર્ડ પ્રિન્ટ કરવા માટે બ્રાઉઝરમાં પોપ-અપની પરવાનગી આપો (Please allow popups to print ID cards).');
    return;
  }

  const schoolDise = school.diseCode || 'DISE NOT SPECIFIED';
  const schoolContact = school.contactPhone || school.principalPhone || '';

  const cardsHtml = students
    .map((st) => {
      const stdDisplay = String(st.standard).replace(/^class\s*/i, '').trim();
      const secDisplay = st.section || st.division || '';
      const grDisplay = st.grNumber || '-';
      const dobDisplay = st.dob || '-';
      const bloodDisplay = st.bloodGroup || '-';
      const parentName = st.fatherName || st.motherName || '-';
      const contactDisplay = st.contactNumber || st.mobileNumber || '-';
      const addressDisplay = st.address || school.address || school.district || '-';

      return `
        <div class="id-card-wrapper">
          <div class="id-card">
            <!-- Header -->
            <div class="card-header">
              <div class="header-inner">
                <div class="school-seal">
                  <div class="seal-icon">🏫</div>
                </div>
                <div class="school-info">
                  <div class="school-name">${school.schoolName}</div>
                  <div class="school-meta">${school.district || ''} ${school.taluka ? `• તા. ${school.taluka}` : ''} • DISE: ${st.diseCode || schoolDise}</div>
                </div>
              </div>
              <div class="card-banner">વિદ્યાર્થી ઓળખપત્ર • STUDENT ID CARD</div>
            </div>

            <!-- Body -->
            <div class="card-body">
              <!-- Photo Box -->
              <div class="photo-col">
                <div class="photo-container">
                  ${
                    st.photoUrl
                      ? `<img src="${st.photoUrl}" alt="${st.studentName}" class="student-photo" />`
                      : `<div class="photo-placeholder">
                          <span class="photo-letter">${(st.studentName || 'S').trim().charAt(0)}</span>
                          <span class="photo-caption">PHOTO</span>
                        </div>`
                  }
                </div>
                <div class="gr-tag">
                  <span class="gr-lbl">G.R. NO.</span>
                  <span class="gr-val">${grDisplay}</span>
                </div>
              </div>

              <!-- Details Box -->
              <div class="details-col">
                <div class="student-name" title="${st.studentName}">
                  ${st.studentName}
                </div>

                <table class="details-table">
                  <tr>
                    <td class="lbl">ધોરણ (Std):</td>
                    <td class="val highlight">${stdDisplay} ${secDisplay ? `(${secDisplay})` : ''}</td>
                    <td class="lbl">રોલ નં:</td>
                    <td class="val">${st.rollNumber || '-'}</td>
                  </tr>
                  <tr>
                    <td class="lbl">જન્મ તારીખ:</td>
                    <td class="val">${dobDisplay}</td>
                    <td class="lbl">બ્લડ ગ્રૂપ:</td>
                    <td class="val highlight-blood">${bloodDisplay}</td>
                  </tr>
                  <tr>
                    <td class="lbl">વાલીનું નામ:</td>
                    <td class="val" colspan="3">${parentName}</td>
                  </tr>
                  <tr>
                    <td class="lbl">સંપર્ક / Mobile:</td>
                    <td class="val" colspan="3">${contactDisplay}</td>
                  </tr>
                  <tr>
                    <td class="lbl">સરનામું:</td>
                    <td class="val address-val" colspan="3">${addressDisplay}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <div class="footer-left">
                <div class="validity">શૈક્ષણિક વર્ષ ૨૦૨૬–૨૭</div>
                ${schoolContact ? `<div class="school-contact">📞 ${schoolContact}</div>` : ''}
              </div>
              <div class="footer-right">
                <div class="sig-line">આચાર્યશ્રી સહી</div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="gu">
    <head>
      <meta charset="UTF-8">
      <title>${school.schoolName} - Student ID Cards</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          font-family: 'Anek Gujarati', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
          background: #ffffff;
          color: #0f172a;
          margin: 0;
          padding: 8px;
        }

        .header-print-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          margin-bottom: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7mm 6mm;
          page-break-inside: auto;
        }

        .id-card-wrapper {
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
        }

        .id-card {
          width: 90mm;
          height: 57mm;
          border: 1.5px solid #1e293b;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        /* Card Header */
        .card-header {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #ffffff;
          padding: 4px 6px 3px 6px;
          border-bottom: 2px solid #e27d4e;
        }

        .header-inner {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .school-seal {
          width: 22px;
          height: 22px;
          background: #e27d4e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
        }

        .school-info {
          flex: 1;
          min-width: 0;
          line-height: 1.15;
        }

        .school-name {
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.3px;
          color: #ffffff;
        }

        .school-meta {
          font-size: 8.5px;
          color: #cbd5e1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-banner {
          background: #9d512d;
          color: #ffffff;
          text-align: center;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 0;
          margin-top: 3px;
          border-radius: 2px;
          letter-spacing: 0.5px;
        }

        /* Card Body */
        .card-body {
          flex: 1;
          display: flex;
          padding: 4px 6px;
          gap: 6px;
          background: #fafafa;
        }

        .photo-col {
          width: 23mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .photo-container {
          width: 22mm;
          height: 27mm;
          border: 1px solid #94a3b8;
          border-radius: 4px;
          overflow: hidden;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .student-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
        }

        .photo-letter {
          font-size: 20px;
          font-weight: 800;
          color: #9d512d;
        }

        .photo-caption {
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #94a3b8;
        }

        .gr-tag {
          margin-top: 2px;
          width: 100%;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          text-align: center;
          padding: 1px 2px;
          line-height: 1.1;
        }

        .gr-lbl {
          display: block;
          font-size: 7px;
          font-weight: 700;
          color: #64748b;
        }

        .gr-val {
          display: block;
          font-size: 9.5px;
          font-weight: 800;
          color: #0f172a;
          font-family: monospace;
        }

        /* Details Column */
        .details-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .student-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 2px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5px;
          line-height: 1.35;
        }

        .details-table td {
          padding: 1px 2px;
          vertical-align: top;
        }

        .details-table .lbl {
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
          width: 22%;
        }

        .details-table .val {
          font-weight: 700;
          color: #0f172a;
        }

        .details-table .val.highlight {
          color: #9d512d;
          font-size: 9.5px;
        }

        .details-table .val.highlight-blood {
          color: #b91c1c;
          font-weight: 800;
        }

        .address-val {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-weight: 500 !important;
          color: #334155 !important;
          font-size: 8px !important;
          line-height: 1.15 !important;
        }

        /* Card Footer */
        .card-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 2px 6px 3px 6px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .footer-left {
          line-height: 1.15;
        }

        .validity {
          font-size: 7.5px;
          font-weight: 700;
          color: #059669;
        }

        .school-contact {
          font-size: 7.5px;
          color: #64748b;
        }

        .footer-right {
          text-align: right;
        }

        .sig-line {
          font-size: 8px;
          font-weight: 700;
          color: #1e293b;
          border-top: 1px dashed #94a3b8;
          padding-top: 2px;
          min-width: 20mm;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header-print-bar no-print">
        <div>
          <strong style="font-size: 15px; color: #0f172a;">${school.schoolName}</strong>
          <span style="font-size: 13px; color: #64748b; margin-left: 8px;">વિદ્યાર્થી ઓળખપત્ર (કુલ: ${students.length} આઈડી કાર્ડ)</span>
        </div>
        <div>
          <button onclick="window.print()" style="background: #9d512d; color: white; border: none; padding: 7px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
            🖨️ પ્રિન્ટ કરો / Save as PDF
          </button>
        </div>
      </div>

      <div class="cards-grid">
        ${cardsHtml}
      </div>

      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 600);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
