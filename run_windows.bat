@echo off
echo Starting Vehicle AI Evaluator with Python 3.12...
py -3.12 -m uvicorn app.main:app --reload
pause
