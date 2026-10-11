# EduInsight frontend

React 19 and Vite dashboard for the Intelligent Academic Analytics and Student Performance Prediction System. It connects to the Spring Boot API in the separate backend repository.

## Live project

- **Application:** [https://ichigoo789.netlify.app](https://ichigoo789.netlify.app)
- **Spring Boot API:** [https://academic-analytics-backend.onrender.com](https://academic-analytics-backend.onrender.com)
- **Backend health check:** [https://academic-analytics-backend.onrender.com/api/test](https://academic-analytics-backend.onrender.com/api/test)

## Local development

```powershell
npm ci
$env:VITE_API_BASE_URL = "http://localhost:8081"
npm run dev
```

`VITE_API_BASE_URL` is the backend root URL and must not include `/api`. When omitted, the local default is `http://localhost:8081`.

## Production deployment

Netlify reads `netlify.toml`, which runs `npm run build` and publishes `dist`. Set `VITE_API_BASE_URL` to the Render backend root URL, such as `https://your-backend.onrender.com`. Set the backend's `FRONTEND_ORIGIN` to the exact Netlify origin. If either variable changes, redeploy the affected service.

## Workspaces

- **Overview / Students:** student profile management
- **Attendance / Marks:** faculty entry and review
- **Performance:** live averages and an explained at-risk queue
- **AI Predictions:** model status, administrator CSV training, and estimates for students with records
- **Reports:** CSV exports
- **Settings:** administrators create faculty accounts

Student sign-in displays only that student's own profile, attendance, and marks.

## Verify

```powershell
npm run lint
npm run build
```
