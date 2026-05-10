import React, { useState } from 'react'
import {
  FileText, TrendingUp, Home, Receipt,
  Download, Loader2, CheckCircle2, BarChart3,
  Calendar, Building2, ChevronDown
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────────
function noći(a, b) { return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000)) }
function mesecNaziv(m) {
  return ['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'][m - 1] || ''
}

// jsPDF doesn't support Serbian chars with Helvetica — normalize for PDF text only
function s(str) {
  return (str || '').toString()
    .replace(/č/g,'c').replace(/ć/g,'c').replace(/š/g,'s').replace(/ž/g,'z').replace(/đ/g,'dj')
    .replace(/Č/g,'C').replace(/Ć/g,'C').replace(/Š/g,'S').replace(/Ž/g,'Z').replace(/Đ/g,'Dj')
}

// Unique occupied days in a month from reservations
function occupiedDays(rezs, monthStart, monthEnd) {
  const days = new Set()
  for (const r of rezs) {
    const start = new Date(Math.max(new Date(r.dolazak), monthStart))
    const end   = new Date(Math.min(new Date(r.odlazak), monthEnd))
    let d = new Date(start)
    while (d < end) {
      days.add(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
  }
  return days.size
}

// ── PDF Shared Utilities ───────────────────────────────────────────────────────
const TEAL = [1, 105, 111]
const GREEN = [16, 185, 129]
const RED = [239, 68, 68]
const AMBER = [245, 158, 11]

function pdfHeader(doc, title, subtitle) {
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('HostOS', 14, 13)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistem za upravljanje apartmanima', 14, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(s(title), 196, 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(s(subtitle), 196, 18, { align: 'right' })
  doc.text(`Generisano: ${new Date().toLocaleDateString('sr-RS')}`, 196, 25, { align: 'right' })
  doc.setTextColor(30, 30, 30)
  return 38
}

function pdfSection(doc, y, text, color = TEAL) {
  doc.setFillColor(245, 247, 250)
  doc.rect(12, y - 5, 186, 11, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...color)
  doc.text(s(text).toUpperCase(), 15, y + 2)
  doc.setTextColor(30, 30, 30)
  return y + 13
}

function pdfSummaryBox(doc, y, items) {
  const boxH = items.length * 9 + 10
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(220, 228, 236)
  doc.roundedRect(12, y, 186, boxH, 3, 3, 'FD')
  items.forEach(([label, value, isTotal], i) => {
    const yy = y + 9 + i * 9
    if (isTotal) {
      doc.setDrawColor(220, 228, 236)
      doc.line(14, yy - 3, 196, yy - 3)
    }
    doc.setFontSize(isTotal ? 10 : 8.5)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setTextColor(isTotal ? ...TEAL : 100, isTotal ? undefined : 100, isTotal ? undefined : 110)
    doc.text(s(label), 17, yy)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(isTotal ? 15 : 30, isTotal ? 80 : 30, isTotal ? 85 : 30)
    doc.text(s(value), 194, yy, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
  })
  return y + boxH + 8
}

function pdfFooter(doc) {
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...TEAL)
    doc.rect(0, 287, 210, 10, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('HostOS — hostos-app.vercel.app', 14, 293)
    doc.text(`Stranica ${i} od ${pages}`, 196, 293, { align: 'right' })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MESEČNI IZVEŠTAJ
// ═══════════════════════════════════════════════════════════════════════════════
function generateMesecni(rezs, trans, apartmani, mesec, godina, aptFilter) {
  const doc = new jsPDF()
  const aptNaziv = aptFilter === 'all' ? 'Svi apartmani' : (apartmani.find(a => a.id == aptFilter)?.naziv || '—')
  const monthStart = new Date(godina, mesec - 1, 1)
  const monthEnd   = new Date(godina, mesec, 0, 23, 59, 59)
  const daysInMonth = new Date(godina, mesec, 0).getDate()
  const aptList = aptFilter === 'all' ? apartmani : apartmani.filter(a => a.id == aptFilter)

  let y = pdfHeader(doc, 'Mesecni izvestaj', `${mesecNaziv(mesec)} ${godina}  |  ${aptNaziv}`)

  // Rezervacije
  y = pdfSection(doc, y, 'Rezervacije')
  const filtRez = rezs.filter(r => r.status !== 'otkazano')
  if (filtRez.length === 0) {
    doc.setFontSize(8.5); doc.setTextColor(150, 150, 150)
    doc.text('Nema rezervacija u ovom periodu.', 15, y); y += 12; doc.setTextColor(30, 30, 30)
  } else {
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [['Gost', 'Apartman', 'Dolazak', 'Odlazak', 'Noci', 'Gostiju', 'EUR']],
      body: filtRez.map(r => {
        const apt = apartmani.find(a => a.id === r.apartman_id)
        return [s(r.gost), s(apt?.naziv||'—'), r.dolazak, r.odlazak, noći(r.dolazak,r.odlazak), r.br_gostiju||1, (r.cena||0).toFixed(2)]
      }),
      foot: [[{ content: 'UKUPNO', colSpan: 4, styles: { fontStyle: 'bold' } },
              filtRez.reduce((a,r)=>a+noći(r.dolazak,r.odlazak),0), '',
              { content: filtRez.reduce((a,r)=>a+(r.cena||0),0).toFixed(2), styles: { fontStyle: 'bold' } }]],
      footStyles: { fillColor: [240, 253, 250], textColor: TEAL, fontStyle: 'bold' }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Finansije
  const prihodi  = trans.filter(t => t.tip === 'prihod')
  const troskovi = trans.filter(t => t.tip === 'trosak')

  if (prihodi.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = pdfSection(doc, y, 'Prihodi (finansije)', GREEN)
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['Opis', 'Kategorija', 'Datum', 'EUR']],
      body: prihodi.map(t => [s(t.opis), s(t.kategorija), t.datum||'', (t.iznos||0).toFixed(2)]),
      foot: [[{ content: 'UKUPNO', colSpan: 3, styles: { fontStyle: 'bold' } },
              { content: prihodi.reduce((a,t)=>a+(t.iznos||0),0).toFixed(2), styles: { fontStyle: 'bold' } }]],
      footStyles: { fillColor: [240, 253, 244], textColor: GREEN, fontStyle: 'bold' }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (troskovi.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = pdfSection(doc, y, 'Troskovi', RED)
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['Opis', 'Kategorija', 'Datum', 'EUR']],
      body: troskovi.map(t => [s(t.opis), s(t.kategorija), t.datum||'', (t.iznos||0).toFixed(2)]),
      foot: [[{ content: 'UKUPNO', colSpan: 3, styles: { fontStyle: 'bold' } },
              { content: troskovi.reduce((a,t)=>a+(t.iznos||0),0).toFixed(2), styles: { fontStyle: 'bold' } }]],
      footStyles: { fillColor: [254, 242, 242], textColor: RED, fontStyle: 'bold' }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Rezime
  if (y > 230) { doc.addPage(); y = 20 }
  y = pdfSection(doc, y, 'Rezime')
  const rezPrihod   = filtRez.reduce((a,r)=>a+(r.cena||0),0)
  const finPrihodi  = prihodi.reduce((a,t)=>a+(t.iznos||0),0)
  const finTroskovi = troskovi.reduce((a,t)=>a+(t.iznos||0),0)
  const neto        = rezPrihod + finPrihodi - finTroskovi
  const occupied    = occupiedDays(filtRez.filter(r => aptFilter === 'all' || r.apartman_id == aptFilter), monthStart, monthEnd)
  const totalAvail  = daysInMonth * aptList.length
  const occPct      = totalAvail > 0 ? Math.round(occupied / totalAvail * 100) : 0

  pdfSummaryBox(doc, y, [
    ['Prihod od rezervacija', `€${rezPrihod.toFixed(2)}`],
    ['Ostali prihodi (uneti)', `€${finPrihodi.toFixed(2)}`],
    ['Ukupni troskovi', `€${finTroskovi.toFixed(2)}`],
    ['Popunjenost', `${occupied} od ${totalAvail} dana (${occPct}%)`],
    ['Neto profit', `€${neto.toFixed(2)}`, true],
  ])

  pdfFooter(doc)
  doc.save(`hostos-mesecni-${godina}-${String(mesec).padStart(2,'0')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROFIT REPORT
// ═══════════════════════════════════════════════════════════════════════════════
function generateProfit(rezs, trans, apartmani, mesec, godina, aptFilter) {
  const doc = new jsPDF()
  const aptNaziv = aptFilter === 'all' ? 'Svi apartmani' : (apartmani.find(a => a.id == aptFilter)?.naziv || '—')

  let y = pdfHeader(doc, 'Profit izvestaj', `${mesecNaziv(mesec)} ${godina}  |  ${aptNaziv}`)

  const filtRez  = rezs.filter(r => r.status !== 'otkazano')
  const prihodi  = trans.filter(t => t.tip === 'prihod')
  const troskovi = trans.filter(t => t.tip === 'trosak')
  const rezPrihod = filtRez.reduce((a,r)=>a+(r.cena||0),0)

  // Group by category
  const prihodiKat = { 'Rezervacije': rezPrihod }
  prihodi.forEach(t => { const k = s(t.kategorija||'Ostalo'); prihodiKat[k] = (prihodiKat[k]||0) + (t.iznos||0) })
  const troskoviKat = {}
  troskovi.forEach(t => { const k = s(t.kategorija||'Ostalo'); troskoviKat[k] = (troskoviKat[k]||0) + (t.iznos||0) })

  const totalP = Object.values(prihodiKat).reduce((a,v)=>a+v,0)
  const totalT = Object.values(troskoviKat).reduce((a,v)=>a+v,0)
  const neto   = totalP - totalT
  const marza  = totalP > 0 ? Math.round(neto / totalP * 100) : 0

  // Prihodi po kategoriji
  y = pdfSection(doc, y, 'Prihodi po kategoriji', GREEN)
  autoTable(doc, {
    startY: y, margin: { left: 12, right: 12 },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: { 2: { halign: 'right' } },
    head: [['Kategorija', '% od ukupnog', 'Iznos (EUR)']],
    body: Object.entries(prihodiKat).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [
      k, `${totalP > 0 ? Math.round(v/totalP*100) : 0}%`, `€${v.toFixed(2)}`
    ]),
    foot: [[{ content: 'UKUPNO', colSpan: 2, styles: { fontStyle: 'bold' } },
            { content: `€${totalP.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }]],
    footStyles: { fillColor: [240, 253, 244], textColor: GREEN, fontStyle: 'bold' }
  })
  y = doc.lastAutoTable.finalY + 10

  // Troskovi po kategoriji
  if (Object.keys(troskoviKat).length > 0) {
    y = pdfSection(doc, y, 'Troskovi po kategoriji', RED)
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: { 2: { halign: 'right' } },
      head: [['Kategorija', '% od prihoda', 'Iznos (EUR)']],
      body: Object.entries(troskoviKat).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [
        k, `${totalP > 0 ? Math.round(v/totalP*100) : 0}%`, `€${v.toFixed(2)}`
      ]),
      foot: [[{ content: 'UKUPNO', colSpan: 2, styles: { fontStyle: 'bold' } },
              { content: `€${totalT.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }]],
      footStyles: { fillColor: [254, 242, 242], textColor: RED, fontStyle: 'bold' }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Rezime
  if (y > 230) { doc.addPage(); y = 20 }
  y = pdfSection(doc, y, 'Profit rezime')
  pdfSummaryBox(doc, y, [
    ['Ukupni prihodi', `€${totalP.toFixed(2)}`],
    ['Ukupni troskovi', `€${totalT.toFixed(2)}`],
    ['Profit marza', `${marza}%`],
    ['Neto profit', `€${neto.toFixed(2)}`, true],
  ])

  pdfFooter(doc)
  doc.save(`hostos-profit-${godina}-${String(mesec).padStart(2,'0')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. OCCUPANCY REPORT
// ═══════════════════════════════════════════════════════════════════════════════
function generateOccupancy(rezs, trans, apartmani, mesec, godina, aptFilter) {
  const doc = new jsPDF()
  const aptNaziv = aptFilter === 'all' ? 'Svi apartmani' : (apartmani.find(a => a.id == aptFilter)?.naziv || '—')
  const monthStart  = new Date(godina, mesec - 1, 1)
  const monthEnd    = new Date(godina, mesec, 0, 23, 59, 59)
  const daysInMonth = new Date(godina, mesec, 0).getDate()
  const aptList     = aptFilter === 'all' ? apartmani : apartmani.filter(a => a.id == aptFilter)
  const filtRez     = rezs.filter(r => r.status !== 'otkazano')

  let y = pdfHeader(doc, 'Popunjenost', `${mesecNaziv(mesec)} ${godina}  |  ${aptNaziv}`)

  // Popunjenost po apartmanu
  y = pdfSection(doc, y, 'Popunjenost po apartmanu')
  autoTable(doc, {
    startY: y, margin: { left: 12, right: 12 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [238, 242, 255] },
    head: [['Apartman', 'Zauzeto (dani)', 'Slobodnih', 'Popunjenost %', 'Prihod (EUR)', 'RevPAD']],
    body: aptList.map(apt => {
      const aptRez = filtRez.filter(r => r.apartman_id === apt.id)
      const occ    = occupiedDays(aptRez, monthStart, monthEnd)
      const pct    = Math.round(occ / daysInMonth * 100)
      const prihod = aptRez.reduce((a,r)=>a+(r.cena||0),0)
      const revpad = daysInMonth > 0 ? (prihod / daysInMonth).toFixed(2) : '0.00'
      return [s(apt.naziv), occ, daysInMonth - occ, `${pct}%`, `€${prihod.toFixed(2)}`, `€${revpad}`]
    })
  })
  y = doc.lastAutoTable.finalY + 10

  // Detalji
  y = pdfSection(doc, y, 'Detalji rezervacija')
  if (filtRez.length === 0) {
    doc.setFontSize(8.5); doc.setTextColor(150,150,150)
    doc.text('Nema rezervacija.', 15, y); y += 12; doc.setTextColor(30,30,30)
  } else {
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['Gost', 'Apartman', 'Dolazak', 'Odlazak', 'Noci', '% meseca']],
      body: filtRez.map(r => {
        const apt  = apartmani.find(a => a.id === r.apartman_id)
        const noci = noći(r.dolazak, r.odlazak)
        return [s(r.gost), s(apt?.naziv||'—'), r.dolazak, r.odlazak, noci, `${Math.round(noci/daysInMonth*100)}%`]
      })
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Ukupan rezime
  if (y > 230) { doc.addPage(); y = 20 }
  y = pdfSection(doc, y, 'Ukupan rezime')
  const totalOcc    = aptList.reduce((sum,apt) => sum + occupiedDays(filtRez.filter(r=>r.apartman_id===apt.id), monthStart, monthEnd), 0)
  const totalAvail  = daysInMonth * aptList.length
  const totalPrihod = filtRez.reduce((a,r)=>a+(r.cena||0),0)

  pdfSummaryBox(doc, y, [
    ['Dani u mesecu', daysInMonth],
    ['Broj apartmana', aptList.length],
    ['Ukupno zauzeto dana', `${totalOcc} od ${totalAvail}`],
    ['Prosecna popunjenost', `${totalAvail > 0 ? Math.round(totalOcc/totalAvail*100) : 0}%`],
    ['Ukupni prihod', `€${totalPrihod.toFixed(2)}`],
    ['RevPAD (prihod po dostupnom danu)', `€${(totalAvail > 0 ? totalPrihod/totalAvail : 0).toFixed(2)}`, true],
  ])

  pdfFooter(doc)
  doc.save(`hostos-popunjenost-${godina}-${String(mesec).padStart(2,'0')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BORAVIŠNA TAKSA
// ═══════════════════════════════════════════════════════════════════════════════
function generateTax(rezs, trans, apartmani, mesec, godina, aptFilter) {
  const doc = new jsPDF()
  const aptNaziv   = aptFilter === 'all' ? 'Svi apartmani' : (apartmani.find(a => a.id == aptFilter)?.naziv || '—')
  const TAKSA      = 150 // RSD po osobi po noci
  const filtRez    = rezs.filter(r => r.status !== 'otkazano')

  let y = pdfHeader(doc, 'Boravisna taksa', `${mesecNaziv(mesec)} ${godina}  |  ${aptNaziv}`)

  // Info box
  doc.setFillColor(255, 243, 192)
  doc.setDrawColor(251, 191, 36)
  doc.roundedRect(12, y, 186, 16, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(120, 80, 0)
  doc.text(`Boravisna taksa: ${TAKSA} RSD po osobi po noci`, 105, y + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Ovaj dokument sluzi kao pregled za prijavu boravisne takse.', 105, y + 12, { align: 'center' })
  doc.setTextColor(30, 30, 30)
  y += 22

  // Tabela
  y = pdfSection(doc, y, 'Pregled gostiju i takse', AMBER)

  const ukupnaTaksa = filtRez.reduce((sum, r) => sum + noći(r.dolazak,r.odlazak) * (r.br_gostiju||1) * TAKSA, 0)

  if (filtRez.length === 0) {
    doc.setFontSize(8.5); doc.setTextColor(150,150,150)
    doc.text('Nema rezervacija u ovom periodu.', 15, y); y += 12; doc.setTextColor(30,30,30)
  } else {
    autoTable(doc, {
      startY: y, margin: { left: 12, right: 12 },
      headStyles: { fillColor: AMBER, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      head: [['Gost', 'Apartman', 'Dolazak', 'Odlazak', 'Noci', 'Gostiju', 'Taksa (RSD)']],
      body: filtRez.map(r => {
        const apt   = apartmani.find(a => a.id === r.apartman_id)
        const noci  = noći(r.dolazak, r.odlazak)
        const gost  = r.br_gostiju || 1
        return [s(r.gost), s(apt?.naziv||'—'), r.dolazak, r.odlazak, noci, gost, `${(noci*gost*TAKSA).toLocaleString()} RSD`]
      }),
      foot: [[{ content: 'UKUPNA TAKSA', colSpan: 6, styles: { fontStyle: 'bold', halign: 'right' } },
              { content: `${ukupnaTaksa.toLocaleString()} RSD`, styles: { fontStyle: 'bold' } }]],
      footStyles: { fillColor: [255, 243, 192], textColor: [120, 80, 0], fontStyle: 'bold' }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Rezime
  if (y > 230) { doc.addPage(); y = 20 }
  y = pdfSection(doc, y, 'Rezime takse')

  const totalNoci    = filtRez.reduce((a,r)=>a+noći(r.dolazak,r.odlazak), 0)
  const totalGostiju = filtRez.reduce((a,r)=>a+(r.br_gostiju||1), 0)

  pdfSummaryBox(doc, y, [
    ['Broj rezervacija', filtRez.length],
    ['Ukupno nocenja', totalNoci],
    ['Prosecno gostiju po rezervaciji', filtRez.length > 0 ? (totalGostiju / filtRez.length).toFixed(1) : '0'],
    ['Taksa po osobi po noci', `${TAKSA} RSD`],
    ['Ukupna boravisna taksa', `${ukupnaTaksa.toLocaleString()} RSD`, true],
  ])

  pdfFooter(doc)
  doc.save(`hostos-boravisna-taksa-${godina}-${String(mesec).padStart(2,'0')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const REPORTS = [
  {
    id: 'mesecni',
    title: 'Mesečni izveštaj',
    subtitle: 'Sve rezervacije + finansije + rezime',
    icon: FileText,
    color: '#01696f',
    bg: '#01696f12',
    items: ['Tabela svih rezervacija', 'Prihodi i troškovi', 'Popunjenost', 'Neto profit'],
    fn: generateMesecni,
  },
  {
    id: 'profit',
    title: 'Profit report',
    subtitle: 'Prihodi i troškovi po kategorijama',
    icon: TrendingUp,
    color: '#10b981',
    bg: '#10b98112',
    items: ['Prihodi po kategoriji + %', 'Troškovi po kategoriji + %', 'Profit marža', 'Neto profit'],
    fn: generateProfit,
  },
  {
    id: 'occupancy',
    title: 'Occupancy report',
    subtitle: 'Popunjenost i RevPAD po apartmanu',
    icon: BarChart3,
    color: '#6366f1',
    bg: '#6366f112',
    items: ['Zauzeti vs slobodni dani', 'Popunjenost % po apartmanu', 'RevPAD (prihod/dan)', 'Detalji rezervacija'],
    fn: generateOccupancy,
  },
  {
    id: 'tax',
    title: 'Boravišna taksa',
    subtitle: 'Export za poresku prijavu',
    icon: Receipt,
    color: '#f59e0b',
    bg: '#f59e0b12',
    items: ['Lista svih gostiju', 'Broj noćenja × gostiju', 'Taksa 150 RSD/osobi/noći', 'Ukupna taksa za prijavu'],
    fn: generateTax,
  },
]

const MESECI = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: mesecNaziv(i + 1) }))
const GODINE = [2023, 2024, 2025, 2026]

export default function Izvestaji({ apartmani = [] }) {
  const now = new Date()
  const [mesec,     setMesec]     = useState(now.getMonth() + 1)
  const [godina,    setGodina]    = useState(now.getFullYear())
  const [aptFilter, setAptFilter] = useState('all')
  const [loading,   setLoading]   = useState({})
  const [done,      setDone]      = useState({})

  async function fetchData() {
    const pad   = n => String(n).padStart(2, '0')
    const start = `${godina}-${pad(mesec)}-01`
    const lastD = new Date(godina, mesec, 0).getDate()
    const end   = `${godina}-${pad(mesec)}-${pad(lastD)}`

    let rezQ = supabase.from('rezervacije').select('*')
      .lte('dolazak', end)
      .gte('odlazak', start)
    if (aptFilter !== 'all') rezQ = rezQ.eq('apartman_id', aptFilter)

    let trQ = supabase.from('transakcije').select('*')
      .gte('datum', start)
      .lte('datum', end)
    if (aptFilter !== 'all') trQ = trQ.eq('apartman_id', aptFilter)

    const [{ data: rezData }, { data: trData }] = await Promise.all([rezQ, trQ])
    return { rezs: rezData || [], trans: trData || [] }
  }

  async function generate(report) {
    setLoading(l => ({ ...l, [report.id]: true }))
    setDone(d => ({ ...d, [report.id]: false }))
    try {
      const { rezs, trans } = await fetchData()
      report.fn(rezs, trans, apartmani, mesec, godina, aptFilter)
      setDone(d => ({ ...d, [report.id]: true }))
      setTimeout(() => setDone(d => ({ ...d, [report.id]: false })), 3000)
    } catch (e) {
      console.error('PDF error:', e)
    } finally {
      setLoading(l => ({ ...l, [report.id]: false }))
    }
  }

  const selectClass = "flex-1 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#01696f20' }}>
            <FileText size={20} style={{ color: '#01696f' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">Izveštaji</h1>
            <p className="text-sm text-slate-400">Generiši PDF u jednom kliku</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 mb-6 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar size={12} /> Period i apartman
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* Mesec */}
          <div className="relative flex-1 min-w-[130px]">
            <select value={mesec} onChange={e => setMesec(Number(e.target.value))} className={selectClass}>
              {MESECI.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Godina */}
          <div className="relative min-w-[90px]">
            <select value={godina} onChange={e => setGodina(Number(e.target.value))} className={selectClass}>
              {GODINE.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Apartman */}
          {apartmani.length > 1 && (
            <div className="relative flex-1 min-w-[150px]">
              <select value={aptFilter} onChange={e => setAptFilter(e.target.value)} className={selectClass}>
                <option value="all">Svi apartmani</option>
                {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Period badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#01696f' }}>
            {mesecNaziv(mesec)} {godina}
          </span>
          {aptFilter !== 'all' && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {apartmani.find(a => a.id == aptFilter)?.naziv}
            </span>
          )}
        </div>
      </div>

      {/* ── Report Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(report => {
          const Icon    = report.icon
          const isLoad  = loading[report.id]
          const isDone  = done[report.id]

          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Color accent */}
              <div className="h-1.5" style={{ backgroundColor: report.color }} />

              <div className="p-5 flex-1 flex flex-col">
                {/* Icon + title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: report.bg }}>
                    <Icon size={20} style={{ color: report.color }} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{report.subtitle}</p>
                  </div>
                </div>

                {/* Contents list */}
                <div className="space-y-1.5 mb-4 flex-1">
                  {report.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: report.color + 'aa' }} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Generate button */}
                <button
                  onClick={() => generate(report)}
                  disabled={isLoad}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    backgroundColor: isDone ? '#10b981' : report.color,
                    color: 'white',
                  }}
                >
                  {isLoad ? (
                    <><Loader2 size={15} className="animate-spin" /> Generišem...</>
                  ) : isDone ? (
                    <><CheckCircle2 size={15} /> PDF preuzet!</>
                  ) : (
                    <><Download size={15} /> Generiši PDF</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tip ── */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-400 leading-relaxed">
          💡 <strong className="text-slate-600 dark:text-slate-300">Savet:</strong> PDF fajlovi se odmah preuzimaju na vaš uređaj.
          Možete ih otvoriti u bilo kojoj PDF aplikaciji, poslati emailom ili odštampati.
          Srpska slova su prilagođena za maksimalnu kompatibilnost.
        </p>
      </div>
    </div>
  )
}
