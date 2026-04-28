@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Chua cai Git hoac Git chua co trong PATH.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [INFO] Chua co git repository. Dang khoi tao...
  git init -b main
  if errorlevel 1 (
    echo [ERROR] Khong the khoi tao git repository.
    pause
    exit /b 1
  )
)

set "DEFAULT_REMOTE=https://github.com/inforcard/create_your_bio.git"
set "BRANCH=main"

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo.
  echo [SETUP] Chua co remote origin.
  set /p "REMOTE_URL=Nhap URL GitHub repo [Enter de dung %DEFAULT_REMOTE%]: "
  if "%REMOTE_URL%"=="" set "REMOTE_URL=%DEFAULT_REMOTE%"

  git remote add origin "%REMOTE_URL%"
  if errorlevel 1 (
    echo [ERROR] Khong the them remote origin.
    pause
    exit /b 1
  )
) else (
  for /f "delims=" %%i in ('git remote get-url origin') do set "REMOTE_URL=%%i"
)

for /f "delims=" %%i in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%i"
if not "%CURRENT_BRANCH%"=="" set "BRANCH=%CURRENT_BRANCH%"

echo.
echo [INFO] Thu muc: %cd%
echo [INFO] Remote : %REMOTE_URL%
echo [INFO] Branch : %BRANCH%
echo.

git status --short
echo.

set "COMMIT_MSG="
set /p "COMMIT_MSG=Nhap commit message [Enter de dung auto message]: "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update site %date% %time%"

echo.
echo [INFO] Dang stage toan bo thay doi...
git add .
if errorlevel 1 (
  echo [ERROR] Git add that bai.
  pause
  exit /b 1
)

git diff --cached --quiet
if not errorlevel 1 (
  echo [INFO] Dang commit...
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 (
    echo [ERROR] Git commit that bai.
    pause
    exit /b 1
  )
) else (
  echo [INFO] Khong co thay doi moi de commit.
)

echo.
echo [INFO] Dang push len GitHub...
git push -u origin %BRANCH%
if errorlevel 1 (
  echo.
  echo [WARN] Push that bai.
  echo Neu day la lan dau va branch remote chua ton tai, thu:
  echo   git push -u origin %BRANCH%
  pause
  exit /b 1
)

echo.
echo [DONE] Da push len GitHub thanh cong.
pause
