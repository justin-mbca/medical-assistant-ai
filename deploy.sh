#!/bin/bash
# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Render (manual step)
echo "To deploy backend, push to GitHub and create a new Web Service on Render.com using pdf-backend.js as the entry point."
echo "Set environment variable PORT in Render settings."

echo "Frontend deployed to Vercel. Backend instructions provided for Render."
