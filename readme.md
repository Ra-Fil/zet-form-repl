### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom brand colors (header-black, brand-red, brand-gray)
- **Build Tool**: Vite with React plugin
- **Routing**: Custom client-side routing using `window.location.pathname` and browser history API (no external router library)
- **State Management**: React useState/useEffect hooks (no external state library)

### Page Structure
- **CustomerFormPage** (`/`): Multi-section form for customer submissions with file uploads
- **AdminPage** (`/admin`): Protected dashboard with session-based authentication for managing submissions
- **PriceListPage** (`/cenik`): Static pricing information display

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL using the `pg` library directly (no ORM)
- **File Handling**: Base64 encoding for file transfers between client and server
- **Authentication**: Simple username/password login with session storage on the client side

### Data Flow
1. Customer form collects contact info, billing details, tractor owner info, and multiple file uploads
2. Files are converted to base64 on the client before submission
3. Server stores submission data in PostgreSQL with file data
4. Admin dashboard retrieves and displays submissions with status workflow management

### Submission Status Workflow
Submissions progress through defined statuses:
- PENDING (Nový požadavek)
- PROCESSING (Vygenerováno prohlášení)
- INVOICED (Faktura odeslána)
- COMPLETED (Faktura zaplacena)
- REGISTERED (Prohlášení zapsáno do IZTP)

## External Dependencies

### Database
- **PostgreSQL**: Connected via `DATABASE_URL` environment variable with SSL support for production

### NPM Packages (Runtime)
- `express`: Web server framework
- `pg`: PostgreSQL client
- `dotenv`: Environment variable management
- `cors`: Cross-origin resource sharing
- `jszip`: ZIP file generation for bulk document downloads in admin

### NPM Packages (Development)
- `vite`: Build tool and dev server
- `typescript`: Type checking
- `tailwindcss` + `autoprefixer` + `postcss`: CSS processing
- `concurrently`: Running multiple processes (server + vite) simultaneously

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (defaults to 8080)
- `NODE_ENV`: Environment indicator for SSL configuration