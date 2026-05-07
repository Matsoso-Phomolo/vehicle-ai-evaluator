@echo off
echo Running tests with Python 3.11...
py -3.11 -m pytest tests -p no:cacheprovider
pause
