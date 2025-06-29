# ChemCraft Deployment Guide

## Local Development
```bash
pip install -r requirements.txt
python app.py
```
Visit: http://localhost:5000

## Heroku Deployment
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

## Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

## Railway Deployment
1. Connect GitHub repo to Railway
2. Deploy automatically

## Environment Variables
- `PORT`: Server port (default: 5000)
- `FLASK_ENV`: Set to 'development' for debug mode

## Health Check
Visit `/health` endpoint to verify deployment:
```json
{
  "status": "healthy",
  "elements_loaded": 118,
  "compounds_loaded": 15,
  "version": "1.0.0"
}
```

## Troubleshooting
- Check `/health` endpoint first
- Verify all files are uploaded
- Check server logs for errors
- Ensure Python 3.11+ is used
