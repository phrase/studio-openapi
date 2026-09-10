# Phrase Studio OpenAPI Documentation

This directory contains the OpenAPI 3.0 specification for the Phrase Studio API, which provides external access to transcription, translation, and dubbing services.

## Overview

The Phrase Studio API allows you to:
- Create transcription, translation, and dubbing projects
- Upload files for processing
- Retrieve subtitle files (SRT format) for transcriptions and translations
- Download dubbed audio files
- Monitor project and recording status
- Get completion status for different processing steps

## API Endpoints

### Projects
- `GET /v1/projects` - List all projects
- `GET /v1/projects/{id}` - Get project details
- `GET /v1/projects/{id}/status` - Get project status and progress
- `POST /v1/projects` - Create project with file URLs or uploads
- `POST /v1/projects/upload` - Create project for file uploads (returns signed URLs)
- `POST /v1/projects/{id}/start` - Start processing with uploaded files

### Recordings
- `POST /v1/projects/{projectId}/recordings/{recordingId}/translate` - Add a translation language to an existing recording
- `POST /v1/projects/{projectId}/recordings/{recordingId}/dubbing` - Add a dubbing language to an existing recording
- `GET /v1/projects/{projectId}/recordings/{recordingId}/transcription-srt` - Get transcription SRT
- `GET /v1/projects/{projectId}/recordings/{recordingId}/translations-srt` - Get all translation SRTs
- `GET /v1/projects/{projectId}/recordings/{recordingId}/translations-srt/{languageCode}` - Get specific translation SRT
- `GET /v1/projects/{projectId}/recordings/{recordingId}/dubbings-srt` - Get all dubbing SRTs
- `GET /v1/projects/{projectId}/recordings/{recordingId}/dubbings-srt/{languageCode}` - Get specific dubbing SRT
- `GET /v1/projects/{projectId}/recordings/{recordingId}/dubbings-audio` - Get all dubbing audio URLs
- `GET /v1/projects/{projectId}/recordings/{recordingId}/dubbings-audio/{languageCode}` - Get specific dubbing audio URL
- `GET /v1/projects/{projectId}/recordings/{recordingId}/status` - Get recording status
- `GET /v1/projects/{projectId}/recordings/{recordingId}/completed-steps` - Get completion status for all languages
- `GET /v1/projects/{projectId}/recordings/{recordingId}/completed-steps/{languageCode}` - Get completion status for specific language

### Subtitle Profiles
- `GET /v1/subtitle-profiles` - Get available subtitle profiles

## Authentication

All API endpoints require authentication using an API key in the `X-API-Key` header:

```
X-API-Key: your-api-key-here
```

## File Structure

```
schemas/
├── projects.json          # Main OpenAPI specification file
└── projects.json.bak      # Backup of the specification
```

## Local Development Setup

To run and view the OpenAPI documentation locally, you have several options:

### Option 1: Using Swagger UI (Recommended)

1. **Install a local OpenAPI viewer:**
   ```bash
   npm install -g swagger-ui-watcher
   ```

2. **Serve the documentation:**
   ```bash
   swagger-ui-watcher schemas/projects.json
   ```

3. **View in browser:**
   Open http://localhost:8080 to view the interactive API documentation.

### Option 2: Using Docker

1. **Run Swagger UI with Docker:**
   ```bash
   docker run -p 8080:8080 -e SWAGGER_JSON=/spec/projects.json -v $(pwd)/schemas:/spec swaggerapi/swagger-ui
   ```

2. **View in browser:**
   Open http://localhost:8080 to view the documentation.

### Option 3: Using Node.js

1. **Install dependencies:**
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   ```

2. **Create a simple server** (create `server.js`):
   ```javascript
   const express = require('express');
   const swaggerUi = require('swagger-ui-express');
   const fs = require('fs');

   const app = express();
   const port = 3000;

   const swaggerDocument = JSON.parse(fs.readFileSync('./schemas/projects.json', 'utf8'));

   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

   app.listen(port, () => {
     console.log(`API Documentation available at http://localhost:${port}/api-docs`);
   });
   ```

3. **Run the server:**
   ```bash
   node server.js
   ```

4. **View in browser:**
   Open http://localhost:3000/api-docs

### Option 4: Using Python

1. **Install FastAPI and dependencies:**
   ```bash
   pip install fastapi uvicorn
   ```

2. **Create a simple server** (create `main.py`):
   ```python
   from fastapi import FastAPI
   from fastapi.responses import FileResponse
   import json

   app = FastAPI()

   @app.get("/openapi.json")
   async def get_openapi():
       with open("schemas/projects.json", "r") as f:
           return json.load(f)

   @app.get("/")
   async def root():
       return {"message": "OpenAPI spec available at /openapi.json"}
   ```

3. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

4. **View the raw spec:**
   Open http://localhost:8000/openapi.json

5. **Use a separate OpenAPI viewer** like https://editor.swagger.io/ and paste the JSON content.

## Supported File Formats

- **Audio**: MP3, WAV, M4A
- **Video**: MP4, MOV
- **Maximum file size**: 5GB per file
- **Maximum files per project**: 5 files
- **Maximum duration**: 180 minutes per file

## Language Support

### Source Languages (Auto-detection + Manual)
All subtitle languages plus "auto" for automatic detection

### Translation Languages
en, es, fr, de, it, pt, ru, ja, ko, zh-cn, tr, pl, nl, ar, sv, fi, da, no, cs, el, hu, ro, bg, hr, sk, sl, et, lv, lt, mt, ga, cy, eu, ca, gl, oc, br, co, fy, gd, gv, kw, lb, li, nds, pap, pms, rm, sc, scn, sco, szl, vec, vls, wa, wo, zea

### Dubbing Languages
en, en-US, en-GB, ja, zh-cn, de, hi, fr, fr-CA, ko, pt-BR, pt, it, es, es-MX, id, nl, tr, fil, pl, sv, bg, ro, ar-SA, ar, cs, el, fi, hr, ms, sk, da, ta, uk, ru, es-MX, es-AR

## Response Examples

### Create Project Response
```json
{
  "id": "01jzmvc20cjq5hj5saa96ttp2x"
}
```

### Project Status Response
```json
{
  "id": "01jzmvc20cjq5hj5saa96ttp2x",
  "name": "Meeting Recording",
  "status": "processing",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z",
  "progress": 45.5,
  "recordings": [...]
}
```

### SRT Response
```json
{
  "srt": "1\n00:00:01,000 --> 00:00:04,000\nHello, welcome to our meeting.\n\n2\n00:00:05,000 --> 00:00:08,000\nToday we will discuss the project."
}
```

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include detailed messages explaining what went wrong.

## Rate Limiting

API calls are rate limited to ensure fair usage. Contact support for rate limit increases if needed.

## Support

For API support or questions, please contact the development team or refer to the internal documentation.
