@echo off
echo Committing changes to git...
git add .
git commit -m "Implement modular architecture with create/join rooms and chat functionality"
git push
echo Done!
pause