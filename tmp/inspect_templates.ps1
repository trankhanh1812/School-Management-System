Add-Type -AssemblyName System.IO.Compression.FileSystem
function Get-ZipEntryText($zip, $entryPath) {
  $entry = $zip.GetEntry($entryPath)
  if (-not $entry) { return $null }
  $sr = New-Object System.IO.StreamReader($entry.Open())
  try { return $sr.ReadToEnd() } finally { $sr.Close() }
}
function Get-CellValue($cell, $sharedStrings){
  $t = $cell.t
  if ($t -eq 's') {
    $idx = [int]$cell.v
    if ($idx -lt $sharedStrings.Count) { return $sharedStrings[$idx] }
    return "$idx"
  }
  if ($t -eq 'inlineStr') { return [string]$cell.is.t }
  if ($cell.v) { return [string]$cell.v }
  if ($cell.is -and $cell.is.t) { return [string]$cell.is.t }
  return ''
}
$files = @(
  'school-management/src/main/resources/templates/Template_Import_Diem.xlsx',
  'school-management/src/main/resources/templates/Template_XetLenLop.xlsx'
)
foreach ($file in $files) {
  Write-Output "`n=== $file ==="
  $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $file))
  try {
    [xml]$workbookXml = Get-ZipEntryText $zip 'xl/workbook.xml'
    [xml]$relsXml = Get-ZipEntryText $zip 'xl/_rels/workbook.xml.rels'
    $sharedStrings = @()
    $sstText = Get-ZipEntryText $zip 'xl/sharedStrings.xml'
    if ($sstText) {
      [xml]$sstXml = $sstText
      foreach ($si in $sstXml.sst.si) {
        if ($si.t) { $sharedStrings += [string]$si.t }
        else {
          $text = ''
          foreach ($r in $si.r) { $text += [string]$r.t }
          $sharedStrings += $text
        }
      }
    }

    $ridToTarget = @{}
    foreach ($rel in $relsXml.Relationships.Relationship) { $ridToTarget[$rel.Id] = $rel.Target }

    $sheetNames = @()
    foreach ($sheet in $workbookXml.workbook.sheets.sheet) { $sheetNames += [string]$sheet.name }
    Write-Output ('Sheets: ' + ($sheetNames -join ', '))

    foreach ($sheet in $workbookXml.workbook.sheets.sheet) {
      $name = [string]$sheet.name
      $rid = [string]$sheet.id
      $target = $ridToTarget[$rid]
      $sheetPath = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { 'xl/' + $target }
      [xml]$sheetXml = Get-ZipEntryText $zip $sheetPath
      Write-Output "-- Sheet: $name ($sheetPath)"
      $rows = @($sheetXml.worksheet.sheetData.row)
      foreach ($row in $rows | Select-Object -First 60) {
        $cellsOut = @()
        foreach ($cell in @($row.c)) {
          $val = Get-CellValue $cell $sharedStrings
          if ($val -ne '') { $cellsOut += (([string]$cell.r) + '=' + $val) }
        }
        if ($cellsOut.Count -gt 0) {
          Write-Output (' Row ' + [string]$row.r + ': ' + ($cellsOut -join ' | '))
        }
      }
    }
  }
  finally { $zip.Dispose() }
}
