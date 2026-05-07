Add-Type -AssemblyName System.IO.Compression.FileSystem
function Get-ZipEntryText($zip, $entryPath) {
  $entry = $zip.GetEntry($entryPath)
  if (-not $entry) { return $null }
  $sr = New-Object System.IO.StreamReader($entry.Open())
  try { return $sr.ReadToEnd() } finally { $sr.Close() }
}
$file='school-management/src/main/resources/templates/Template_Import_Diem.xlsx'
$zip=[System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $file))
[xml]$workbookXml = Get-ZipEntryText $zip 'xl/workbook.xml'
[xml]$relsXml = Get-ZipEntryText $zip 'xl/_rels/workbook.xml.rels'
'Rels IDs:'
$relsXml.Relationships.Relationship | ForEach-Object { $_.Id + ' => ' + $_.Target }
'Sheets raw:'
$workbookXml.workbook.sheets.sheet | ForEach-Object { $_.OuterXml; 'idAttr=' + $_.'r:id' + '; plainId=' + $_.id }
$zip.Dispose()
