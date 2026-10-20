param(
    [string]$GoExecutable = "go"
)

$ErrorActionPreference = "Stop"
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$repositoryRoot = (Resolve-Path (Join-Path $backendRoot "..")).Path
$evidenceRoot = Join-Path $repositoryRoot "docs\test-evidence"
New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null

function Invoke-GoTest {
    param(
        [string]$WorkingDirectory,
        [string]$LogName,
        [string]$Package,
        [string]$RunPattern,
        [bool]$ShouldFail,
        [string[]]$ExtraArguments = @()
    )

    Push-Location $WorkingDirectory
    try {
        $arguments = @("test", "-count=1", "-v") + $ExtraArguments + @("-run", $RunPattern, $Package)
        $output = & $GoExecutable @arguments 2>&1
        $exitCode = $LASTEXITCODE
        $output | Set-Content -Encoding utf8 -LiteralPath (Join-Path $evidenceRoot $LogName)
        $output | Write-Output

        if ($ShouldFail -and $exitCode -eq 0) {
            throw "Mutation was not detected: $LogName"
        }
        if (-not $ShouldFail -and $exitCode -ne 0) {
            throw "Expected passing test run failed: $LogName"
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-Mutation {
    param(
        [string]$Name,
        [string]$RelativeFile,
        [string]$OldText,
        [string]$NewText,
        [string]$Package,
        [string]$RunPattern
    )

    $temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("quizio-mutation-" + [Guid]::NewGuid().ToString("N"))
    $temporaryBackend = Join-Path $temporaryRoot "backend"
    New-Item -ItemType Directory -Force -Path $temporaryBackend | Out-Null

    try {
        Copy-Item -Recurse -Force -Path (Join-Path $backendRoot "*") -Destination $temporaryBackend
        $target = Join-Path $temporaryBackend $RelativeFile
        $content = ([IO.File]::ReadAllText($target)).Replace("`r`n", "`n")
        if (-not $content.Contains($OldText)) {
            throw "Mutation target was not found for $Name in $RelativeFile"
        }
        [IO.File]::WriteAllText($target, $content.Replace($OldText, $NewText))

        Invoke-GoTest -WorkingDirectory $temporaryBackend -LogName "$Name.txt" -Package $Package -RunPattern $RunPattern -ShouldFail $true
    }
    finally {
        $resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot)
        $resolvedSystemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
        if ($resolvedTemporaryRoot.StartsWith($resolvedSystemTemp, [StringComparison]::OrdinalIgnoreCase) -and
            (Split-Path -Leaf $resolvedTemporaryRoot).StartsWith("quizio-mutation-")) {
            Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Invoke-GoTest -WorkingDirectory $backendRoot -LogName "00-baseline-pass.txt" `
    -Package "./private/tests/shared" `
    -RunPattern "^(TestDecodeJSON|TestNormalizeLimit|TestUpdateAttemptStatus)$" `
    -ShouldFail $false

Invoke-Mutation -Name "01-decode-unknown-fields" `
    -RelativeFile "internal\httpapi\shared\http.go" `
    -OldText "`tdecoder.DisallowUnknownFields()`n" `
    -NewText "" `
    -Package "./private/tests/shared" `
    -RunPattern "TestDecodeJSON/rejects_unknown_fields"

Invoke-Mutation -Name "02-decode-trailing-document" `
    -RelativeFile "internal\httpapi\shared\http.go" `
    -OldText "`tif err := decoder.Decode(&struct{}{}); err != io.EOF {`n`t`treturn errors.New(`"invalid json payload`")`n`t}`n" `
    -NewText "`t_ = io.EOF`n" `
    -Package "./private/tests/shared" `
    -RunPattern "TestDecodeJSON/rejects_second_JSON_object"

Invoke-Mutation -Name "03-limit-default" `
    -RelativeFile "internal\httpapi\shared\http.go" `
    -OldText "`tif limit <= 0 {`n`t`treturn DefaultLimit`n`t}`n" `
    -NewText "`tif limit <= 0 {`n`t`treturn 10`n`t}`n" `
    -Package "./private/tests/shared" `
    -RunPattern "TestNormalizeLimit/(minimum_int32_uses_default|negative_ten_uses_default|negative_one_uses_default|zero_uses_default)"

Invoke-Mutation -Name "04-limit-maximum" `
    -RelativeFile "internal\httpapi\shared\http.go" `
    -OldText "`tif limit > MaxLimit {`n`t`treturn MaxLimit`n`t}`n" `
    -NewText "`tif limit > MaxLimit {`n`t`treturn 200`n`t}`n" `
    -Package "./private/tests/shared" `
    -RunPattern "TestNormalizeLimit/(one_hundred_one_is_capped|five_hundred_is_capped|maximum_int32_is_capped)"

Invoke-Mutation -Name "05-attempt-finished-check" `
    -RelativeFile "internal\httpapi\attempts\update_attempt_status.go" `
    -OldText "`tif row.TimeTaken.Valid {`n`t`twriteError(w, http.StatusConflict, `"attempt_finished`", `"attempt already finished`")`n`t`treturn`n`t}`n`n" `
    -NewText "" `
    -Package "./private/tests/shared" `
    -RunPattern "TestUpdateAttemptStatus/rejects_finished_attempt"

Invoke-Mutation -Name "06-answer-question-membership" `
    -RelativeFile "internal\httpapi\attempts\update_attempt_status.go" `
    -OldText "`t`tif _, exists := answerIDs[update.AnswerID]; !exists {`n`t`t`twriteError(w, http.StatusBadRequest, `"invalid_payload`", `"answer does not belong to question`")`n`t`t`treturn`n`t`t}`n" `
    -NewText "" `
    -Package "./private/tests/shared" `
    -RunPattern "TestUpdateAttemptStatus/rejects_answer_from_another_question"

Invoke-Mutation -Name "07-intentional-wrong-expectation" `
    -RelativeFile "private\tests\shared\normalize_limit_test.go" `
    -OldText "`t`t{name: `"fifty is unchanged`", limit: 50, want: 50},`n" `
    -NewText "`t`t{name: `"fifty is unchanged`", limit: 50, want: 51},`n" `
    -Package "./private/tests/shared" `
    -RunPattern "TestNormalizeLimit/fifty_is_unchanged"

Invoke-GoTest -WorkingDirectory $backendRoot -LogName "08-final-pass.txt" `
    -Package "./private/tests/shared" `
    -RunPattern "^(TestDecodeJSON|TestNormalizeLimit|TestUpdateAttemptStatus)$" `
    -ShouldFail $false

Write-Output "All six implementation mutations and the separate intentionally wrong expectation were detected."
