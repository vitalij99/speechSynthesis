@echo off
echo Running git pull...
git pull
if %ERRORLEVEL% neq 0 (
    echo git pull failed!
    pause
    exit /b %ERRORLEVEL%
)
 
echo Running npm run build...
npm run build
if %ERRORLEVEL% neq 0 (
    echo npm run build failed!
    pause
    exit /b %ERRORLEVEL%
)
 
echo Done!
pause
 