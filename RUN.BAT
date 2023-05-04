@Echo off

:Start
set ERRORLEVEL= 0

npm run preview -- --host --open

if ERRORLEVEL 5 goto :Start