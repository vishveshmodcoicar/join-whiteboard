# Render Deployment Guide

This guide will help you deploy the Join Whiteboard application on Render.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render account (sign up at https://render.com)

## Deployment Steps

### Step 1: Deploy the Backend

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the repository: `join-whiteboard` (or your repo name)
5. Configure the service:
   - **Name**: `join-whiteboard-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
6. Click **"Create Web Service"**
7. Wait for the build to complete
8. **Copy the service URL** (e.g., `https://join-whiteboard-backend.onrender.com`)

### Step 2: Deploy the Frontend

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select the same repository
3. Configure the service:
   - **Name**: `join-whiteboard-frontend`
   - **Environment**: `Static`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. **Add Environment Variable**:
   - **Key**: `REACT_APP_SOCKET_URL`
   - **Value**: Your backend URL from Step 1 (e.g., `https://join-whiteboard-backend.onrender.com`)
   - **Important**: Use `https://` not `http://`
5. Click **"Create Static Site"**
6. Wait for the build to complete
7. Your frontend will be available at a URL like `https://join-whiteboard-frontend.onrender.com`

### Step 3: Update Backend CORS Settings (if needed)

If you encounter CORS errors, you may need to update the backend CORS settings. The current configuration allows all origins (`cors_allowed_origins='*'`), which should work, but you can also specify your frontend URL explicitly.

### Step 4: Test Your Deployment

1. Open your frontend URL in a browser
2. Enter a username and room name
3. Open another browser tab/window with the same frontend URL
4. Join the same room with a different username
5. Test drawing - changes should appear in real-time across both windows

## Important Notes

- **Free Tier Limitations**: 
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down may take 30-60 seconds
  - Consider upgrading to a paid plan for always-on service

- **WebSocket Support**: 
  - Render supports WebSockets on the free tier
  - Socket.IO will automatically use WebSocket transport

- **Environment Variables**:
  - Backend automatically uses the PORT environment variable provided by Render
  - Frontend needs REACT_APP_SOCKET_URL to connect to the backend

## Troubleshooting

### Backend won't start
- Check build logs for Python dependency issues
- Ensure `requirements.txt` has all dependencies
- Verify Python version is 3.10+

### Frontend can't connect to backend
- Verify REACT_APP_SOCKET_URL is set correctly
- Ensure backend URL uses `https://` not `http://`
- Check browser console for CORS errors
- Verify backend service is running (not spun down)

### Socket.IO connection fails
- Check that both services are deployed
- Verify CORS settings allow your frontend domain
- Check Render logs for backend errors

## Updating Your Deployment

After pushing changes to GitHub:
- Backend: Render will automatically redeploy
- Frontend: Render will automatically rebuild and redeploy

You can also manually trigger deployments from the Render dashboard.
