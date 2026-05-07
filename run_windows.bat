@echo off
echo Starting Vehicle AI Evaluator with Python 3.11...
py -3.11 -m uvicorn app.main:app --reload
pause
