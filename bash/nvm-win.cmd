@echo off
if exist "%~dp0\node_modules\nvm-win\nodeTmp.exe" (
      "%~dp0\node_modules\nvm-win\nodeTmp.exe"  "%~dp0\node_modules\nvm-win\cli.js" %*
) else (
      @SETLOCAL
      @SET PATHEXT=%PATHEXT:;.JS;=;%
      node "%~dp0\node_modules\nvm-win\cli.js" %*
)
