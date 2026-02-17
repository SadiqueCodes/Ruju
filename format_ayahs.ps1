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
        if ($surah -gt $s -or ($surah -eq $s -and $ayah -ge $a)) {
            $current = $i + 1
        } else {
            break
        }
    }
    return $current
}

function Flatten-Text($textField) {
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

$ayahHeaderRegex = [regex]'(?im)^[^\r\nA-Za-z0-9]{0,40}\s*[*_~\-\s]*Aa?yat\s*(?:No\.?|no\.?)\s*[:#-]?\s*(\d+)\s*[*_~\-\)\]\s]*$'
$surahHeaderWithNoRegex = [regex]'(?im)^\s*[*_~\-\s]*Sura(?:h|t)\s*(?:No\.?|number)\s*[:#-]?\s*(\d+)\s*[-,–:]?\s*([A-Za-z][A-Za-z''\-\s]+)?'
$surahHeaderBaqRegex = [regex]'(?im)^\s*[*_~\-\s]*Sura(?:h|t)\s+.*(?:baqrah|baqarah).*$'
$quoteRegex = [regex]'["“](.+?)["”]'

$lastSurahNumber = $null
$lastSurahName = $null
$result = New-Object System.Collections.Generic.List[object]

foreach ($msg in $data.messages) {
    if ($msg.type -ne 'message') { continue }

    $text = Flatten-Text $msg.text
    if (-not $text) { continue }
    $text = $text -replace "`r`n", "`n"
    $text = $text -replace "`r", "`n"

    $matches = $ayahHeaderRegex.Matches($text)
    $headerEnd = if ($matches.Count -gt 0) { $matches[0].Index } else { [Math]::Min($text.Length, 1200) }
    $headerText = if ($headerEnd -gt 0) { $text.Substring(0, $headerEnd) } else { $text }

    $sm = $surahHeaderWithNoRegex.Match($headerText)
    if ($sm.Success) {
        $detectedSurah = [int]$sm.Groups[1].Value
        if ($lastSurahNumber -ne $detectedSurah) {
            $lastSurahName = $null
        }
        $lastSurahNumber = $detectedSurah

        $candidateName = ''
        if ($sm.Groups.Count -gt 2) { $candidateName = ($sm.Groups[2].Value -replace '\s+', ' ').Trim(' ','*','_','"','''',',','-') }
        if (-not [string]::IsNullOrWhiteSpace($candidateName)) {
            if ($candidateName -match '(?i)baqrah|baqarah') { $candidateName = 'Al-Baqarah' }
            $lastSurahName = $candidateName
        }
    }

    if (-not $sm.Success -and $surahHeaderBaqRegex.IsMatch($headerText)) {
        $lastSurahName = 'Al-Baqarah'
        $lastSurahNumber = 2
    }

    if ($lastSurahNumber -eq 2 -and ([string]::IsNullOrWhiteSpace($lastSurahName))) {
        $lastSurahName = 'Al-Baqarah'
    }
    if (-not $lastSurahNumber -and $lastSurahName -match '(?i)baqarah') {
        $lastSurahNumber = 2
    }

    if ($matches.Count -eq 0) { continue }

    for ($i=0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        if (-not $m -or $m.Groups.Count -lt 2 -or [string]::IsNullOrWhiteSpace($m.Groups[1].Value)) { continue }
        $ayahNo = [int]$m.Groups[1].Value
        $start = $m.Index + $m.Length
        if ($i -lt $matches.Count - 1) {
            $end = $matches[$i+1].Index
        } else {
            $end = $text.Length
        }
        $len = $end - $start
        if ($len -le 0) { continue }
        $section = Clean-Text($text.Substring($start, $len))
        if (-not $section) { continue }

        $arabicText = ''
        $lines = $section -split "`n"
        foreach ($line in $lines | Select-Object -First 8) {
            $ln = $line.Trim()
            if (-not $ln) { continue }
            if ($ln -match '(?i)ayat|aayat|surah|surat') { continue }
            if ($ln -match '[\u0600-\u06FF]' -or $ln -match '[ØÙÛ]') {
                $arabicText = $ln.Trim('*','_',' ','-','•','?','?',"`t")
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

        $resolvedSurahName = $lastSurahName
        if ([string]::IsNullOrWhiteSpace($resolvedSurahName) -and $lastSurahNumber) {
            $resolvedSurahName = "Surah $lastSurahNumber"
        }

        $obj = [PSCustomObject]@{
            surah_number = $lastSurahNumber
            surah_name = $resolvedSurahName
            juz_number = if ($lastSurahNumber) { Get-JuzNumber -surah $lastSurahNumber -ayah $ayahNo } else { $null }
            ayah_number = $ayahNo
            arabic_text = $arabicText
            translation = $translation
            tafseer = $tafseer
            source_post_id = $msg.id
        }
        $result.Add($obj)
    }
}

$result | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath -Encoding UTF8
Write-Output ("Wrote {0} ayah records to {1}" -f $result.Count, $outputPath)


