$ErrorActionPreference = "SilentlyContinue"
$ServerUrl = "http://localhost:3000/api/ingest"

Write-Host "Started Windows Event Log Forwarder..." -ForegroundColor Cyan
Write-Host "Monitoring Security Log for Event ID 4624 (Logon) and 4625 (Failed Logon)..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop."

# Infinite loop to monitor new events
# In a real scenario, use subscription or last read timestamp.
# For simplicity, we just tail the log.

$lastTime = (Get-Date).AddSeconds(-1)

while ($true) {
    $events = Get-WinEvent -LogName Security -FilterXPath "*[System[(EventID=4624 or EventID=4625) and TimeCreated[timediff(@SystemTime) <= 5000]]]" -ErrorAction SilentlyContinue | Where-Object { $_.TimeCreated -gt $lastTime }
    
    if ($events) {
        foreach ($evt in $events) {
            $lastTime = $evt.TimeCreated
            
            # Map Windows Event to our JSON schema
            $action = if ($evt.Id -eq 4624) { "login_success" } else { "login_failed" }
            $user = $evt.Properties[5].Value # TargetUserName usually at index 5
            $ip = $evt.Properties[18].Value # IpAddress usually at index 18
            
            $payload = @{
                "@timestamp" = $evt.TimeCreated.ToString("yyyy-MM-ddTHH:mm:ssZ")
                "event" = @{
                    "dataset" = "windows_security"
                    "action" = $action
                    "kind" = "event"
                    "category" = @("authentication")
                    "original" = $evt.Message.Split("`n")[0]
                }
                "host" = @{
                    "name" = $env:COMPUTERNAME
                }
                "user" = @{
                    "name" = "$user"
                }
                "source" = @{
                    "ip" = "$ip"
                }
            }

            $json = $payload | ConvertTo-Json -Depth 5 -Compress
            
            try {
                Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $json -ContentType "application/json"
                Write-Host "Forwarded Event $($evt.Id) - $user" -ForegroundColor Yellow
            } catch {
                Write-Host "Failed to send event: $_" -ForegroundColor Red
            }
        }
    }
    
    Start-Sleep -Seconds 2
}
