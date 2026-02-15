@echo off
echo Committing changes to git...
git add .
git commit -m "Add BALL and FOLLOWER buttons with draggable circles and follower functionality"
git push
echo Done!
pause