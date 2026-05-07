@echo off
echo Running tests with Python 3.12...
py -3.12 -m pytest tests -p no:cacheprovider
pause
