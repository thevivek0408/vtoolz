$root='c:\Users\lenovo\Desktop\vtoolz'
Set-Location $root
$html=Get-ChildItem -Recurse -File -Filter *.html | Where-Object { $_.FullName -notmatch '\\games\\(subway-surfers|temple-run-2|cut-the-rope)\\' }
$styleAttrs=0
$inlineScripts=0
$styleBlocks=0
foreach($f in $html){
  $txt=Get-Content -Raw -LiteralPath $f.FullName
  $styleAttrs += [regex]::Matches($txt,'\sstyle\s*=\s*"','IgnoreCase').Count
  $inlineScripts += [regex]::Matches($txt,'<script(?![^>]*\bsrc=)[^>]*>','IgnoreCase').Count
  $styleBlocks += [regex]::Matches($txt,'<style\b','IgnoreCase').Count
}
$js=Get-ChildItem -Recurse -File -Include *.js | Where-Object { $_.FullName -notmatch '\\js\\vendor\\' -and $_.FullName -notmatch '\\games\\' }
$evalRefs=0
foreach($f in $js){
  $txt=Get-Content -Raw -LiteralPath $f.FullName
  $evalRefs += [regex]::Matches($txt,'\b(eval\s*\(|new\s+Function\s*\()','IgnoreCase').Count
}
$lines=@(
  "HTML scoped: $($html.Count)",
  "Inline <script> blocks: $inlineScripts",
  "<style> blocks: $styleBlocks",
  "style= attributes: $styleAttrs",
  "Non-vendor/non-games eval/new Function refs: $evalRefs"
)
Set-Content -LiteralPath "$root\data\csp-metrics.txt" -Value $lines -Encoding UTF8
Write-Output 'ok'
