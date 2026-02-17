$inputPath = Join-Path (Get-Location) 'result.json'
$outputPath = Join-Path (Get-Location) 'ayahs_formatted.json'

$data = Get-Content -Path $inputPath -Raw -Encoding UTF8 | ConvertFrom-Json

$juzStarts = @(
    @{s=1;a=1}, @{s=2;a=142}, @{s=2;a=253}, @{s=3;a=93}, @{s=4;a=24}, @{s=4;a=148}, @{s=5;a=82}, @{s=6;a=111}, @{s=7;a=88}, @{s=8;a=41},
    @{s=9;a=93}, @{s=11;a=6}, @{s=12;a=53}, @{s=15;a=1}, @{s=17;a=1}, @{s=18;a=75}, @{s=21;a=1}, @{s=23;a=1}, @{s=25;a=21}, @{s=27;a=56},
    @{s=29;a=46}, @{s=33;a=31}, @{s=36;a=28}, @{s=39;a=32}, @{s=41;a=47}, @{s=46;a=1}, @{s=51;a=31}, @{s=58;a=1}, @{s=67;a=1}, @{s=78;a=1}
)

function Get-JuzNumber([int]$surah, [int]$ayah) {
    $current = 1
    for ($i = 0; $i -lt $juzStarts.Count; $i++) {
        $s = $juzStarts[$i].s
        $a = $juzStarts[$i].a
        if ($surah -gt $s -or ($surah -eq $s -and $ayah -ge $a)) { $current = $i + 1 } else { break }
    }
    return $current
}

function Flat-Text($textField) {
    if ($textField -is [string]) { return $textField }
    if ($textField -is [System.Collections.IEnumerable]) {
        $parts = New-Object System.Collections.Generic.List[string]
        foreach ($p in $textField) {
            if ($p -is [string]) { $parts.Add($p) }
            elseif ($p.PSObject.Properties.Name -contains 'text' -and $p.text -is [string]) { $parts.Add($p.text) }
        }
        return ($parts -join '')
    }
    return ''
}

function Clean-Text([string]$t) {
    if (-not $t) { return '' }
    $t = $t -replace "`r`n", "`n"
    $t = $t -replace "`r", "`n"
    $t = [regex]::Replace($t, "`n{3,}", "`n`n")
    return $t.Trim()
}

function Normalize-Digits([string]$s) {
    if (-not $s) { return '' }
    $map = @{
        '۰'='0';'۱'='1';'۲'='2';'۳'='3';'۴'='4';'۵'='5';'۶'='6';'۷'='7';'۸'='8';'۹'='9';
        '٠'='0';'١'='1';'٢'='2';'٣'='3';'٤'='4';'٥'='5';'٦'='6';'٧'='7';'٨'='8';'٩'='9'
    }
    $out = ''
    foreach ($ch in $s.ToCharArray()) {
        $c = [string]$ch
        if ($map.ContainsKey($c)) { $out += $map[$c] } else { $out += $c }
    }
    return $out
}

$surahHeaderRegex = [regex]'(?im)^\s*[*_~\-\s]*Sura(?:h|t)\s*(?:No\.?|number)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)\s*[-,–:]?\s*([A-Za-z][A-Za-z''\-\s]+)?'
$ayahAnyRegex = [regex]'(?i)Aa?yat\s*(?:No\.?|no\.?)\s*[:#-]?\s*([0-9۰-۹٠-٩]+)'
$quoteRegex = [regex]'["“](.+?)["”]'

$lastSurah = $null
$lastSurahName = $null
$recordsByKey = @{}

foreach ($msg in $data.messages) {
    if ($msg.type -ne 'message') { continue }

    $text = Flat-Text $msg.text
    if (-not $text) { continue }
    $text = $text -replace "`r`n", "`n"
    $text = $text -replace "`r", "`n"

    $sh = $surahHeaderRegex.Match($text)
    if ($sh.Success) {
        $lastSurah = [int](Normalize-Digits $sh.Groups[1].Value)
        $name = ($sh.Groups[2].Value -replace '\s+', ' ').Trim(' ','*','_','"','''',',','-')
        if ($name -match '(?i)baqrah|baqarah') { $name = 'Al-Baqarah' }
        $lastSurahName = if ($name) { $name } else { "Surah $lastSurah" }
    } elseif ($text -match '(?i)surah\s+.*(baqarah|baqrah)') {
        $lastSurah = 2
        $lastSurahName = 'Al-Baqarah'
    }

    if (-not $lastSurah) { continue }

    $rawMatches = $ayahAnyRegex.Matches($text)
    if ($rawMatches.Count -eq 0) { continue }

    $matchItems = @()
    foreach ($m in $rawMatches) {
        $lineStart = $text.LastIndexOf("`n", $m.Index)
        if ($lineStart -lt 0) { $lineStart = -1 }
        $prefixLen = $m.Index - ($lineStart + 1)
        if ($prefixLen -lt 0) { continue }
        $prefix = $text.Substring($lineStart + 1, $prefixLen)
        if ($prefix -match '[A-Za-z0-9]') { continue }

        $nRaw = Normalize-Digits $m.Groups[1].Value
        if ($nRaw -notmatch '^\d+$') { continue }
        $n = [int]$nRaw
        if ($n -lt 1 -or $n -gt 286) {
            if ($lastSurah -eq 2) { continue }
        }

        $matchItems += ,@($m, $n)
    }

    if ($matchItems.Count -eq 0) { continue }

    for ($i = 0; $i -lt $matchItems.Count; $i++) {
        $m = $matchItems[$i][0]
        $ayahNo = [int]$matchItems[$i][1]
        $start = $m.Index + $m.Length
        $end = if ($i -lt $matchItems.Count - 1) { $matchItems[$i+1][0].Index } else { $text.Length }
        $len = $end - $start
        if ($len -le 0) { continue }

        $section = Clean-Text($text.Substring($start, $len))
        if (-not $section) { continue }

        $arabicText = ''
        foreach ($line in ($section -split "`n") | Select-Object -First 8) {
            $ln = $line.Trim()
            if (-not $ln) { continue }
            if ($ln -match '(?i)ayat|aayat|surah|surat') { continue }
            if ($ln -match '[\u0600-\u06FF]' -or $ln -match '[ØÙÛ]') {
                $arabicText = $ln.Trim('*','_',' ','-','•','▪','️',"`t")
                break
            }
        }

        $translation = ''
        $q = $quoteRegex.Match($section)
        if ($q.Success) { $translation = $q.Groups[1].Value.Trim() }

        $tafseer = $section
        if ($arabicText) { $tafseer = [regex]::Replace($tafseer, [regex]::Escape($arabicText), '', 1) }
        if ($q.Success) { $tafseer = [regex]::Replace($tafseer, [regex]::Escape($q.Value), '', 1) }
        $tafseer = Clean-Text($tafseer)

        $rec = [PSCustomObject]@{
            surah_number = $lastSurah
            surah_name = if ($lastSurahName) { $lastSurahName } else { "Surah $lastSurah" }
            juz_number = Get-JuzNumber -surah $lastSurah -ayah $ayahNo
            ayah_number = $ayahNo
            arabic_text = $arabicText
            translation = $translation
            tafseer = $tafseer
            source_post_id = $msg.id
        }

        $key = "{0}|{1}" -f $lastSurah, $ayahNo
        if (-not $recordsByKey.ContainsKey($key)) {
            $recordsByKey[$key] = $rec
        } else {
            if (([string]$rec.tafseer).Length -gt ([string]$recordsByKey[$key].tafseer).Length) {
                $recordsByKey[$key] = $rec
            }
        }
    }
}

$out = $recordsByKey.Values | Sort-Object -Property @{Expression='surah_number';Ascending=$true}, @{Expression='ayah_number';Ascending=$true}
$out | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath -Encoding UTF8
"Wrote $($out.Count) unique ayah records to $outputPath"
