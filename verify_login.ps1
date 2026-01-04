$baseUrl = "http://localhost:5000/api"

Write-Host "--- Test Case 1: Valid login for STU001 ---"
$body1 = @{ student_id = "STU001"; password = "2002-05-15" } | ConvertTo-Json
try {
    $resp1 = Invoke-RestMethod -Uri "$baseUrl/student/login" -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "Success: $($resp1.success)"
    Write-Host "Message: $($resp1.message)"
    Write-Host "Token: $($resp1.data.token.Substring(0, 10))..."
    Write-Host "Student ID: $($resp1.data.student.student_id)"
    if ($resp1.data.student.password_dob -eq $null) {
        Write-Host "✅ password_dob correctly removed from response"
    } else {
        Write-Host "❌ password_dob still present in response"
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)"
}

Write-Host "`n--- Test Case 2: Invalid password ---"
$body2 = @{ student_id = "STU001"; password = "wrong" } | ConvertTo-Json
try {
    $resp2 = Invoke-RestMethod -Uri "$baseUrl/student/login" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "❌ Failed: Should have rejected the login"
} catch {
    Write-Host "✅ Correctly rejected: $($_.Exception.Message)"
}
