import zipfile, xml.etree.ElementTree as ET, re

files = [
 r"school-management/src/main/resources/templates/Template_Import_Diem.xlsx",
 r"school-management/src/main/resources/templates/Template_XetLenLop.xlsx"
]
ns = {
 'm':'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
 'p':'http://schemas.openxmlformats.org/package/2006/relationships'
}

def read_template(path):
    print(f"\n=== {path} ===")
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rid_to_target = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels.findall('p:Relationship', ns)}

        sst = []
        if 'xl/sharedStrings.xml' in z.namelist():
            sroot = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in sroot.findall('m:si', ns):
                texts = [t.text or '' for t in si.findall('.//m:t', ns)]
                sst.append(''.join(texts))

        sheets = []
        for s in wb.findall('m:sheets/m:sheet', ns):
            name = s.attrib['name']
            rid = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            target = rid_to_target[rid]
            if not target.startswith('/'):
                target = 'xl/' + target
            else:
                target = target.lstrip('/')
            sheets.append((name, target))

        print('Sheets: ' + ', '.join(n for n, _ in sheets))
        for name, target in sheets:
            root = ET.fromstring(z.read(target))
            rows = []
            for row in root.findall('m:sheetData/m:row', ns):
                rnum = int(row.attrib['r'])
                cells = []
                for c in row.findall('m:c', ns):
                    ref = c.attrib.get('r', '')
                    t = c.attrib.get('t')
                    v = ''
                    if t == 's':
                        vi = c.find('m:v', ns)
                        if vi is not None and vi.text is not None:
                            idx = int(vi.text)
                            v = sst[idx] if idx < len(sst) else vi.text
                    elif t == 'inlineStr':
                        vv = c.find('m:is/m:t', ns)
                        v = vv.text if vv is not None and vv.text is not None else ''
                    else:
                        vi = c.find('m:v', ns)
                        if vi is not None and vi.text is not None:
                            v = vi.text
                        else:
                            vv = c.find('m:is/m:t', ns)
                            v = vv.text if vv is not None and vv.text is not None else ''
                    if v != '':
                        cells.append((ref, v))
                if cells:
                    rows.append((rnum, cells))
            print(f"-- Sheet: {name} ({target})")
            for rnum, cells in rows[:30]:
                print(' Row ' + str(rnum) + ': ' + ' | '.join(f"{ref}={val}" for ref, val in cells))

for f in files:
    read_template(f)
