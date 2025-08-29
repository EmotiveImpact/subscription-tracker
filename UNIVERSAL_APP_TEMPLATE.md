# Universal Application Development Prompt Template

## 🎯 When to Use This Template

Use this template for any application that needs:
- Database integration
- Type safety
- User authentication
- Complex state management
- Third-party integrations
- Production deployment
- CRUD operations
- Real-time features
- API development
- Frontend applications

---

## 🏗️ ARCHITECTURE FIRST APPROACH

**Before writing any code, define these core elements:**

### 1. Data Models & Types (Define FIRST - this is critical)
- Create complete TypeScript interfaces for all entities
- Include optional vs required fields explicitly
- Consider nullable database fields (use `?` for optional)
- Define exact enum values and string literals
- Plan for future extensibility

### 2. Database Schema (Design before implementation)
- Choose database technology upfront (Vercel Postgres, Neon, etc.)
- Write complete SQL schema with proper types
- Include indexes, constraints, and relationships
- Ensure TypeScript interfaces match database schema exactly
- Plan for migrations and versioning

### 3. Storage Strategy (Plan for development vs production)
- Primary storage: Database (specify which one)
- Fallback storage: In-memory/local storage for development
- Hybrid system that switches automatically
- Error handling when database isn't configured
- Caching strategy (Redis, in-memory, etc.)

---

## 🔧 TECHNICAL REQUIREMENTS

### Core Framework
- [FRAMEWORK] with [ROUTER_TYPE]
- TypeScript with strict mode enabled
- [STYLING_SOLUTION]
- [UI_COMPONENT_LIBRARY]

### Database & Storage
- [DATABASE_CHOICE] (avoid slow-to-setup options)
- Connection pooling and proper error handling
- Migration system for schema changes
- Row-level security if needed
- Backup and recovery strategy

### Authentication & Security
- [AUTH_PROVIDER] integration
- Protected routes and middleware
- Rate limiting and security headers
- Environment variable validation
- CORS configuration
- CSRF protection

### Performance & Monitoring
- Bundle optimization
- Code splitting strategy
- Performance monitoring
- Error tracking (Sentry, etc.)
- Analytics integration
- Health checks

---

## 📱 FEATURE IMPLEMENTATION ORDER

### Phase 1: Foundation (Do this FIRST)
1. Set up project structure and dependencies
2. Create database schema and migrations
3. Implement data models and storage layer
4. Set up authentication system
5. Create basic CRUD operations
6. Set up testing framework

### Phase 2: Core Features
1. Main application logic
2. User interface components
3. State management and context
4. API routes and endpoints
5. Form validation and handling
6. Error boundaries and fallbacks

### Phase 3: Advanced Features
1. Integrations and third-party services
2. Real-time features (WebSockets, Server-Sent Events)
3. Advanced UI components
4. Testing and optimization
5. Performance improvements
6. Advanced caching strategies

---

## 🗄️ COMPREHENSIVE CRUD IMPLEMENTATION

### Storage Layer CRUD Operations

```typescript
interface StorageInterface<T> {
  // Create
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  
  // Read
  getById(id: string): Promise<T | null>
  getAll(filters?: Partial<T>): Promise<T[]>
  getPaginated(page: number, limit: number, filters?: Partial<T>): Promise<{
    data: T[]
    total: number
    page: number
    totalPages: number
  }>
  
  // Update
  update(id: string, updates: Partial<T>): Promise<T | null>
  updateMany(filters: Partial<T>, updates: Partial<T>): Promise<number>
  
  // Delete
  delete(id: string): Promise<boolean>
  deleteMany(filters: Partial<T>): Promise<number>
  
  // Utility
  exists(id: string): Promise<boolean>
  count(filters?: Partial<T>): Promise<number>
  search(query: string, fields: (keyof T)[]): Promise<T[]>
}
```

### Database CRUD Implementation

```typescript
class DatabaseStorage<T> implements StorageInterface<T> {
  constructor(
    private tableName: string,
    private mapRowToEntity: (row: any) => T,
    private mapEntityToRow: (entity: Partial<T>) => any
  ) {}

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const row = this.mapEntityToRow(data)
    const fields = Object.keys(row).join(', ')
    const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ')
    
    const query = `
      INSERT INTO ${this.tableName} (${fields}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())
      RETURNING *
    `
    
    const result = await sql.query(query, Object.values(row))
    return this.mapRowToEntity(result.rows[0])
  }

  async getById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`
    const result = await sql.query(query, [id])
    
    if (result.rows.length === 0) return null
    return this.mapRowToEntity(result.rows[0])
  }

  async getAll(filters?: Partial<T>): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`
    const values: any[] = []
    
    if (filters && Object.keys(filters).length > 0) {
      const whereClauses = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value], index) => {
          values.push(value)
          return `${this.camelToSnake(key)} = $${index + 1}`
        })
      
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`
      }
    }
    
    query += ` ORDER BY created_at DESC`
    
    const result = await sql.query(query, values)
    return result.rows.map(row => this.mapRowToEntity(row))
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const validUpdates = Object.entries(updates)
      .filter(([_, value]) => value !== undefined)
    
    if (validUpdates.length === 0) return this.getById(id)
    
    const setClauses = validUpdates
      .map(([key], index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(', ')
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    
    const values = [id, ...validUpdates.map(([_, value]) => value)]
    const result = await sql.query(query, values)
    
    if (result.rows.length === 0) return null
    return this.mapRowToEntity(result.rows[0])
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`
    const result = await sql.query(query, [id])
    return result.rowCount > 0
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}
```

### API Route CRUD Implementation

```typescript
// GET /api/[resource]
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filters = Object.fromEntries(searchParams.entries())
    
    // Remove pagination params from filters
    delete filters.page
    delete filters.limit
    
    const result = await storage.getPaginated(page, limit, filters)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// POST /api/[resource]
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await storage.create(body)
    
    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}

// PUT /api/[resource]/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = await storage.update(id, body)
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}

// DELETE /api/[resource]/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await storage.delete(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
```

### Frontend CRUD Hooks

```typescript
export function useResource<T>() {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (newData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      
      if (!response.ok) throw new Error('Failed to create')
      
      const result = await response.json()
      setData(prev => [result.data, ...prev])
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, updates: Partial<T>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/resource/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update')
      
      const result = await response.json()
      setData(prev => prev.map(item => 
        (item as any).id === id ? result.data : item
      ))
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/resource/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      setData(prev => prev.filter(item => (item as any).id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async (filters?: Partial<T>) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value))
        })
      }
      
      const response = await fetch(`/api/resource?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const result = await response.json()
      setData(result.data)
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    fetchAll
  }
}
```

---

## 🎯 CRUD IMPLEMENTATION CHECKLIST

### Storage Layer
- [ ] Interface defined with all CRUD methods
- [ ] Database implementation with proper SQL
- [ ] In-memory fallback for development
- [ ] Error handling and validation
- [ ] Type safety throughout
- [ ] Connection pooling and optimization

### API Routes
- [ ] GET (list with pagination and filters)
- [ ] POST (create with validation)
- [ ] PUT (update with partial updates)
- [ ] DELETE (soft or hard delete)
- [ ] Proper HTTP status codes
- [ ] Error handling and logging
- [ ] Rate limiting implementation
- [ ] Input validation and sanitization

### Frontend Integration
- [ ] Custom hooks for CRUD operations
- [ ] Loading and error states
- [ ] Optimistic updates
- [ ] Form validation
- [ ] User feedback and notifications
- [ ] Error boundaries
- [ ] Retry mechanisms

### Advanced Features
- [ ] Bulk operations
- [ ] Search and filtering
- [ ] Sorting and pagination
- [ ] Real-time updates
- [ ] Offline support
- [ ] Caching strategies
- [ ] Background sync

---

## 🚀 CRUD Best Practices

1. **Always validate input** before processing
2. **Use transactions** for multi-step operations
3. **Implement proper error handling** with user-friendly messages
4. **Add logging** for debugging and monitoring
5. **Use optimistic updates** for better UX
6. **Implement proper loading states** and skeleton screens
7. **Add confirmation dialogs** for destructive operations
8. **Use proper HTTP status codes** and response formats
9. **Implement rate limiting** to prevent abuse
10. **Add audit trails** for important operations
11. **Use proper indexing** for database performance
12. **Implement soft deletes** when appropriate
13. **Add data validation** at multiple layers
14. **Use connection pooling** for database efficiency
15. **Implement proper caching** strategies

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Authentication Setup
```typescript
// Middleware for protected routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/api/auth']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check authentication
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verify token and add user info to headers
  try {
    const user = verifyToken(token)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Role-Based Access Control
```typescript
interface User {
  id: string
  email: string
  role: 'user' | 'admin' | 'moderator'
  permissions: string[]
}

function checkPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission) || user.role === 'admin'
}

function requirePermission(permission: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args: any[]) {
      const user = getCurrentUser() // Get from context/headers
      if (!checkPermission(user, permission)) {
        throw new Error('Insufficient permissions')
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}
```

---

## 🧪 TESTING STRATEGY

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Few, Critical Paths)
  /____\    
 /      \   Integration Tests (API, Database)
/________\  Unit Tests (Functions, Components)
```

### Unit Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { useResource } from './useResource'

// Mock the fetch function
global.fetch = jest.fn()

describe('useResource Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a resource successfully', async () => {
    const mockData = { id: '1', name: 'Test Resource' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    })

    const { result } = renderHook(() => useResource())
    
    await act(async () => {
      await result.current.create({ name: 'Test Resource' })
    })

    expect(result.current.data).toContain(mockData)
    expect(result.current.error).toBeNull()
  })
})
```

### Integration Testing
```typescript
describe('Resource API', () => {
  it('should create and retrieve a resource', async () => {
    // Create resource
    const createResponse = await request(app)
      .post('/api/resource')
      .send({ name: 'Test Resource' })
      .expect(201)

    const resourceId = createResponse.body.data.id

    // Retrieve resource
    const getResponse = await request(app)
      .get(`/api/resource/${resourceId}`)
      .expect(200)

    expect(getResponse.body.data.name).toBe('Test Resource')
  })
})
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Optimization
```sql
-- Add proper indexes
CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_created_at ON resources(created_at);
CREATE INDEX idx_resources_status ON resources(status);

-- Use composite indexes for common queries
CREATE INDEX idx_resources_user_status ON resources(user_id, status);

-- Optimize queries with EXPLAIN
EXPLAIN SELECT * FROM resources WHERE user_id = ? AND status = 'active';
```

### Frontend Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Component logic
})

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const VirtualizedList = ({ items }: { items: any[] }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
)

// Use React.lazy for code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

---

## 🚀 DEPLOYMENT & CI/CD

### Environment Configuration
```bash
# .env.local (development)
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NEXTAUTH_SECRET="your-secret-here"
STRIPE_SECRET_KEY="sk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# .env.production (production)
DATABASE_URL="postgresql://user:pass@prod-host:5432/db"
NEXTAUTH_SECRET="your-production-secret"
STRIPE_SECRET_KEY="sk_live_..."
CLERK_SECRET_KEY="sk_live_..."
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### GitHub Actions CI/CD
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 🔍 MONITORING & OBSERVABILITY

### Error Tracking
```typescript
// Sentry integration
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}
```

### Performance Monitoring
```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Data models defined and validated
- [ ] Database schema designed and tested
- [ ] Dependencies installed and verified
- [ ] Project structure planned
- [ ] Authentication strategy chosen
- [ ] Testing framework configured
- [ ] CI/CD pipeline planned

### During Development
- [ ] TypeScript compilation successful
- [ ] No critical linting errors
- [ ] Components render properly
- [ ] API endpoints respond correctly
- [ ] Error handling implemented
- [ ] Tests passing
- [ ] Performance acceptable

### Before Completion
- [ ] Build process successful
- [ ] Development server runs without errors
- [ ] Core functionality tested
- [ ] Error states handled gracefully
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Deployment tested

---

## 🎯 SUCCESS CRITERIA

The application is complete when:
1. **Builds successfully** without TypeScript errors
2. **Runs in development** without runtime crashes
3. **Core features work** even without external services
4. **User experience is smooth** with proper loading/error states
5. **Code is maintainable** with clear structure and types
6. **Tests pass** with good coverage
7. **Performance meets** requirements
8. **Security best practices** are implemented
9. **Documentation is complete** and up-to-date
10. **Deployment process** is automated and reliable

---

## 🚀 DEVELOPMENT PHILOSOPHY

### "Build the foundation first, then the house"
- Start with data and storage
- Build core functionality
- Add advanced features last
- Test continuously
- Fix issues immediately

### "Type safety is not optional"
- Every function has proper types
- Every component has proper props
- Every API response is validated
- Every error is handled gracefully

### "Performance is a feature"
- Optimize from the start
- Monitor and measure
- Use proper caching
- Implement lazy loading

### "Security is everyone's responsibility"
- Validate all inputs
- Sanitize all outputs
- Use proper authentication
- Implement proper authorization
- Regular security reviews

---

## 📚 ADDITIONAL RESOURCES

### Essential Tools
- **TypeScript**: For type safety
- **ESLint**: For code quality
- **Prettier**: For code formatting
- **Husky**: For git hooks
- **Jest**: For testing
- **React Testing Library**: For component testing
- **Cypress**: For E2E testing

### Useful Libraries
- **Zod**: For runtime validation
- **React Query**: For server state management
- **Zustand**: For client state management
- **React Hook Form**: For form handling
- **Framer Motion**: For animations
- **Recharts**: For data visualization

### Monitoring & Analytics
- **Sentry**: For error tracking
- **Vercel Analytics**: For performance monitoring
- **Google Analytics**: For user analytics
- **LogRocket**: For session replay
- **Hotjar**: For user behavior analysis

---

## 🎉 CONCLUSION

This template provides a comprehensive foundation for building robust, scalable applications. Remember:

1. **Plan before you code** - Architecture first approach
2. **Type safety is crucial** - Don't skip TypeScript
3. **Test continuously** - Automated testing saves time
4. **Monitor performance** - Measure and optimize
5. **Security matters** - Implement best practices
6. **Document everything** - Future you will thank you
7. **Automate deployment** - CI/CD is essential
8. **Plan for scale** - Build with growth in mind

Use this template as a starting point and customize it for your specific needs. The key is to establish good practices early and maintain them throughout development.

Happy coding! 🚀
