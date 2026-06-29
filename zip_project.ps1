# PowerShell Script to bundle the MERN application
$zipPath = "C:\Users\i tech\Desktop\Energy_Analyzer_Fullstack.zip"
$stagePath = "c:\Users\i tech\Desktop\Energy Analyzer\staging"

Write-Host "Bundling MERN application source code..."

# Create a staging folder in workspace
if (Test-Path $stagePath) {
    Remove-Item -Recurse -Force $stagePath -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $stagePath | Out-Null

# Copy folders and files
Copy-Item -Path "client" -Destination $stagePath -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "server" -Destination $stagePath -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "package.json" -Destination $stagePath -Force
Copy-Item -Path "README.md" -Destination $stagePath -Force
Copy-Item -Path "vercel.json" -Destination $stagePath -Force
Copy-Item -Path "Zebra" -Destination $stagePath -Recurse -Force -ErrorAction SilentlyContinue

# Clean staging directory by deleting node_modules and builds
Remove-Item -Path "$stagePath\client\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$stagePath\server\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$stagePath\client\dist" -Recurse -Force -ErrorAction SilentlyContinue

# Remove staging lock files
Remove-Item -Path "$stagePath\package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$stagePath\client\package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$stagePath\server\package-lock.json" -Force -ErrorAction SilentlyContinue

# Compress staging directory
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Run compression
Compress-Archive -Path "$stagePath\*" -DestinationPath $zipPath -Force

# Clean up staging directory
Remove-Item -Recurse -Force $stagePath -ErrorAction SilentlyContinue

Write-Host "ZIP file successfully created at: $zipPath"
