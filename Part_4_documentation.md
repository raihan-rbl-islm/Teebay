# Teebay - Technical Documentation

## Overview

This document provides a comprehensive technical overview of the Teebay marketplace application, detailing the implementation approach for each major feature, architectural decisions, and edge cases handled. This documentation is intended for engineering teams who need to understand, maintain, or extend the application.

---

## Part 1: User Authentication (Login & Registration)

### Implementation Overview

The authentication system implements a stateless JWT-based approach, allowing users to register new accounts and authenticate existing ones.

### Backend Implementation

#### GraphQL Schema Design

```graphql
type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  logout: Boolean!
}

type AuthPayload {
  token: String!
  user: User!
}
```

**Design Decision**: The `AuthPayload` type returns both the JWT token and user data in a single response, eliminating the need for a separate user query after authentication.

#### Registration Flow

**Location**: `server/src/resolvers/mutations.ts` - `register` function

**Implementation Steps**:
1. **Email Uniqueness Check**: Before creating a user, the system checks if an account with the provided email already exists using Prisma's `findUnique` method.
2. **User Creation**: If email is unique, a new user record is created with all provided information.
3. **Token Generation**: A JWT token is generated using the `generateToken` utility function, encoding the user's ID.
4. **Response**: Returns both the token and sanitized user data (excluding password).

**Key Code**:
```typescript
const existingUser = await prisma.user.findUnique({
  where: { email: input.email },
});

if (existingUser) {
  throw new ConflictError('User already exists with this email');
}
```

#### Login Flow

**Location**: `server/src/resolvers/mutations.ts` - `login` function

**Implementation Steps**:
1. **User Lookup**: Searches for user by email address.
2. **Password Verification**: Compares provided password with stored password (plain text comparison per project requirements).
3. **Token Generation**: On successful authentication, generates a new JWT token.
4. **Response**: Returns token and user data.

**Security Note**: Currently, passwords are stored in plain text. The `password.ts` utility file contains commented-out bcrypt implementation for future production use.

#### JWT Token Management

**Location**: `server/src/utils/auth.ts`

**Key Functions**:
- `generateToken(userId: number)`: Creates a JWT token with user ID payload
- `getUserIdFromRequest(req: Request)`: Extracts and validates token from Authorization header
- `verifyToken(token: string)`: Validates token and returns payload

**Token Format**: `Bearer <token>` in Authorization header

**Expiration**: Configurable via `JWT_EXPIRES_IN` environment variable (default: 7 days)

### Frontend Implementation

#### Registration Component

**Location**: `client/src/pages/Register.tsx`

**Features**:
- Multi-field form with client-side validation
- Email format validation using regex
- Password strength validation (minimum 6 characters)
- Password confirmation matching
- Automatic token storage and redirect on success

**Form Validation**:
```typescript
validate: {
  email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email address'),
  password: (val) => (val.length < 6 ? 'Password must be at least 6 characters' : null),
  confirmPassword: (val, values) => (val !== values.password ? 'Passwords do not match' : null),
}
```

#### Login Component

**Location**: `client/src/pages/Login.tsx`

**Features**:
- Email and password input fields
- Client-side email format validation
- Error message display from backend
- Token storage in localStorage
- Hard page reload to ensure Apollo Client picks up new token

**Key Implementation**:
```typescript
if (data?.login?.token) {
  localStorage.setItem('token', data.login.token);
  window.location.href = '/'; // Force reload
}
```

#### Protected Routes

**Location**: `client/src/components/Layout.tsx`

**Implementation**: The Layout component acts as an authentication guard, checking for token presence in localStorage before rendering protected routes.

**Flow**:
1. Check `localStorage.getItem('token')`
2. If no token exists, redirect to `/login`
3. If token exists, render Navbar and child routes via React Router's `<Outlet />`

### Corner Cases Handled

1. **Duplicate Email Registration**
   - **Issue**: User attempts to register with existing email
   - **Solution**: Backend throws `ConflictError` with clear message
   - **Frontend**: Error displayed to user via Apollo Client error handling

2. **Invalid Credentials**
   - **Issue**: User provides wrong email/password combination
   - **Solution**: Backend throws `AuthenticationError` with generic message (prevents email enumeration)
   - **Frontend**: Error message displayed in form

3. **Expired or Invalid Tokens**
   - **Issue**: User has invalid/expired token in localStorage
   - **Solution**: `getUserIdFromRequest` returns `null`, protected resolvers throw `AuthenticationError`
   - **Frontend**: Layout component redirects to login if token check fails

4. **Missing Authorization Header**
   - **Issue**: Request made without Authorization header
   - **Solution**: `getUserIdFromRequest` gracefully returns `null`, allowing optional authentication for public queries

---

## Part 2: Product Management (Add, Edit, Delete)

### Implementation Overview

Product management allows authenticated users to create, update, and delete their product listings. Products support dual pricing models (purchase and/or rental) with multi-category classification.

### Backend Implementation

#### GraphQL Schema

```graphql
type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: Int!, input: UpdateProductInput!): Product!
  deleteProduct(id: Int!): Boolean!
}

input CreateProductInput {
  title: String!
  description: String!
  categories: [Category!]!
  price: Float
  rentPrice: Float
  rentType: RentType
}
```

#### Create Product

**Location**: `server/src/resolvers/mutations.ts` - `createProduct` function

**Validation Logic**:
1. **Authentication Check**: Verifies user is logged in
2. **Pricing Validation**: Ensures at least one of `price` or `rentPrice` is provided
3. **Rental Validation**: If `rentPrice` is provided, `rentType` must also be provided
4. **Product Creation**: Creates product with authenticated user as owner

**Key Validation Code**:
```typescript
// Validate that at least one pricing option is provided
if (!input.price && !input.rentPrice) {
  throw new ValidationError('Product must have either a purchase price or rental price');
}

// Validate that if rentPrice is provided, rentType must also be provided
if (input.rentPrice && !input.rentType) {
  throw new ValidationError('Rental type is required when rental price is set');
}
```

#### Update Product

**Location**: `server/src/resolvers/mutations.ts` - `updateProduct` function

**Authorization Flow**:
1. **Authentication Check**: Verifies user is logged in
2. **Product Existence**: Verifies product exists
3. **Ownership Verification**: Ensures user owns the product
4. **Post-Update Validation**: Validates that after update, at least one price remains
5. **Selective Update**: Only updates fields that are explicitly provided (undefined fields are ignored)

**Key Code**:
```typescript
// Calculate final values after update
const finalPrice = input.price !== undefined ? input.price : product.price;
const finalRentPrice = input.rentPrice !== undefined ? input.rentPrice : product.rentPrice;
const finalRentType = input.rentType !== undefined ? input.rentType : product.rentType;

// Validate final state
if (!finalPrice && !finalRentPrice) {
  throw new ValidationError('Product must have either a purchase price or rental price');
}
```

#### Delete Product

**Location**: `server/src/resolvers/mutations.ts` - `deleteProduct` function

**Flow**:
1. **Authentication & Authorization**: Verifies user owns the product
2. **Cascade Deletion**: Prisma schema configured with `onDelete: Cascade`, automatically deletes related transactions

### Frontend Implementation

#### Multi-Step Product Creation Form

**Location**: `client/src/pages/AddProduct.tsx`

**Architecture**: Uses a single form instance (`useForm`) with step-based validation, allowing users to navigate forward and backward through the creation process.

**Steps**:
1. **Step 0 - Title**: Product title input
2. **Step 1 - Categories**: Multi-select category dropdown
3. **Step 2 - Description**: Textarea for product description
4. **Step 3 - Pricing**: Purchase price and rental price/type inputs
5. **Step 4 - Summary**: Review all entered information before submission

**Step Validation**:
```typescript
validate: {
  title: (val) => (activeStep === 0 && !val ? 'Title is required' : null),
  categories: (val) => (activeStep === 1 && val.length === 0 ? 'Select at least one category' : null),
  description: (val) => (activeStep === 2 && !val ? 'Description is required' : null),
  price: (val, values) => {
    if (activeStep === 3) {
      if (!val && !values.rentPrice) return 'You must set a Purchase Price OR Rent Price';
    }
    return null;
  }
}
```

**Data Sanitization**: Before submission, the form converts string inputs to numbers and only includes `rentType` if `rentPrice` is provided:

```typescript
const payload = {
  title: values.title,
  description: values.description,
  categories: values.categories,
  price: values.price ? parseFloat(String(values.price)) : null,
  rentPrice: values.rentPrice ? parseFloat(String(values.rentPrice)) : null,
  rentType: rentPrice ? values.rentType : null, // Only if rentPrice exists
};
```

#### Edit Product Form

**Location**: `client/src/pages/EditProduct.tsx`

**Implementation**:
1. **Data Fetching**: Uses `GET_PRODUCT_DETAILS` query to fetch current product data
2. **Form Population**: `useEffect` hook populates form when data arrives
3. **Update Mutation**: Sends only changed fields to backend
4. **Cache Refetch**: Automatically refetches `GET_MY_PRODUCTS` after successful update

**Key Implementation**:
```typescript
useEffect(() => {
  if (data?.product) {
    form.setValues({
      title: data.product.title,
      categories: data.product.categories,
      // ... other fields
    });
  }
}, [data]);
```

#### Delete Product

**Location**: `client/src/pages/Dashboard.tsx` - `ProductCard` component

**Implementation**:
- Delete button with confirmation modal
- Apollo Client cache eviction after deletion
- Optimistic UI update using cache manipulation

**Cache Management**:
```typescript
const [deleteProduct] = useMutation(DELETE_PRODUCT, {
  update(cache) {
    const normalizedId = cache.identify({ id: product.id, __typename: 'Product' });
    cache.evict({ id: normalizedId });
    cache.gc(); // Garbage collect
  }
});
```

### Corner Cases Handled

1. **Empty Pricing Options**
   - **Issue**: User attempts to create product without price or rentPrice
   - **Solution**: Backend validation ensures at least one pricing option exists
   - **Frontend**: Step 3 validation prevents progression without pricing

2. **Rent Price Without Rent Type**
   - **Issue**: User sets rentPrice but forgets to select rentType
   - **Solution**: Backend validation throws error if rentPrice exists without rentType
   - **Frontend**: Form ensures rentType is selected when rentPrice is entered

3. **Updating Product to Remove All Pricing**
   - **Issue**: User updates product and removes both price and rentPrice
   - **Solution**: Backend calculates final values and validates before update
   - **Prevention**: Validation ensures at least one price remains after update

4. **Unauthorized Product Modification**
   - **Issue**: User attempts to edit/delete another user's product
   - **Solution**: Backend checks ownership before allowing modification
   - **Error**: Throws `AuthorizationError` with clear message

5. **Deleting Product with Transactions**
   - **Issue**: Product has associated transaction history
   - **Solution**: Prisma cascade delete automatically removes related transactions
   - **Database**: Schema configured with `onDelete: Cascade`

6. **Form Data Type Conversion**
   - **Issue**: NumberInput components return strings, but GraphQL expects Float
   - **Solution**: Explicit `parseFloat()` conversion before sending to API
   - **Edge Case**: Handles empty strings by converting to `null`

---

## Part 3: Marketplace & Transactions

### Implementation Overview

The marketplace allows users to browse available products, purchase or rent items, and view their complete transaction history across four categories: Bought, Sold, Borrowed, and Lent.

### Backend Implementation

#### Product Listing Queries

**Location**: `server/src/resolvers/queries.ts`

##### All Products (Marketplace)

**Query**: `allProducts`

**Logic**:
- Returns products where `isSold = false`
- Excludes products owned by the current user (if authenticated)
- Orders by most recently posted
- Includes owner information for display

**Key Implementation**:
```typescript
return prisma.product.findMany({
  where: {
    isSold: false,
    ...(userId ? { ownerId: { not: userId } } : {}),
  },
  orderBy: { datePosted: 'desc' },
  include: { owner: true },
});
```

**Design Decision**: Uses conditional spread operator to handle both authenticated and guest users gracefully.

##### Single Product Details

**Query**: `product(id: Int!)`

**View Tracking Logic**:
- Fetches product with owner information
- Checks if viewer is the product owner
- **Owner View**: Returns product without incrementing view count (prevents self-inflation)
- **Non-Owner View**: Increments view count atomically using Prisma's `increment` operation

**Key Code**:
```typescript
if (currentUserId && product.ownerId === currentUserId) {
  return product; // Owner viewing - no view increment
}

// Non-owner viewing - increment views
return prisma.product.update({
  where: { id: productId },
  data: { views: { increment: 1 } },
  include: { owner: true },
});
```

#### Purchase Product

**Location**: `server/src/resolvers/mutations.ts` - `buyProduct` function

**Transaction Flow** (using Prisma transactions for atomicity):
1. **Product Validation**: Verifies product exists
2. **Sold Status Check**: Ensures product is not already sold
3. **Ownership Check**: Prevents users from buying their own products
4. **Price Validation**: Ensures product has a purchase price set
5. **Atomic Update**: Within a database transaction:
   - Marks product as `isSold = true`
   - Creates transaction record with type `BUY`

**Key Implementation**:
```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUnique({ where: { id: pid } });
  
  if (product.isSold) {
    throw new ConflictError('Product is already sold');
  }
  
  if (!product.price) {
    throw new ValidationError('Product does not have a purchase price set');
  }
  
  await tx.product.update({
    where: { id: pid },
    data: { isSold: true },
  });
  
  await tx.transaction.create({
    data: { type: TransactionType.BUY, userId, productId: pid },
  });
});
```

**Why Transactions?**: Ensures data consistency - if transaction record creation fails, product won't be marked as sold, preventing orphaned states.

#### Rent Product

**Location**: `server/src/resolvers/mutations.ts` - `rentProduct` function

**Validation Flow**:
1. **Product Existence**: Verifies product exists
2. **Sold Status**: Cannot rent a sold product
3. **Ownership Check**: Prevents renting own products
4. **Rental Configuration**: Validates product has `rentPrice` and `rentType` set
5. **Date Validation**:
   - Validates date format
   - Ensures end date is after start date
   - Ensures start date is not in the past
6. **Transaction Creation**: Creates rental transaction with date range

**Key Validation**:
```typescript
if (product.isSold) {
  throw new ConflictError('Cannot rent a product that is already sold');
}

if (!product.rentPrice || !product.rentType) {
  throw new ValidationError('Product does not have rental options configured');
}

if (startDate < now) {
  throw new ValidationError('Start date cannot be in the past');
}
```

**Note**: Unlike purchases, rentals don't mark products as sold, allowing multiple rental transactions for the same product.

#### Transaction History

**Location**: `server/src/resolvers/queries.ts` - `myTransactionHistory` function

**Filter Logic**: Maps filter strings to Prisma where clauses:

- **BOUGHT**: Transactions where `userId = currentUser` AND `type = BUY`
- **SOLD**: Transactions where `product.ownerId = currentUser` AND `type = BUY`
- **BORROWED**: Transactions where `userId = currentUser` AND `type = RENT`
- **LENT**: Transactions where `product.ownerId = currentUser` AND `type = RENT`

**Key Implementation**:
```typescript
const filterMap: Record<string, any> = {
  BOUGHT: { userId: userId, type: TransactionType.BUY },
  SOLD: { product: { ownerId: userId }, type: TransactionType.BUY },
  BORROWED: { userId: userId, type: TransactionType.RENT },
  LENT: { product: { ownerId: userId }, type: TransactionType.RENT },
};
```

**Design Decision**: Uses nested Prisma queries for SOLD and LENT filters to query by product owner, enabling the same transaction record to appear in different tabs based on perspective.

### Frontend Implementation

#### Marketplace View

**Location**: `client/src/pages/AllProducts.tsx`

**Features**:
- Displays all available products (excluding user's own)
- Shows product preview with truncated description
- "More Details" link navigates to product details page
- Displays view count and date posted

**Query Strategy**: Uses `fetchPolicy: 'network-only'` to ensure fresh data on each visit.

#### Product Details Page

**Location**: `client/src/pages/ProductDetails.tsx`

**Buy/Rent Button Logic**:
- **Sold Products**: Hides Buy/Rent buttons, shows "This product has been sold" message
- **Rental Button**: Only shown if product has both `rentPrice` and `rentType` configured
- **Purchase Button**: Only shown if product has `price` set

**Key Implementation**:
```typescript
{!product.isSold && (
  <>
    {product.rentPrice && product.rentType && (
      <Button onClick={() => setRentModalOpen(true)}>Rent</Button>
    )}
    {product.price && (
      <Button onClick={() => setBuyModalOpen(true)}>Buy</Button>
    )}
  </>
)}
{product.isSold && (
  <Text c="red" fw={500}>This product has been sold</Text>
)}
```

**Rental Modal**: Uses native HTML5 date inputs for date selection, with validation to ensure both dates are selected before allowing submission.

#### Transaction History

**Location**: `client/src/pages/Transactions.tsx`

**Tab-Based Filtering**:
- Uses Mantine's `Tabs` component
- Each tab triggers a new query with different filter value
- Handles null filter state to prevent query errors

**Key Implementation**:
```typescript
const { data, loading, error } = useQuery(GET_TRANSACTION_HISTORY, {
  variables: { filter: activeTab || 'BOUGHT' },
  fetchPolicy: 'network-only',
  skip: !activeTab, // Prevents query with null filter
});
```

**Transaction Card Display**:
- Shows product details for each transaction
- Displays rental period (start/end dates) for RENT transactions
- Shows transaction creation date
- Clickable cards navigate to product details

### Corner Cases Handled

1. **Race Condition in Purchase**
   - **Issue**: Multiple users attempt to buy the same product simultaneously
   - **Solution**: Database transaction ensures atomicity - first transaction succeeds, subsequent ones fail with "already sold" error
   - **Implementation**: Prisma `$transaction` wrapper ensures all-or-nothing execution

2. **Renting Sold Products**
   - **Issue**: User attempts to rent a product that was just sold
   - **Solution**: Backend validation checks `isSold` status before allowing rental
   - **Error**: Clear error message: "Cannot rent a product that is already sold"

3. **Renting Own Products**
   - **Issue**: User attempts to rent their own product
   - **Solution**: Backend ownership check prevents this
   - **Error**: "Cannot rent your own product"

4. **Invalid Date Ranges**
   - **Issue**: User selects end date before start date, or start date in the past
   - **Solution**: Backend validates date logic before creating transaction
   - **Frontend**: Disables submit button until valid dates are selected

5. **Product Without Pricing Options**
   - **Issue**: User attempts to buy product without price, or rent product without rental configuration
   - **Solution**: Backend validates pricing configuration before allowing transaction
   - **Frontend**: Buttons only shown when appropriate pricing exists

6. **View Count Inflation**
   - **Issue**: Product owners viewing their own products would inflate view counts
   - **Solution**: View count only increments for non-owners
   - **Implementation**: Ownership check before view increment

7. **Transaction History Filter Edge Cases**
   - **Issue**: Invalid filter string or null filter
   - **Solution**: Backend returns empty array for invalid filters, frontend skips query if filter is null
   - **Prevention**: Default filter value and skip condition in Apollo query

8. **Missing Product in Transaction History**
   - **Issue**: Product associated with transaction was deleted
   - **Solution**: Prisma schema uses `onDelete: Cascade` for transactions, but `onDelete: Restrict` for product relation prevents orphaned transactions
   - **Note**: In current implementation, product deletion cascades to transactions, so this case shouldn't occur

---

## Architecture Decisions & Best Practices

### 1. Modular Resolver Structure

**Decision**: Split resolvers into separate files (`queries.ts`, `mutations.ts`, `fieldResolvers.ts`)

**Rationale**:
- Improves code organization and maintainability
- Makes it easier to locate specific resolver logic
- Reduces file size and cognitive load
- Enables better code reusability

### 2. Centralized Error Handling

**Decision**: Custom error classes (`AuthenticationError`, `ValidationError`, `NotFoundError`, etc.)

**Rationale**:
- Consistent error messages across the application
- Proper HTTP status codes for different error types
- Easier error handling in frontend
- Better debugging and logging capabilities

### 3. GraphQL Field Resolvers

**Decision**: Separate field resolvers for date serialization and relation fetching

**Rationale**:
- GraphQL doesn't have native Date type - strings are used
- Allows lazy loading of relations (owner, product)
- Keeps resolver logic clean and focused
- Enables future optimization (e.g., DataLoader for N+1 queries)

### 4. Client-Side Cache Management

**Decision**: Apollo Client cache eviction and refetch strategies

**Rationale**:
- Optimistic UI updates improve user experience
- Reduces unnecessary network requests
- Ensures UI consistency after mutations
- `refetchQueries` keeps data fresh after mutations

### 5. Environment-Based Configuration

**Decision**: Centralized config module with validation

**Rationale**:
- Type-safe configuration access
- Early error detection (missing env vars)
- Easy to extend for production needs
- Single source of truth for configuration

### 6. Database Transaction Usage

**Decision**: Use Prisma transactions for multi-step operations (buyProduct)

**Rationale**:
- Ensures data consistency
- Prevents race conditions
- Atomic operations prevent partial updates
- Critical for financial/transaction operations

---

## Security Considerations

### Current Implementation

1. **JWT Token Storage**: Tokens stored in `localStorage` (client-side)
   - **Trade-off**: Vulnerable to XSS attacks, but simpler than httpOnly cookies
   - **Mitigation**: Input sanitization, CSP headers (recommended for production)

2. **Password Storage**: Currently plain text (per project requirements)
   - **Production Note**: `password.ts` utility contains commented bcrypt implementation
   - **Recommendation**: Enable password hashing before production deployment

3. **Authorization Checks**: All mutations verify user ownership/authentication
   - **Implementation**: Consistent use of `getUserIdFromRequest` and ownership checks
   - **Coverage**: All product mutations, transaction mutations

4. **Input Validation**: Both client and server-side validation
   - **Client**: Immediate feedback, better UX
   - **Server**: Security layer, prevents malicious requests

### Recommendations for Production

1. Implement password hashing (bcrypt)
2. Add rate limiting for authentication endpoints
3. Implement refresh token mechanism
4. Add CORS restrictions (currently allows all origins)
5. Add input sanitization for XSS prevention
6. Implement request logging and monitoring
7. Add database connection pooling
8. Implement proper error logging (avoid exposing stack traces)

---

## Performance Considerations

### Current Optimizations

1. **View Count Increment**: Only increments for non-owners, reducing unnecessary writes
2. **Selective Field Updates**: Update mutations only modify provided fields
3. **GraphQL Query Optimization**: Clients request only needed fields
4. **Cache Strategies**: Apollo Client cache reduces redundant queries

### Potential Improvements

1. **DataLoader Implementation**: Batch and cache database queries to prevent N+1 problems
2. **Pagination**: Implement cursor-based pagination for product lists
3. **Image Optimization**: If images are added, implement CDN and compression
4. **Database Indexing**: Add indexes on frequently queried fields (ownerId, isSold, datePosted)
5. **Query Complexity Analysis**: Implement GraphQL query depth/complexity limits

---

## Testing Recommendations

### Unit Tests

1. **Resolver Functions**: Test each resolver with various input scenarios
2. **Validation Logic**: Test edge cases in validation functions
3. **Error Handling**: Test error scenarios and error message accuracy

### Integration Tests

1. **Authentication Flow**: Test complete register/login/logout flow
2. **Product CRUD**: Test product creation, update, deletion with various inputs
3. **Transaction Flow**: Test purchase and rental with edge cases
4. **Authorization**: Test unauthorized access attempts

### E2E Tests

1. **User Journey**: Complete user flow from registration to transaction
2. **Multi-User Scenarios**: Test concurrent purchases, race conditions
3. **Error Scenarios**: Test error handling and user feedback

---

## Conclusion

This documentation provides a comprehensive overview of the Teebay marketplace implementation. The application follows modern best practices with a clear separation of concerns, robust error handling, and thoughtful edge case management. The modular architecture makes it maintainable and extensible for future enhancements.

For questions or clarifications, please refer to the inline code comments or contact the development team.
