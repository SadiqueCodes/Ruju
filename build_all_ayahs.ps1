$srcPath = "C:\Users\alisa\Ruju\result.json"
$outPath = "C:\Users\alisa\Ruju\ayahs_formatted.json"

$data = Get-Content -Raw -Encoding UTF8 $srcPath | ConvertFrom-Json

$juzStarts = @(
    @{s=1;a=1}, @{s=2;a=142}, @{s=2;a=253}, @{s=3;a=93}, @{s=4;a=24}, @{s=4;a=148}, @{s=5;a=82}, @{s=6;a=111}, @{s=7;a=88}, @{s=8;a=41},
    @{s=9;a=93}, @{s=11;a=6}, @{s=12;a=53}, @{s=15;a=1}, @{s=17;a=1}, @{s=18;a=75}, @{s=21;a=1}, @{s=23;a=1}, @{s=25;a=21}, @{s=27;a=56},
    @{s=29;a=46}, @{s=33;a=31}, @{s=36;a=28}, @{s=39;a=32}, @{s=41;a=47}, @{s=46;a=1}, @{s=51;a=31}, @{s=58;a=1}, @{s=67;a=1}, @{s=78;a=1}
)

$surahAyahMax = @{
    1=7;2=286;3=200;4=176;5=120;6=165;7=206;8=75;9=129;10=109;11=123;12=111;13=43;14=52;15=99;16=128;17=111;18=110;19=98;20=135;
    21=112;22=78;23=118;24=64;25=77;26=227;27=93;28=88;29=69;30=60;31=34;32=30;33=73;34=54;35=45;36=83;37=182;38=88;39=75;40=85;
    41=54;42=53;43=89;44=59;45=37;46=35;47=38;48=29;49=18;50=45;51=60;52=49;53=62;54=55;55=78;56=96;57=29;58=22;59=24;60=13;
    61=14;62=11;63=11;64=18;65=12;66=12;67=30;68=52;69=52;70=44;71=28;72=28;73=20;74=56;75=40;76=31;77=50;78=40;79=46;80=42;
    81=29;82=19;83=36;84=25;85=22;86=17;87=19;88=26;89=30;90=20;91=15;92=21;93=11;94=8;95=8;96=19;97=5;98=8;99=8;100=11;
    101=11;102=8;103=3;104=9;105=5;106=4;107=7;108=3;109=6;110=3;111=5;112=4;113=5;114=6
}

function GetJuz([int]$surah,[int]$ayah){
    $c=1
    for($i=0;$i -lt $juzStarts.Count;$i++){
        $s=$juzStarts[$i].s; $a=$juzStarts[$i].a
        if($surah -gt $s -or ($surah -eq $s -and $ayah -ge $a)){ $c=$i+1 } else { break }
    }
    return $c
}

function Flat($t){
    if($t -is [string]){ return $t }
    if($t -is [System.Collections.IEnumerable]){
        $arr = New-Object System.Collections.ArrayList
        foreach($x in $t){
            if($x -is [string]){ [void]$arr.Add($x) }
            elseif($x.PSObject.Properties.Name -contains 'text' -and $x.text -is [string]){ [void]$arr.Add($x.text) }
        }
        return ($arr -join '')
    }
    return ''
}

function Clean([string]$s){
    if(-not $s){ return '' }
    $s = $s -replace "`r`n","`n" -replace "`r","`n"
    $s = [regex]::Replace($s,"`n{3,}","`n`n")
    return $s.Trim()
}

function Norm([string]$s){
    if(-not $s){ return '' }
    $m=@{'۰'='0';'۱'='1';'۲'='2';'۳'='3';'۴'='4';'۵'='5';'۶'='6';'۷'='7';'۸'='8';'۹'='9';'٠'='0';'١'='1';'٢'='2';'٣'='3';'٤'='4';'٥'='5';'٦'='6';'٧'='7';'٨'='8';'٩'='9'}
    $o=''
    foreach($ch in $s.ToCharArray()){
        $c=[string]$ch
        if($m.ContainsKey($c)){ $o += $m[$c] } else { $o += $c }
    }
    return $o
}

$rxSurahNo = [regex]'(?im)^\s*[^A-Za-z0-9\r\n]{0,30}\s*[*_~\-\s]*Sura(?:h|t)\s*(?:No\.?|number)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)\s*[-,–:]?\s*([A-Za-z][A-Za-z''\-\s]+)?'
$rxAyHeader = [regex]'(?im)A(?:a)?y(?:a)?t?\s*(?:No\.?|no\.?)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)\s*(?:[-–]\s*([0-9۰-۹٠-٩]+))?'
$rxQuote = [regex]'["“]([\s\S]+?)["”]'

$curSurah = $null
$curName = $null
$records = @{}

foreach($msg in $data.messages){
    if($msg.type -ne 'message'){ continue }
    $text = Flat $msg.text
    if(-not $text){ continue }
    $text = $text -replace "`r`n","`n" -replace "`r","`n"

    $sm = $rxSurahNo.Match($text)
    if($sm.Success){
        $num = [int](Norm $sm.Groups[1].Value)
        if($num -ge 1 -and $num -le 114){
            $curSurah = $num
            $nm = ($sm.Groups[2].Value -replace '\s+',' ').Trim(' ','*','_','"','''',',','-')
            if($nm -match '(?i)^al[-\s]?baqrah$|^al[-\s]?baqarah$|^baqarah$|^baqrah$'){ $nm='Al-Baqarah' }
            if([string]::IsNullOrWhiteSpace($nm)){ $nm = "Surah $num" }
            $curName = $nm
        }
    } elseif (-not $curSurah -and $text -match '(?i)surah\s+.*(baqarah|baqrah)') {
        # Bootstrap only at the beginning when explicit Surah No header is missing.
        $curSurah = 2
        $curName = 'Al-Baqarah'
    }

    if(-not $curSurah){ continue }

    $ms = $rxAyHeader.Matches($text)
    if($ms.Count -eq 0){ continue }

    $valid = New-Object System.Collections.ArrayList
    foreach($m in $ms){
        $ls = $text.LastIndexOf("`n", $m.Index)
        if($ls -lt 0){ $ls = -1 }
        $prefixLen = $m.Index - ($ls + 1)
        if($prefixLen -lt 0){ continue }
        $prefix = $text.Substring($ls+1, $prefixLen)
        if($prefix -match '[A-Za-z0-9]'){ continue }
        [void]$valid.Add($m)
    }
    if($valid.Count -eq 0){ continue }

    for($i=0; $i -lt $valid.Count; $i++){
        $m = $valid[$i]
        $n1s = Norm $m.Groups[1].Value
        if($n1s -notmatch '^\d+$'){ continue }
        $n1 = [int]$n1s
        if(-not $surahAyahMax.ContainsKey($curSurah)){ continue }
        $maxAyah = [int]$surahAyahMax[$curSurah]
        if($n1 -lt 1 -or $n1 -gt $maxAyah){ continue }

        $nums = @($n1)
        if($m.Groups.Count -gt 2 -and -not [string]::IsNullOrWhiteSpace($m.Groups[2].Value)){
            $n2s = Norm $m.Groups[2].Value
            if($n2s -match '^\d+$'){
                $n2 = [int]$n2s
                if($n2 -ge $n1 -and $n2 -le $maxAyah -and ($n2-$n1) -le 10){
                    for($z=$n1+1; $z -le $n2; $z++){ $nums += $z }
                }
            }
        }

        $start = $m.Index + $m.Length
        $end = if($i -lt $valid.Count-1){ $valid[$i+1].Index } else { $text.Length }
        if($end -le $start){ continue }

        $section = Clean($text.Substring($start, $end-$start))
        if(-not $section){ continue }

        # For range headers (e.g., 41-42), capture per-ayah Arabic/translation in order.
        $arabLines = New-Object System.Collections.ArrayList
        foreach($ln in ($section -split "`n")){
            $l = $ln.Trim()
            if(-not $l){ continue }
            if($l -match '(?i)ayat|aayat|surah|surat'){ continue }
            if($l -match '[\u0600-\u06FF]' -or $l -match '[ØÙÛ]'){
                $cleanArab = $l.Trim('*','_',' ','-','•','▪','️',"`t")
                if(-not [string]::IsNullOrWhiteSpace($cleanArab)){ [void]$arabLines.Add($cleanArab) }
            }
        }

        $quoteMatches = $rxQuote.Matches($section)
        $translations = New-Object System.Collections.ArrayList
        foreach($qmx in $quoteMatches){
            $qt = $qmx.Groups[1].Value.Trim()
            if(-not [string]::IsNullOrWhiteSpace($qt)){ [void]$translations.Add($qt) }
        }

        $taf = $section
        foreach($aLine in $arabLines){ $taf = [regex]::Replace($taf,[regex]::Escape([string]$aLine),'',1) }
        foreach($qmx in $quoteMatches){ $taf = [regex]::Replace($taf,[regex]::Escape([string]$qmx.Value),'',1) }
        $taf = Clean($taf)

        for($idx=0; $idx -lt $nums.Count; $idx++){
            $a = $nums[$idx]
            $arab = if($idx -lt $arabLines.Count){ [string]$arabLines[$idx] } else { '' }
            $tr = if($idx -lt $translations.Count){ [string]$translations[$idx] } else { '' }
            $rec = [PSCustomObject]@{
                surah_number = $curSurah
                surah_name = if($curName){$curName}else{"Surah $curSurah"}
                juz_number = GetJuz $curSurah ([int]$a)
                ayah_number = [int]$a
                arabic_text = $arab
                translation = $tr
                tafseer = $taf
                source_post_id = $msg.id
            }
            $key = "$curSurah|$a"
            if(-not $records.ContainsKey($key)){ $records[$key] = $rec }
        }
    }
}

$out = $records.Values | Sort-Object @{Expression='surah_number';Ascending=$true}, @{Expression='ayah_number';Ascending=$true}, @{Expression='source_post_id';Ascending=$true}
$out | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $outPath
"Wrote $($out.Count) unique ayah records to $outPath"
