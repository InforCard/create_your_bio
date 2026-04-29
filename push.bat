@echo off
setlocal

echo ============================
echo GIT AUTO UPDATE
echo ============================

git add .

git commit -m "update"

git push

echo ============================
echo DONE!
echo ============================

pause