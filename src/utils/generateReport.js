import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TEAL = [1, 105, 111]
const DARK = [30, 41, 59]
const GRAY = [100, 116, 139]
const LIGHT = [241, 245, 249]

export function generateReport({ mesec, godina, transakcije, apartmani, rezervacije }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const danas = new Date().toLocaleDateString('sr-RS')

  const MESECI = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

  // Filter transakcije za izabrani mesec/godinu
  const filtrirane = transakcije.filter(t => {
    const d = new Date(t.datum)
    return (mesec === 'sve' || d.getMonth() === Number(mesec)) &&
           d.getFullYear() === Number(godina)
  })

  const prihod = filtrirane.filter(t => t.tip === 'prihod').reduce((s, t) => s + t.iznos, 0)
  const troskovi = filtrirane.filter(t => t.tip === 'trosak').reduce((s, t) => s + Math.abs(t.iznos), 0)
  const neto = prihod - troskovi
  const boravisnaTaksa = filtrirane.filter(t => t.kategorija === 'Boravišna taksa').reduce((s, t) => s + Math.abs(t.iznos), 0)

  const periodNaziv = mesec === 'sve'
    ? `Godišnji izveštaj ${godina}`
    : `${MESECI[Number(mesec)]} ${godina}`

  // ── ZAGLAVLJE ──────────────────────────────────────────────
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('HostOS', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Finansijski izveštaj', 14, 23)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(periodNaziv, 14, 31)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 235, 235)
  doc.text(`Generisano: ${danas}`, pageW - 14, 31, { align: 'right' })

  // ── KPI KARTICE ────────────────────────────────────────────
  let y = 48
  const kpiW = (pageW - 28 - 9) / 4
  const kpis = [
    { naziv: 'Ukupan prihod', iznos: prihod, boja: [16, 185, 129] },
    { naziv: 'Ukupni troskovi', iznos: troskovi, boja: [239, 68, 68] },
    { naziv: 'Neto zarada', iznos: neto, boja: neto >= 0 ? [1, 105, 111] : [239, 68, 68] },
    { naziv: 'Borav. taksa', iznos: boravisnaTaksa, boja: [245, 158, 11], valuta: 'RSD' },
  ]

  kpis.forEach((k, i) => {
    const x = 14 + i * (kpiW + 3)
    doc.setFillColor(...LIGHT)
    doc.roundedRect(x, y, kpiW, 24, 2, 2, 'F')
    doc.setFillColor(...k.boja)
    doc.roundedRect(x, y, kpiW, 4, 2, 2, 'F')
    doc.rect(x, y + 2, kpiW, 2, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(
      k.valuta === 'RSD'
        ? `${k.iznos.toLocaleString('sr-RS')} RSD`
        : `€${k.iznos.toLocaleString('sr-RS')}`,
      x + kpiW / 2, y + 14, { align: 'center' }
    )

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(k.naziv, x + kpiW / 2, y + 20, { align: 'center' })
  })

  // ── PRIHOD PO APARTMANU ────────────────────────────────────
  y += 34
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Prihod po apartmanu', 14, y)

  const prihodPoApt = apartmani.map(a => {
    const aptPrihod = filtrirane.filter(t => t.apartmanId === a.id && t.tip === 'prihod').reduce((s, t) => s + t.iznos, 0)
    const aptTroskovi = filtrirane.filter(t => t.apartmanId === a.id && t.tip === 'trosak').reduce((s, t) => s + Math.abs(t.iznos), 0)
    const aptRez = rezervacije.filter(r => r.apartmanId === a.id &&
      (mesec === 'sve' || new Date(r.dolazak).getMonth() === Number(mesec)) &&
      new Date(r.dolazak).getFullYear() === Number(godina)
    ).length
    return [a.naziv, aptRez.toString(), `€${aptPrihod.toLocaleString('sr-RS')}`, `€${aptTroskovi.toLocaleString('sr-RS')}`, `€${(aptPrihod - aptTroskovi).toLocaleString('sr-RS')}`]
  })

  autoTable(doc, {
    startY: y + 4,
    head: [['Apartman', 'Rezervacije', 'Prihod', 'Troskovi', 'Neto']],
    body: prihodPoApt,
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { textColor: [16, 185, 129] }, 4: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // ── LISTA TRANSAKCIJA ──────────────────────────────────────
  y = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Transakcije', 14, y)

  const redovi = filtrirane.map(t => {
    const apt = apartmani.find(a => a.id === t.apartmanId)
    return [
      t.datum,
      t.opis,
      t.kategorija,
      apt?.naziv || 'Opšte',
      t.tip === 'prihod' ? `+€${t.iznos}` : `-€${Math.abs(t.iznos)}`,
    ]
  })

  autoTable(doc, {
    startY: y + 4,
    head: [['Datum', 'Opis', 'Kategorija', 'Apartman', 'Iznos']],
    body: redovi,
    theme: 'striped',
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      4: {
        fontStyle: 'bold',
        cellCallback: (cell, data) => {
          if (cell.text[0]?.startsWith('+')) cell.styles.textColor = [16, 185, 129]
          else cell.styles.textColor = [239, 68, 68]
        },
      },
    },
    margin: { left: 14, right: 14 },
  })

  // ── BORAVIŠNA TAKSA ────────────────────────────────────────
  if (boravisnaTaksa > 0) {
    y = doc.lastAutoTable.finalY + 10
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFillColor(255, 251, 235)
    doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'F')
    doc.setFillColor(245, 158, 11)
    doc.roundedRect(14, y, 3, 22, 1, 1, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Boravišna taksa za period', 21, y + 8)
    doc.setFontSize(14)
    doc.setTextColor(245, 158, 11)
    doc.text(`${boravisnaTaksa.toLocaleString('sr-RS')} RSD`, 21, y + 17)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text('Zadrzati za placanje poreskoj upravi', pageW - 14, y + 13, { align: 'right' })
  }

  // ── FOOTER ─────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(`HostOS · ${danas} · Strana ${i}/${totalPages}`, pageW / 2, 290, { align: 'center' })
    doc.setDrawColor(...LIGHT)
    doc.line(14, 287, pageW - 14, 287)
  }

  const fileName = `HostOS_${mesec === 'sve' ? godina : `${MESECI[Number(mesec)]}_${godina}`}.pdf`
  doc.save(fileName)
}
