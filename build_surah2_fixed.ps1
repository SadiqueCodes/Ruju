$srcPath = "C:\Users\alisa\Ruju\result.json"
$outPath = "C:\Users\alisa\Ruju\surah2_fixed.json"

$data = Get-Content -Raw -Encoding UTF8 $srcPath | ConvertFrom-Json

function Flat($t){
  if($t -is [string]){ return $t }
  if($t -is [System.Collections.IEnumerable]){ return (($t|%{ if($_ -is [string]){$_} elseif($_.text){$_.text} else {''} }) -join '') }
  return ''
}
function Clean([string]$s){ if(-not $s){return ''}; $s=$s -replace "`r`n","`n" -replace "`r","`n"; $s=[regex]::Replace($s,"`n{3,}","`n`n"); return $s.Trim() }
function Norm([string]$s){ $map=@{'۰'='0';'۱'='1';'۲'='2';'۳'='3';'۴'='4';'۵'='5';'۶'='6';'۷'='7';'۸'='8';'۹'='9';'٠'='0';'١'='1';'٢'='2';'٣'='3';'٤'='4';'٥'='5';'٦'='6';'٧'='7';'٨'='8';'٩'='9'}; $o=''; foreach($ch in $s.ToCharArray()){ $c=[string]$ch; if($map.ContainsKey($c)){$o+=$map[$c]}else{$o+=$c} }; return $o }

$juzStarts=@(@{s=1;a=1},@{s=2;a=142},@{s=2;a=253},@{s=3;a=93},@{s=4;a=24},@{s=4;a=148},@{s=5;a=82},@{s=6;a=111},@{s=7;a=88},@{s=8;a=41},@{s=9;a=93},@{s=11;a=6},@{s=12;a=53},@{s=15;a=1},@{s=17;a=1},@{s=18;a=75},@{s=21;a=1},@{s=23;a=1},@{s=25;a=21},@{s=27;a=56},@{s=29;a=46},@{s=33;a=31},@{s=36;a=28},@{s=39;a=32},@{s=41;a=47},@{s=46;a=1},@{s=51;a=31},@{s=58;a=1},@{s=67;a=1},@{s=78;a=1})
function GetJuz([int]$surah,[int]$ayah){ $c=1; for($i=0;$i -lt $juzStarts.Count;$i++){ $s=$juzStarts[$i].s; $a=$juzStarts[$i].a; if($surah -gt $s -or ($surah -eq $s -and $ayah -ge $a)){ $c=$i+1 } else { break } }; return $c }

$rxSurahNo=[regex]'(?im)^\s*[*_~\-\s]*Sura(?:h|t)\s*(?:No\.?|number)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)'
$rxAy=[regex]'(?im)A(?:a)?y(?:a)?t?\s*(?:No\.?|no\.?)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)\s*(?:[-–]\s*([0-9۰-۹٠-٩]+))?'
$rxQ=[regex]'["“](.+?)["”]'

$current = $null
$stop = $false
$byAyah = @{}

foreach($m in $data.messages){
  if($m.type -ne 'message'){ continue }
  $text = Flat $m.text
  if(-not $text){ continue }
  $text = $text -replace "`r`n","`n" -replace "`r","`n"

  $sm = $rxSurahNo.Match($text)
  if($sm.Success){
    $num = [int](Norm $sm.Groups[1].Value)
    if($num -ge 3){ $stop = $true }
    $current = $num
  } elseif($text -match '(?i)surah\s+.*(baqarah|baqrah)'){ $current = 2 }

  if($stop){ break }
  if($current -ne 2){ continue }

  $ms = $rxAy.Matches($text)
  if($ms.Count -eq 0){ continue }

  for($i=0;$i -lt $ms.Count;$i++){
    $n1 = [int](Norm $ms[$i].Groups[1].Value)
    if($n1 -lt 1 -or $n1 -gt 286){ continue }
    $nums = @($n1)
    if($ms[$i].Groups.Count -gt 2 -and -not [string]::IsNullOrWhiteSpace($ms[$i].Groups[2].Value)){
      $n2 = [int](Norm $ms[$i].Groups[2].Value)
      if($n2 -ge $n1 -and ($n2 - $n1) -le 10){
        for($z=$n1+1; $z -le $n2; $z++){ $nums += $z }
      }
    }
    $start = $ms[$i].Index + $ms[$i].Length
    $end = if($i -lt $ms.Count-1){ $ms[$i+1].Index } else { $text.Length }
    if($end -le $start){ continue }
    $sec = Clean($text.Substring($start,$end-$start))
    if(-not $sec){ continue }

    $arab=''
    foreach($ln in ($sec -split "`n") | Select-Object -First 10){
      $l=$ln.Trim(); if(-not $l){continue}
      if($l -match '[\u0600-\u06FF]' -or $l -match '[ØÙÛ]'){ $arab=$l.Trim('*','_',' ','-','•','▪','️',"`t"); break }
    }
    $tr=''; $qm=$rxQ.Match($sec); if($qm.Success){ $tr=$qm.Groups[1].Value.Trim() }
    $taf=$sec; if($arab){ $taf=[regex]::Replace($taf,[regex]::Escape($arab),'',1) }; if($qm.Success){ $taf=[regex]::Replace($taf,[regex]::Escape($qm.Value),'',1) }; $taf=Clean($taf)

    foreach($n in $nums){
      $rec=[PSCustomObject]@{
        surah_number=2
        surah_name='Al-Baqarah'
        juz_number=GetJuz 2 $n
        ayah_number=$n
        arabic_text=$arab
        translation=$tr
        tafseer=$taf
        source_post_id=$m.id
      }
      if(-not $byAyah.ContainsKey($n) -or ([string]$rec.tafseer).Length -gt ([string]$byAyah[$n].tafseer).Length){ $byAyah[$n]=$rec }
    }
  }
}

$out = $byAyah.Values | Sort-Object ayah_number
$out | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $outPath
"wrote=$($out.Count) path=$outPath"
