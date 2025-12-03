# Architecture Overview - Permit Tracker

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │ File Upload  │  │  Results UI  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  POST /jobs  │  │  GET /jobs    │  │ GET /download│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│   BDES Scraper        │   │   Firebase Firestore   │
│   (Playwright)        │   │   (Job Storage)        │
└───────────────────────┘   └───────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│              BDES Portal (External)                        │
│         https://bdes.spw.wallonie.be                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

1. **Dashboard (`app/page.tsx`)**
   - Main entry point
   - Manages job state and polling
   - Orchestrates UI components
   - Real-time progress updates

2. **FileUpload Component**
   - Drag-and-drop file upload
   - File validation
   - Visual feedback

3. **JobProgress Component**
   - Progress bar visualization
   - Status indicators
   - Download button (when complete)

4. **ResultsTable Component**
   - Tabular results display
   - Status badges with color coding
   - Link to permit pages
   - Error message display

5. **StatsCard Component**
   - Summary statistics
   - Visual metrics

### Backend Services

1. **API Routes (`app/api/jobs/`)**
   - `POST /api/jobs`: Create new job, parse file, start processing
   - `GET /api/jobs?jobId=xxx`: Get job status and results
   - `GET /api/jobs/download?jobId=xxx`: Download results Excel file

2. **BDES Scraper (`lib/scraper/bdes-scraper.ts`)**
   - Playwright-based web automation
   - Navigates BDES portal
   - Extracts permit data
   - Error handling and retry logic

3. **File Processor (`lib/utils/file-processor.ts`)**
   - Excel/CSV parsing
   - Column detection
   - Results file generation

4. **Firebase Integration**
   - Client config: `lib/firebase/config.ts`
   - Admin config: `lib/firebase/admin.ts`
   - Job storage in Firestore
   - Real-time updates

## Data Flow

### Job Processing Flow

```
1. User uploads Excel file
   ↓
2. File parsed → Extract companies list
   ↓
3. Create Firestore job document
   ↓
4. Start background processing
   ↓
5. For each company:
   a. Navigate to BDES portal
   b. Search for address
   c. Identify parcel
   d. Open parcel page
   e. Navigate to "Procédures" tab
   f. Extract permit date
   g. Update Firestore with result
   ↓
6. Generate Excel output file
   ↓
7. Mark job as completed
   ↓
8. User downloads results
```

### Real-time Updates

```
Frontend (Polling every 2s)
   ↓
GET /api/jobs?jobId=xxx
   ↓
Firebase Firestore
   ↓
Return job status + results
   ↓
Update UI (progress, table, stats)
```

## Technology Choices

### Why Next.js?
- **Server-side rendering** for better performance
- **API routes** for backend logic
- **File system routing** for clean URLs
- **Built-in optimizations** (image, font, etc.)

### Why Playwright?
- **Modern browser automation** (better than Selenium)
- **Handles dynamic content** well
- **Cross-browser support**
- **Reliable selectors** and waiting strategies

### Why Firebase?
- **Real-time database** for job updates
- **Scalable** cloud infrastructure
- **Easy authentication** integration
- **Serverless** architecture ready

### Why TypeScript?
- **Type safety** reduces bugs
- **Better IDE support**
- **Self-documenting code**
- **Refactoring confidence**

## Security Considerations

1. **Input Validation**
   - File type checking
   - File size limits
   - Column validation

2. **Firebase Security Rules**
   - Restrict job access
   - User authentication
   - Data validation

3. **Error Handling**
   - No sensitive data in errors
   - Graceful degradation
   - User-friendly messages

4. **Rate Limiting**
   - Delays between requests
   - Batch size limits
   - Timeout handling

## Performance Optimizations

1. **Background Processing**
   - Non-blocking job execution
   - Async/await patterns

2. **Efficient Scraping**
   - Reuse browser instances
   - Optimized selectors
   - Smart waiting strategies

3. **Caching**
   - Firebase caching
   - Browser caching for static assets

4. **Lazy Loading**
   - Component code splitting
   - Dynamic imports

## Scalability

### Current Limitations
- Single-threaded processing
- Sequential company processing
- In-memory job queue

### Future Enhancements
- **Queue System**: Redis/Bull for job queues
- **Parallel Processing**: Multiple workers
- **Caching**: Redis for address lookups
- **CDN**: Static asset delivery
- **Load Balancing**: Multiple server instances

## Error Handling Strategy

### Scraper Errors
- **Network errors**: Retry with exponential backoff
- **Timeout errors**: Increase timeout, retry
- **Element not found**: Try alternative selectors
- **Parse errors**: Log and continue

### API Errors
- **Validation errors**: Return 400 with message
- **Server errors**: Return 500, log details
- **Firebase errors**: Retry, fallback handling

### User-Facing Errors
- **Clear status messages**: "ADDRESS_NOT_FOUND", "ERROR", etc.
- **Error details**: In errorMessage field
- **Recovery options**: Retry button, manual entry

## Monitoring & Logging

### Recommended Monitoring
- **Job success rate**: Track completion percentages
- **Error rates**: Monitor failure types
- **Processing time**: Average time per company
- **Firebase usage**: Read/write operations

### Logging Points
- Job creation
- Company processing start/end
- Errors with stack traces
- Performance metrics

## Deployment Architecture

### Development
```
Local Machine
├── Next.js dev server (localhost:3000)
├── Playwright (local browser)
└── Firebase (cloud)
```

### Production (Recommended: Vercel)
```
Vercel Platform
├── Next.js (serverless functions)
├── Playwright (serverless browser)
└── Firebase (cloud)
```

### Alternative: Self-hosted
```
VPS/Cloud Server
├── Next.js (PM2/Systemd)
├── Playwright (installed browsers)
└── Firebase (cloud)
```

## Database Schema

### Firestore Collection: `jobs`

```typescript
{
  jobId: string (document ID)
  status: "processing" | "completed" | "error"
  total: number
  processed: number
  currentCompany: string
  results: Array<{
    company: string
    address: string
    latestPermitDate: string | null
    permitPageLink: string | null
    status: string
    errorMessage?: string
  }>
  outputFile: string (base64 encoded Excel)
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  error?: string
}
```

## API Contracts

### POST /api/jobs
**Request:**
- FormData with `file` field (Excel/CSV)

**Response:**
```json
{
  "jobId": "abc123"
}
```

### GET /api/jobs?jobId=xxx
**Response:**
```json
{
  "jobId": "abc123",
  "status": "processing",
  "total": 10,
  "processed": 5,
  "currentCompany": "Company Name",
  "results": [...],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### GET /api/jobs/download?jobId=xxx
**Response:**
- Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- Filename: `permit-results-{jobId}.xlsx`

## Testing Strategy

### Unit Tests
- File processor functions
- Date parsing logic
- Status determination

### Integration Tests
- API route handlers
- Firebase operations
- File upload/download

### E2E Tests
- Full job processing flow
- UI interactions
- Error scenarios

## Future Enhancements

1. **Authentication**: User accounts, job history
2. **Scheduling**: Automatic periodic processing
3. **Notifications**: Email/SMS on completion
4. **Analytics**: Dashboard with charts
5. **Multi-language**: French/English support
6. **Export formats**: CSV, JSON, PDF
7. **API access**: REST API for integrations
8. **Webhooks**: Notify external systems

---

**Last Updated**: 2024
**Version**: 1.0.0

