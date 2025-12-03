# Permit Tracker - BDES Automation System

A production-ready web application for automated extraction of environmental permit dates from the Walloon Region BDES (Bureau de Développement Économique et Social) portal.

## 🚀 Features

- **Automated Web Scraping**: Uses Playwright to navigate and extract data from the BDES portal
- **Batch Processing**: Process hundreds of companies in a single job
- **Real-time Progress Tracking**: Live updates on processing status
- **Professional UI/UX**: Modern, responsive interface with dark mode support
- **Firebase Integration**: Secure authentication and cloud database
- **Excel File Support**: Upload Excel/CSV files with company data
- **Error Handling**: Comprehensive error detection and reporting
- **Results Export**: Download processed results as Excel files

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Web Scraping**: Playwright
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **File Processing**: ExcelJS, XLSX
- **UI Components**: Custom components with Radix UI primitives

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore enabled
- Playwright browsers installed (`npx playwright install`)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PermitTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

4. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication (optional, for user management)
   - Create a service account and download the credentials
   - Copy `.env.example` to `.env.local` and fill in your Firebase credentials

5. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Firebase configuration.

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
PermitTracker/
├── app/
│   ├── api/
│   │   └── jobs/
│   │       ├── route.ts          # Job creation and status API
│   │       └── download/
│   │           └── route.ts      # Results download API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main dashboard page
├── components/
│   ├── FileUpload.tsx            # File upload component
│   ├── JobProgress.tsx           # Progress tracking component
│   ├── ResultsTable.tsx          # Results display table
│   └── StatsCard.tsx             # Statistics card component
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Client-side Firebase config
│   │   └── admin.ts              # Server-side Firebase admin
│   ├── scraper/
│   │   └── bdes-scraper.ts       # BDES portal scraper
│   └── utils/
│       ├── file-processor.ts     # Excel file processing
│       └── cn.ts                 # Utility functions
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 Input File Format

The system accepts Excel (.xlsx, .xls) or CSV files with the following structure:

| Company | Address (or Ville) |
|---------|-------------------|
| Company Name 1 | City or Address 1 |
| Company Name 2 | City or Address 2 |

**Example:**
```
Entreprise,Ville
Nucléaire de Tihange — S.A. ELECTRABEL,Tihange
LANOLINES STELLA SA,Mouscron
```

## 📊 Output Format

The system generates an Excel file with the following columns:

| Company | Address | Latest Delivered Permit Date | Permit Page Link | Status | Error Message |
|---------|---------|------------------------------|------------------|--------|---------------|
| ... | ... | DD/MM/YYYY | URL | SUCCESS/ERROR/... | ... |

**Status Values:**
- `SUCCESS`: Permit date found and extracted
- `ADDRESS_NOT_FOUND`: Address could not be located on the map
- `MULTIPLE_PARCELS`: Multiple parcels found for the address
- `NO_PERMIT_DATA`: No "Permis délivré" entries found
- `ERROR`: Technical error occurred

## 🔄 How It Works

1. **Upload**: User uploads an Excel file with company data
2. **Job Creation**: System creates a background job and starts processing
3. **Scraping**: For each company:
   - Navigates to BDES portal
   - Searches for the company address
   - Identifies the parcel using the stethoscope tool
   - Opens the parcel information page
   - Navigates to "Procédures" tab
   - Extracts the latest "Permis délivré" date
   - Records the permit page URL
4. **Progress Tracking**: Real-time updates via Firebase
5. **Results**: Downloadable Excel file with all results

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Dark Mode**: Full dark mode support
- **Responsive**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live progress tracking and status updates
- **Visual Feedback**: Color-coded status indicators and progress bars
- **Error Handling**: Clear error messages and recovery options

## ⚙️ Configuration

### Scraper Settings

Edit `lib/scraper/bdes-scraper.ts` to adjust:
- `TIMEOUT`: Request timeout (default: 30000ms)
- `BASE_URL`: BDES portal URL
- Delay between requests (default: 2000ms)

### Firebase Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚨 Error Handling

The system handles various error scenarios:

- **Network Timeouts**: Automatic retry with exponential backoff
- **Missing Elements**: Graceful degradation with error reporting
- **Invalid Addresses**: Clear status messages
- **Website Changes**: Robust selectors with fallbacks

## 🔒 Security Considerations

- Firebase authentication for user management
- Secure API routes with server-side validation
- Input sanitization for file uploads
- Rate limiting to prevent abuse
- Error messages don't expose sensitive information

## 📈 Performance

- **Batch Processing**: Processes multiple companies in sequence
- **Efficient Scraping**: Optimized selectors and wait strategies
- **Background Jobs**: Non-blocking job processing
- **Caching**: Firebase caching for improved performance

## 🐛 Troubleshooting

### Playwright Installation Issues
```bash
npx playwright install --with-deps chromium
```

### Firebase Connection Errors
- Verify environment variables are set correctly
- Check Firebase project permissions
- Ensure Firestore is enabled

### Scraping Failures
- Check BDES portal accessibility
- Verify selectors haven't changed
- Review error messages in job status

## 📚 Documentation

For detailed API documentation and component usage, see:
- API Routes: `app/api/jobs/`
- Components: `components/`
- Scraper: `lib/scraper/bdes-scraper.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review error logs in Firebase Console
- Contact the development team

## 🎯 Future Enhancements

- [ ] User authentication and job history
- [ ] Scheduled automatic processing
- [ ] Email notifications on job completion
- [ ] Advanced filtering and search
- [ ] Export to multiple formats (CSV, JSON)
- [ ] Dashboard analytics and charts
- [ ] Multi-language support

---

**Built with ❤️ for automated permit tracking**

