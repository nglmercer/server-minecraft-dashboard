@echo off
cd /d "%~dp0"
"C:\Users\Admin\Documents\projects\kubek-minecraft-dashboard\binaries\java\21\jdk-21.0.6+7\bin\java.exe" -Xmx16384M -XX:+UseG1GC  ^
-XX:MaxGCPauseMillis=200  ^
-XX:G1HeapRegionSize=4M  ^
-XX:InitiatingHeapOccupancyPercent=35  ^
-XX:+ParallelRefProcEnabled  ^
-XX:+PerfDisableSharedMem  ^
-XX:+UseStringDeduplication -jar "paper-1.21.4.jar" nogui
pause